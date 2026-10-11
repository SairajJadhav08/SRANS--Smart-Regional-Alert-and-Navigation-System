import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { getAiChatWithHistory, getAiSmartSearch, getAlerts } from '../api'
import type { ChatTurn } from '../api'
import type { Alert } from '../types'
import { timeAgo, typeMeta } from '../lib/alertMeta'
import Seo from '../components/Seo'
import { BrandMark, TypeIcon } from '../components/ui'
import RichText from '../components/ai/RichText'
import '../styles/pages/assistant.css'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  at: number
  loading?: boolean
  error?: boolean
  matches?: number[]        // alert ids from smart search
}

type Mode = 'chat' | 'search'

const STORAGE_KEY = 'srans_assistant_chat'

const PROMPT_GROUPS: Array<{ label: string; icon: string; prompts: string[] }> = [
  {
    label: 'Right now',
    icon: 'fa-bolt',
    prompts: [
      'Is it safe to travel through the city right now?',
      'Summarise all active alerts in 5 bullet points.',
      'Which roads should I avoid due to flooding?',
    ],
  },
  {
    label: 'Plan ahead',
    icon: 'fa-calendar-check',
    prompts: [
      'What is the best time to leave for a 9 AM office arrival?',
      'Are there construction diversions I should plan around this week?',
    ],
  },
  {
    label: 'Safety',
    icon: 'fa-shield-heart',
    prompts: [
      'What should I do if I get stuck in a waterlogged underpass?',
      'Any emergency incidents I should know about today?',
    ],
  },
]

const GREETING: Message = {
  id: 0,
  role: 'assistant',
  at: Date.now(),
  content:
    "Hi! I'm the SRANS travel assistant.\n\nI read every live regional alert — construction, flooding, diversions and emergencies — so you can ask me anything about current conditions or your commute. I remember our conversation, so feel free to ask follow-ups.",
}

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Message[]
      if (Array.isArray(parsed) && parsed.length) return parsed.filter(m => !m.loading)
    }
  } catch { /* ignore */ }
  return [GREETING]
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>('chat')
  const [alertsById, setAlertsById] = useState<Map<number, Alert>>(new Map())
  const [copied, setCopied] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    getAlerts().then(res => setAlertsById(new Map(res.data.map(a => [a.id, a])))).catch(() => {})
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter(m => !m.loading))) } catch { /* ignore */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Grow the textarea with its content (up to a cap)
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    const history: ChatTurn[] = messages
      .filter(m => m.id !== 0 && !m.loading && !m.error && !m.matches)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    const now = Date.now()
    const userMsg: Message = { id: now, role: 'user', content: trimmed, at: now }
    const pending: Message = { id: now + 1, role: 'assistant', content: '', at: now, loading: true }
    setMessages(prev => [...prev, userMsg, pending])
    setInput('')
    setBusy(true)

    try {
      if (mode === 'search') {
        const res = await getAiSmartSearch(trimmed)
        setMessages(prev => prev.map(m => m.id === pending.id
          ? { ...m, loading: false, content: res.data.answer || 'Here are the most relevant alerts.', matches: res.data.alert_ids, at: Date.now() }
          : m))
      } else {
        const res = await getAiChatWithHistory(trimmed, history)
        setMessages(prev => prev.map(m => m.id === pending.id ? { ...m, loading: false, content: res.data.reply, at: Date.now() } : m))
      }
    } catch (err: any) {
      const msg = err?.response?.status === 429
        ? 'You are sending messages a little fast. Please wait a moment and try again.'
        : 'Sorry, I could not reach the AI right now. Please try again in a moment.'
      setMessages(prev => prev.map(m => m.id === pending.id ? { ...m, loading: false, error: true, content: msg } : m))
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input) }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const clearChat = () => {
    setMessages([{ ...GREETING, id: Date.now(), at: Date.now(), content: "Chat cleared. What would you like to know about today's road conditions?" }])
  }

  const copy = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.content)
      setCopied(m.id)
      setTimeout(() => setCopied(c => (c === m.id ? null : c)), 1500)
    } catch { /* clipboard blocked */ }
  }

  const onlyGreeting = messages.length === 1

  return (
    <div className="assistant">
      <Seo title="AI Assistant" noindex />

      <aside className="assistant-rail" aria-label="Suggested questions">
        <div className="assistant-rail-head">
          <span className="ai-chip on-light"><i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Groq AI · live alerts</span>
          <p>The assistant answers using every active alert in the region.</p>
        </div>
        {PROMPT_GROUPS.map(g => (
          <div key={g.label} className="assistant-group">
            <h2 className="assistant-group-label"><i className={`fas ${g.icon}`} aria-hidden="true"></i> {g.label}</h2>
            {g.prompts.map(p => (
              <button key={p} type="button" className="assistant-prompt" onClick={() => { setMode('chat'); send(p) }} disabled={busy}>
                {p}
              </button>
            ))}
          </div>
        ))}
        <Link to="/my-routes" className="assistant-rail-link">
          <i className="fas fa-route" aria-hidden="true"></i>
          <span><strong>Route risk scores</strong><br />See AI risk for your saved routes</span>
          <i className="fas fa-arrow-right" aria-hidden="true"></i>
        </Link>
      </aside>

      <section className="assistant-main" aria-label="Conversation">
        <header className="assistant-head">
          <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
            <BrandMark />
            <div style={{ minWidth: 0 }}>
              <h1 className="assistant-title">SRANS Travel Assistant</h1>
              <p className="assistant-sub"><span className="live-dot" aria-hidden="true"></span> Connected to live alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="assistant-mode" role="group" aria-label="Assistant mode">
              <button type="button" aria-pressed={mode === 'chat'} onClick={() => setMode('chat')}>
                <i className="fas fa-comments" aria-hidden="true"></i> Chat
              </button>
              <button type="button" aria-pressed={mode === 'search'} onClick={() => setMode('search')}>
                <i className="fas fa-magnifying-glass-location" aria-hidden="true"></i> Find alerts
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearChat} disabled={busy} aria-label="Clear conversation" title="Clear conversation">
              <i className="fas fa-rotate-left"></i>
            </button>
          </div>
        </header>

        <div className="assistant-scroll" ref={scrollRef} aria-live="polite">
          <div className="assistant-thread">
            {messages.map(m => (
              <div key={m.id} className={`msg msg-${m.role}${m.error ? ' is-error' : ''}`}>
                {m.role === 'assistant' && <span className="msg-avatar" aria-hidden="true"><i className="fas fa-wand-magic-sparkles"></i></span>}
                <div className="msg-body">
                  <div className="msg-bubble">
                    {m.loading ? (
                      <span className="typing" aria-label="Assistant is typing"><span /><span /><span /></span>
                    ) : m.role === 'assistant' ? (
                      <RichText text={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>

                  {m.matches && (
                    m.matches.length === 0 ? (
                      <p className="msg-meta">No matching alerts.</p>
                    ) : (
                      <ul className="msg-matches">
                        {m.matches.map(id => {
                          const a = alertsById.get(id)
                          if (!a) return null
                          return (
                            <li key={id}>
                              <Link to={`/map?lat=${a.location_lat}&lng=${a.location_lng}`} className="msg-match">
                                <TypeIcon type={a.alert_type} size={30} />
                                <span style={{ minWidth: 0, flex: 1 }}>
                                  <span className="msg-match-title">{a.title}</span>
                                  <span className="msg-match-meta">{typeMeta(a.alert_type).label} · {timeAgo(a.created_at)}</span>
                                </span>
                                <i className="fas fa-map-location-dot" aria-hidden="true"></i>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )
                  )}

                  {!m.loading && (
                    <div className="msg-meta">
                      <time>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      {m.role === 'assistant' && m.id !== 0 && !m.error && (
                        <button type="button" className="msg-action" onClick={() => copy(m)} aria-label="Copy answer">
                          <i className={`fas ${copied === m.id ? 'fa-check' : 'fa-copy'}`} aria-hidden="true"></i> {copied === m.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {onlyGreeting && (
              <div className="assistant-starters">
                {PROMPT_GROUPS.flatMap(g => g.prompts).slice(0, 4).map(p => (
                  <button key={p} type="button" className="assistant-starter" onClick={() => send(p)} disabled={busy}>
                    <i className="fas fa-arrow-turn-down fa-rotate-270" aria-hidden="true"></i> {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form className="assistant-composer" onSubmit={onSubmit}>
          <div className="assistant-input">
            <label htmlFor="assistant-input" className="sr-only">
              {mode === 'search' ? 'Describe the alerts you are looking for' : 'Message the assistant'}
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={1}
              placeholder={mode === 'search'
                ? 'Describe what you are looking for, e.g. "flooding near the railway station"'
                : 'Ask about road conditions, diversions, flooding or your commute…'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              autoFocus
            />
            <button type="submit" className="assistant-send" disabled={busy || !input.trim()} aria-label="Send">
              {busy ? <span className="spinner" /> : <i className="fas fa-arrow-up"></i>}
            </button>
          </div>
          <p className="assistant-hint">
            <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line · AI can make mistakes — check official alerts before acting.
          </p>
        </form>
      </section>
    </div>
  )
}
