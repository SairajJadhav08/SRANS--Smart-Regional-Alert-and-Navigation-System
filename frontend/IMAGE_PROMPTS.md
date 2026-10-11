# SRANS — Image & Video Prompts

Prompts for every image and video slot in the frontend, with the exact file path, size, where it appears, and
what to type into an image or video generator (Midjourney, DALL·E, Ideogram, Firefly for images; Sora, Veo,
Runway, Kling, Pika for video).

**The site already works without any of these files.** Every slot is optional. The code hides an image or video
that isn't there, and the gradient/CSS design shows instead. To fill a slot, drop the file at its path and it
appears automatically, with no code changes. The one exception is the screenshot in §4, which needs a real
screen capture.

Logo: keep using the current `public/Logo.png`.

---

## Brand style guide

| Token | Hex | Use |
|---|---|---|
| Ink (deep forest) | `#073B33` / `#03201B` | Dark backgrounds, shadows |
| Emerald | `#10B981` / `#047857` | Safe routes, primary accents |
| Signal orange (from the logo beacon) | `#F07A1E` | AI, beacons, highlights (sparingly) |
| Hazard red / amber / blue / violet | `#DC2626` / `#D97706` / `#2563EB` / `#7C3AED` | Traffic / construction / weather / emergency |

**Style suffix**: append this to every image prompt:
`deep forest green #073B33 and emerald #10B981 colour grade with small signal-orange #F07A1E accents, premium modern editorial look, high detail, no text, no letters, no logos, no watermark`

**Export rules**
- Photos/illustrations → `.webp`, quality 80, under ~250 KB (hero poster under 300 KB).
- Keep the stated aspect ratio; the code crops with `object-fit: cover`.
- All files go in `frontend/public/…` exactly as listed (paths are case-sensitive on Vercel).

---

## 1. Landing page — Hero (top of `/`)

The hero is dark ink with the headline on the **left**. Media plays behind it at about 55% opacity, under a
dark-left gradient, so **keep the left 45% of every frame calm and dark**. Put the action on the right.

### 1a. Hero background video — *no longer used*

> The hero now shows `hero-poster.webp` as a framed photo on the right instead of a background video. `public/media/` can be deleted.

- **Paths:** `public/media/hero-loop.mp4` (H.264) **and** `public/media/hero-loop.webm` (VP9)
- **Spec:** 1920 × 1080, 24 fps, **8–12 s seamless loop**, no audio, under 4 MB (mp4) and 3 MB (webm)
- **Shown:** desktop/tablet only. Phones, reduced-motion and data-saver users see the poster (1b) instead.
- **Video prompt:**
  > Slow cinematic aerial drone shot gliding forward over a modern Indian city at blue hour, just after rain.
  > Wet roads reflect streetlights; long-exposure-style light trails of traffic flow along a flyover and a
  > wide arterial road. On the right side of the frame, a road section is closed for metro construction with
  > cranes and orange barricades glowing softly, and traffic smoothly diverting onto a parallel road highlighted
  > by a subtle emerald glow. The left third of the frame stays dark and calm (rooftops, sky). Smooth constant
  > camera speed, no cuts, no people close-up, seamless loop, deep teal-green colour grade with warm orange
  > highlights, photorealistic, 4K quality, no text, no logos.
- **Make it loop:** generate 10–12 s, then crossfade the last 1 s into the first 1 s in any editor. Or use
  ffmpeg:
  ```bash
  # compress + make both formats (run in the folder with your exported master.mp4)
  ffmpeg -i master.mp4 -an -vf "scale=1920:-2,fps=24" -c:v libx264 -crf 28 -preset slow -movflags +faststart hero-loop.mp4
  ffmpeg -i master.mp4 -an -vf "scale=1920:-2,fps=24" -c:v libvpx-vp9 -crf 38 -b:v 0 hero-loop.webm
  ```

### 1b. Hero poster image (video fallback + first frame)
- **Path:** `public/images/hero-poster.webp`
- **Size:** 1920 × 1080
- **Tip:** easiest is to export the first frame of the video:
  `ffmpeg -i hero-loop.mp4 -frames:v 1 -q:v 80 hero-poster.webp`
- **Image prompt (if generating separately):**
  > Aerial blue-hour photograph of a modern Indian city after rain, wet reflective roads with light trails on a
  > flyover, metro construction cranes and orange barricades on the right, traffic diverting onto a parallel road
  > with a faint emerald glow, left third of the frame dark rooftops and sky with empty space, cinematic,
  > photorealistic, 16:9.

---

## 2. Landing page — "Every reason your road might be blocked today" (hazard cards)

Four cards, each with an image header. Same camera height and lighting for all four so they read as a set.
- **Size:** 1280 × 800 (16:10), shown at about 320 px tall
- **Alt text** is already in the code.

| Path | Prompt |
|---|---|
| `public/images/hazard-traffic.webp` | Eye-level photograph of a congested Indian city junction at dusk, traffic police officer directing vehicles beside a stalled bus with hazard lights, red tail-lights glowing, shallow depth of field, cinematic, deep green grade with red accents. |
| `public/images/hazard-construction.webp` | Photograph of urban road construction in an Indian city: metro pillar work, orange-and-white barricades, a narrowed lane, excavator and workers in high-visibility vests, late-afternoon light, amber accents, documentary realism. |
| `public/images/hazard-weather.webp` | Photograph of a waterlogged city underpass during monsoon rain, scooters and a car slowly wading through, rain streaks in streetlight, reflections, moody blue-green tones, documentary realism. |
| `public/images/hazard-emergency.webp` | Photograph of an emergency response on a city road at night: fire engine and ambulance with flashing lights, police tape cordoning a lane, traffic diverted, violet and red light accents, cinematic, no injured people shown. |

---

## 3. Landing page — "How SRANS works" (3 steps)

One image per step card. Same illustration style for all three. **Size:** 1280 × 800 (16:10).

| Path | Prompt |
|---|---|
| `public/images/step-report.webp` | Clean 3D isometric illustration of a person on a city sidewalk holding a smartphone that shows a "report incident" map pin, a small waterlogged road patch and barricade nearby, soft studio lighting, deep forest green background, emerald and orange accents, no text on screen. |
| `public/images/step-analyse.webp` | Clean 3D isometric illustration of a city map tile floating above a dark green surface, glowing hazard markers in amber, blue and red connected by thin lines to a glowing orange AI spark node, an emerald route being calculated, soft lighting, no text. |
| `public/images/step-route.webp` | Clean 3D isometric illustration of a car following a glowing emerald route that curves around a closed road with barricades, destination pin with an orange beacon, miniature city blocks, deep forest green palette, soft lighting, no text. |

---

## 4. Landing page — "See it in action" (product screenshot)

- **Path:** `public/images/screenshot-today.webp`
- **Size:** 1600 × 1000 (16:10)
- **This must be a real screenshot, not AI-generated.** The whole section stays hidden until the file exists.
- **How to capture:**
  1. Run the app, sign in as a demo commuter with 2–3 saved routes and a few alerts in Pune.
  2. Open **Today** (`/overview`), set the browser window to 1600 × 1000 (DevTools → device toolbar →
     responsive 1600×1000).
  3. Wait for the AI briefing and route risk scores to load, then use DevTools → ⋮ → **Capture screenshot**.
  4. Convert to webp (`cwebp -q 85 shot.png -o screenshot-today.webp`).

---

## 5. Landing page — "For government agencies" band

- **Path:** `public/images/agency-control-room.webp`
- **Size:** 1920 × 1080
- **Shown:** full-bleed behind the dark band at 16% opacity (luminosity), so it acts as texture only.
- **Prompt:**
  > Wide photograph of a modern city traffic and disaster-management control room at night: large video wall
  > showing a city map with coloured incident markers and CCTV feeds, operators at desks seen from behind,
  > dim ambient lighting with emerald and teal screen glow, cinematic, no readable text on screens, no faces.

---

## 6. Social share / Open Graph cover — **required for good SEO**

- **Path:** `public/images/og-cover.png`
- **Size:** 1200 × 630 (`.png` or `.jpg`, under 1 MB)
- **Used by:** `index.html` (`og:image`, `twitter:image`). This is the preview card on WhatsApp, LinkedIn, X and
  Slack, and in some search results.
- **Prompt (background art):**
  > Wide banner illustration: left 45% solid deep forest green #073B33 with very subtle grid lines (empty, for
  > text), right side a stylised top-down night map of an Indian city with a glowing emerald route weaving
  > between small glowing hazard markers (amber, blue, red) to an orange beacon at the destination, flat
  > isometric vector style with soft glow, no text, no logos.
- **Then:** in Figma/Canva, add `Logo.png` and the line **"Navigate around disruptions before they reach
  you."** in white on the left.

---

## 7. Login / Register side panel

- **Path:** `public/images/auth-panel.webp`
- **Size:** 1200 × 1600 (portrait)
- **Shown:** behind the dark brand panel at 22% opacity (luminosity), as texture.
- **Prompt:**
  > Vertical aerial dusk photograph of an Indian city flyover interchange with long-exposure light trails,
  > rain-wet roads, metro construction cranes at the edge, lots of dark negative space at the top, cinematic
  > teal-green grade with soft orange highlights, no text.

---

## 8. Signed-in dashboards

Abstract textures behind the dark AI cards. They're shown at 22% opacity with `screen` blend, so they must be
**dark images with thin bright lines**. Avoid big bright areas.

| Path | Size | Where | Prompt |
|---|---|---|---|
| `public/images/dashboard-briefing-art.webp` | 1600 × 600 | **Today** (`/overview`): AI commute briefing card | Abstract dark map texture: thin glowing emerald road lines and a few small orange beacon dots on a near-black deep green background, gentle topographic contour lines, lots of empty dark space on the left, minimal, wide panoramic. |
| `public/images/command-center-art.webp` | 1600 × 600 | **Command Center** (`/dashboard`): AI situation report card | Abstract dark radar/command-center texture: concentric thin emerald rings and grid lines, scattered tiny amber, blue and red incident dots, faint city street network, near-black deep green background, empty dark space on the left, minimal, wide panoramic. |

---

## 9. Marketing pages (Features / About)

Wired in when those pages are redesigned. Same rules: they're hidden if missing.

| Path | Size | Prompt |
|---|---|---|
| `public/images/about-city.webp` | 1600 × 1000 | Editorial photograph of an Indian city road in monsoon: municipal worker in a high-visibility vest placing a diversion barricade beside a waterlogged lane, commuters on scooters and a city bus passing carefully, overcast soft light, documentary realism, deep green grade with one orange barrier accent. |
| `public/images/features-commuter.webp` | 1280 × 960 | 3D isometric illustration of a smartphone showing a city map with an emerald safe route curving around an amber construction marker and a blue flood marker, floating notification cards, deep forest green background, soft glow, no text. |
| `public/images/features-ai.webp` | 1280 × 960 | Abstract illustration of an AI co-pilot: a glowing orange spark node connected by thin emerald lines to map pins and a route line, layered translucent panels, dark forest green background, no robots, no faces, no text. |
| `public/images/features-agency.webp` | 1280 × 960 | 3D isometric illustration of a traffic control desk: large screen with map, charts and an alert list, a radio and a hard hat on the desk, deep green and emerald palette with orange highlights, no readable text. |
| `public/images/features-platform.webp` | 1280 × 960 | Flat illustration of a laptop and a phone showing the same live map with alert pins, a bell notification badge and an offline cloud icon, forest green background, minimal, no text. |

---

## 10. PWA / browser icons (recommended)

`manifest.json` currently uses `Logo.png` for every size. For crisp install icons, crop **just the pin** from the
current logo (no wordmark). No generator is needed.

| Path | Size | Notes |
|---|---|---|
| `public/icons/icon-192.png` | 192 × 192 | Pin centred at about 70% of the canvas, white background |
| `public/icons/icon-512.png` | 512 × 512 | Same |
| `public/icons/maskable-512.png` | 512 × 512 | Pin at about 55% of the canvas on solid `#073B33` (Android safe zone) |
| `public/favicon-32.png` | 32 × 32 | Pin only |

Once these exist, update the `icons` in `manifest.json` (add `"purpose": "maskable"` to the maskable icon) and
the `<link rel="icon">` in `index.html`.

---

## 11. Empty states & 404 (optional, future)

The app currently uses clean icon tiles. To swap in illustrations, use transparent PNGs at 320 × 240 in a simple
line-art style with deep green `#073B33` strokes and one emerald or orange accent.

| Path | Use | Prompt |
|---|---|---|
| `public/images/empty-routes.png` | No saved routes | Minimal line illustration of a folded paper map with a dotted emerald route and a small orange pin, transparent background. |
| `public/images/empty-all-clear.png` | No alerts nearby | Minimal line illustration of an open road with a green check-mark sign and a small sun, transparent background. |
| `public/images/empty-queue.png` | Review queue empty | Minimal line illustration of an empty inbox tray with a green check badge, transparent background. |
| `public/images/404-road.png` | 404 page | Minimal line illustration of a road ending at a striped barricade with a small orange warning light, transparent background. |

---

## Checklist (in priority order)

- [ ] `images/og-cover.png`: SEO and social previews
- [x] `images/hero-poster.webp`: hero photo (the hero video is no longer used)
- [ ] `images/screenshot-today.webp`: real screenshot; unlocks the "See it in action" section
- [ ] `images/hazard-traffic|construction|weather|emergency.webp`
- [ ] `images/step-report|analyse|route.webp`
- [ ] `images/agency-control-room.webp`
- [ ] `images/dashboard-briefing-art.webp`, `images/command-center-art.webp`
- [ ] `images/auth-panel.webp`
- [ ] `images/about-city.webp`, `images/features-*.webp`
- [ ] `icons/*` + `manifest.json` update
- [ ] Optional empty-state and 404 illustrations
