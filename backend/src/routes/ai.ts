import { Router } from 'express'
import { prisma } from '../config/db'
import { groq } from '../lib/groq'
import { authenticate } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

// ── POST /api/ai/routine-planner ──────────────────────────────────────────────
// Given a saved route ID + target arrival time, fetch nearby alerts and ask
// Groq for a safe travel recommendation.
router.post('/routine-planner', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { route_id, arrival_time } = req.body
    if (!route_id) {
      return res.status(400).json({ message: 'route_id is required' })
    }

    const id = parseInt(route_id)
    if (isNaN(id)) {
      return res.status(400).json({ message: 'route_id must be a number' })
    }

    // Fetch the saved route — must belong to the requesting user
    const route = await prisma.savedRoute.findUnique({ where: { id } })
    if (!route || route.userId !== req.userId) {
      return res.status(404).json({ message: 'Route not found' })
    }

    // Fetch alerts within a ~0.2 degree bounding box around the route
    const delta = 0.2
    const minLat = Math.min(route.startLat, route.endLat) - delta
    const maxLat = Math.max(route.startLat, route.endLat) + delta
    const minLng = Math.min(route.startLng, route.endLng) - delta
    const maxLng = Math.max(route.startLng, route.endLng) + delta

    const nearbyAlerts = await prisma.alert.findMany({
      where: {
        locationLat: { gte: minLat, lte: maxLat },
        locationLng: { gte: minLng, lte: maxLng },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const alertSummary =
      nearbyAlerts.length === 0
        ? 'No active alerts detected near this route.'
        : nearbyAlerts
            .map(
              a =>
                `- [${a.alertType}] ${a.title}: ${a.description} ` +
                `(at ${a.locationLat.toFixed(4)}, ${a.locationLng.toFixed(4)})`
            )
            .join('\n')

    const prompt = `You are SRANS, an AI-powered smart navigation assistant for daily commuters.

Route name: "${route.name}"
Start coordinates: (${route.startLat}, ${route.startLng})
End coordinates:   (${route.endLat}, ${route.endLng})
Target arrival time: ${arrival_time ?? 'not specified'}

Active regional alerts near this route:
${alertSummary}

Based on these alerts, provide a concise, practical travel recommendation. Include:
1. Whether the route is currently safe or has disruptions from construction, utility work, diversions, or natural disasters
2. The best departure time to arrive by ${arrival_time ?? 'the target time'}
3. Any specific roads or areas to avoid
4. An alternative approach if disruptions are severe

Keep your response under 150 words. Write in a helpful, conversational tone.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    })

    const recommendation =
      completion.choices[0]?.message?.content ??
      'Unable to generate a recommendation at this time. Please try again.'

    return res.json({ recommendation })
  } catch (err) {
    console.error('[POST /ai/routine-planner]', err)
    return res.status(500).json({ message: 'AI recommendation failed. Please try again.' })
  }
})

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
// Conversational travel assistant — answers commuter questions using live
// alert context from the database.
router.post('/chat', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { message } = req.body
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'message is required' })
    }

    // Fetch recent alerts to give the AI context
    const recentAlerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    })

    const alertContext =
      recentAlerts.length === 0
        ? 'No active regional alerts at this time.'
        : recentAlerts
            .map(a => `- [${a.alertType}] ${a.title}: ${a.description}`)
            .join('\n')

    const systemPrompt = `You are SRANS Travel Assistant, an AI that helps commuters navigate safely around road disruptions, infrastructure projects, utility work, traffic diversions, and natural disasters like flooding.

Current regional alerts:
${alertContext}

Answer the user's question helpfully and concisely. Focus on travel safety, route planning, and regional conditions. Keep your response under 200 words.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() },
      ],
      max_tokens: 400,
      temperature: 0.7,
    })

    const reply =
      completion.choices[0]?.message?.content ??
      'Sorry, I could not process your request right now.'

    return res.json({ reply })
  } catch (err) {
    console.error('[POST /ai/chat]', err)
    return res.status(500).json({ message: 'Chat failed. Please try again.' })
  }
})

// ── POST /api/ai/detect-alerts ────────────────────────────────────────────────
// Takes the user's current lat/lng, asks Groq to reason about real-world
// hazards likely present in that area right now (based on geography, season,
// time of day, and existing DB alerts). Any new hazards detected are
// auto-created in the DB under the ai_system user and returned to the client.
router.post('/detect-alerts', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { lat, lng } = req.body
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required' })
    }

    const userLat = Number(lat)
    const userLng = Number(lng)
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: 'lat and lng must be numbers' })
    }

    // Fetch alerts already in DB near this location (0.15° ≈ ~16 km box)
    const delta = 0.15
    const existing = await prisma.alert.findMany({
      where: {
        locationLat: { gte: userLat - delta, lte: userLat + delta },
        locationLng: { gte: userLng - delta, lte: userLng + delta },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const existingSummary = existing.length === 0
      ? 'None.'
      : existing.map(a => `- [${a.alertType}] ${a.title}: ${a.description}`).join('\n')

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    const hour = now.getHours()
    const timeContext = hour < 6 ? 'late night' : hour < 10 ? 'morning rush hour' : hour < 17 ? 'daytime' : hour < 21 ? 'evening rush hour' : 'night'

    const prompt = `You are SRANS, an AI hazard detection system for Indian roads and infrastructure.

Current date/time: ${dateStr}, ${timeStr} (${timeContext})
User location: latitude ${userLat.toFixed(4)}, longitude ${userLng.toFixed(4)}

Alerts already recorded near this location:
${existingSummary}

Based on:
1. The geographic location (use your knowledge of Indian cities and regions near these coordinates)
2. The current time of day (${timeContext})
3. Typical seasonal/regional hazards for this area
4. What is NOT already recorded above

Identify up to 2 NEW potential hazards that are realistically likely right now but NOT already in the list above.
For each hazard, respond with EXACTLY this JSON format (nothing else — pure JSON array):

[
  {
    "title": "Short alert title (max 60 chars)",
    "description": "Practical description for commuters (max 120 chars)",
    "alert_type": "Traffic" | "Emergency" | "Construction" | "Weather",
    "location_lat": <number within 0.05 degrees of ${userLat.toFixed(4)}>,
    "location_lng": <number within 0.05 degrees of ${userLng.toFixed(4)}>
  }
]

If no new hazards are likely, respond with an empty array: []
Only include alerts that are genuinely plausible. Do not fabricate implausible hazards.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.4,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'

    // Parse Groq's JSON response safely
    let detected: Array<{
      title: string
      description: string
      alert_type: string
      location_lat: number
      location_lng: number
    }> = []

    try {
      // Extract JSON array even if Groq wraps it in markdown code fences
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        detected = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Groq didn't return valid JSON — treat as no hazards
      detected = []
    }

    // Validate types
    const VALID_TYPES = ['Traffic', 'Emergency', 'Construction', 'Weather']
    detected = detected.filter(d =>
      d.title && d.description &&
      VALID_TYPES.includes(d.alert_type) &&
      typeof d.location_lat === 'number' &&
      typeof d.location_lng === 'number'
    )

    if (detected.length === 0) {
      return res.json({ created: 0, alerts: [] })
    }

    // Get the AI system user (created by seed-ai-user.ts)
    const aiUser = await prisma.user.findUnique({ where: { username: 'ai_system' } })
    if (!aiUser) {
      return res.status(500).json({ message: 'AI system user not found. Run: npx tsx seed-ai-user.ts' })
    }

    // Check for near-duplicates before inserting (same type + within 0.01° ≈ 1 km)
    const toCreate = []
    for (const d of detected) {
      const duplicate = await prisma.alert.findFirst({
        where: {
          alertType: d.alert_type,
          locationLat: { gte: d.location_lat - 0.01, lte: d.location_lat + 0.01 },
          locationLng: { gte: d.location_lng - 0.01, lte: d.location_lng + 0.01 },
          createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // within last 2 hours
        },
      })
      if (!duplicate) toCreate.push(d)
    }

    if (toCreate.length === 0) {
      return res.json({ created: 0, alerts: [] })
    }

    // Batch create all new alerts
    const created = await prisma.$transaction(
      toCreate.map(d =>
        prisma.alert.create({
          data: {
            title: d.title.slice(0, 120),
            description: d.description.slice(0, 300),
            alertType: d.alert_type,
            locationLat: d.location_lat,
            locationLng: d.location_lng,
            authorId: aiUser.id,
          },
        })
      )
    )

    console.log(`[AI detect-alerts] Created ${created.length} alert(s) near (${userLat}, ${userLng})`)

    return res.json({
      created: created.length,
      alerts: created.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        alert_type: a.alertType,
        location_lat: a.locationLat,
        location_lng: a.locationLng,
        created_at: a.createdAt,
      })),
    })
  } catch (err) {
    console.error('[POST /ai/detect-alerts]', err)
    return res.status(500).json({ message: 'Alert detection failed. Please try again.' })
  }
})

// ── POST /api/ai/navigation-chat ─────────────────────────────────────────────
// In-journey AI chat — user can ask questions while navigating. Receives the
// active route context (start/end coords, current step instruction, nearby
// alerts) so the AI can give hyper-relevant answers.
router.post('/navigation-chat', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { message, start_lat, start_lng, end_lat, end_lng, current_step, total_distance, total_time } = req.body

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'message is required' })
    }

    // Build route context string
    const hasRoute = start_lat !== undefined && start_lng !== undefined && end_lat !== undefined && end_lng !== undefined
    const routeContext = hasRoute
      ? `The user is currently navigating from (${Number(start_lat).toFixed(4)}, ${Number(start_lng).toFixed(4)}) to (${Number(end_lat).toFixed(4)}, ${Number(end_lng).toFixed(4)}).` +
        (total_distance ? ` Total route distance: ${total_distance}.` : '') +
        (total_time ? ` Estimated travel time: ${total_time}.` : '') +
        (current_step ? ` Current navigation instruction: "${current_step}".` : '')
      : 'The user is on the map page but has not started navigation yet.'

    // Fetch alerts near the route bounding box (if route coords provided)
    let nearbyAlerts: any[] = []
    if (hasRoute) {
      const delta = 0.3
      const minLat = Math.min(Number(start_lat), Number(end_lat)) - delta
      const maxLat = Math.max(Number(start_lat), Number(end_lat)) + delta
      const minLng = Math.min(Number(start_lng), Number(end_lng)) - delta
      const maxLng = Math.max(Number(start_lng), Number(end_lng)) + delta

      nearbyAlerts = await prisma.alert.findMany({
        where: {
          locationLat: { gte: minLat, lte: maxLat },
          locationLng: { gte: minLng, lte: maxLng },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      })
    } else {
      nearbyAlerts = await prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    }

    const alertContext =
      nearbyAlerts.length === 0
        ? 'No active alerts detected along this route.'
        : nearbyAlerts
            .map(a => `- [${a.alertType}] ${a.title}: ${a.description}`)
            .join('\n')

    const systemPrompt = `You are SRANS Navigation Assistant, an AI co-pilot that helps users navigate safely in real time.

${routeContext}

Active alerts along or near this route:
${alertContext}

Answer the user's question helpfully and concisely. You are a friendly co-pilot — be direct, practical, and safety-focused. Keep your response under 150 words. If the user asks about their current route, use the context above to give specific guidance.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() },
      ],
      max_tokens: 300,
      temperature: 0.6,
    })

    const reply =
      completion.choices[0]?.message?.content ??
      'Sorry, I could not process your request right now.'

    return res.json({ reply })
  } catch (err) {
    console.error('[POST /ai/navigation-chat]', err)
    return res.status(500).json({ message: 'Navigation chat failed. Please try again.' })
  }
})

// ── POST /api/ai/daily-briefing ───────────────────────────────────────────────
// Given a city name, fetch all active alerts, filter relevant ones, and use
// Groq to generate a personalised morning commute briefing for that city.
router.post('/daily-briefing', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { city, lat, lng } = req.body
    if (!city && (lat === undefined || lng === undefined)) {
      return res.status(400).json({ message: 'city or lat/lng is required' })
    }

    // Fetch all alerts, optionally filter by bounding box if coords provided
    let alerts
    if (lat !== undefined && lng !== undefined) {
      // Filter alerts within ~0.5 degree (~55km) of the user's location
      const delta = 0.5
      alerts = await prisma.alert.findMany({
        where: {
          locationLat: { gte: lat - delta, lte: lat + delta },
          locationLng: { gte: lng - delta, lte: lng + delta },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    } else {
      alerts = await prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    }

    const locationLabel = city ?? `coordinates (${lat}, ${lng})`

    if (alerts.length === 0) {
      return res.json({
        briefing: `Good news! There are currently no active regional alerts near ${locationLabel}. Your commute should be clear today.`,
        alertCount: 0,
      })
    }

    const alertList = alerts
      .map(a => `- [${a.alertType}] ${a.title}: ${a.description}`)
      .join('\n')

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

    const prompt = `You are SRANS, an AI-powered commuter assistant for daily travelers in India.

Today is ${dateStr} at ${timeStr}.
The commuter is located in or near: ${locationLabel}

Active regional alerts in this area:
${alertList}

Generate a concise, friendly morning commute briefing for this commuter. Include:
1. A one-line overall status (clear / minor disruptions / major disruptions)
2. The 2-3 most important alerts they need to know about before leaving
3. Any roads, areas, or routes they should specifically avoid
4. A practical departure recommendation (leave early, take alternate route, etc.)

Format as short bullet points. Keep it under 180 words. Be specific about locations and disruption types. Write like a helpful local navigation assistant.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 350,
      temperature: 0.6,
    })

    const briefing =
      completion.choices[0]?.message?.content ??
      'Unable to generate briefing at this time. Please check the alerts feed directly.'

    return res.json({ briefing, alertCount: alerts.length })
  } catch (err) {
    console.error('[POST /ai/daily-briefing]', err)
    return res.status(500).json({ message: 'Failed to generate briefing. Please try again.' })
  }
})

export default router
