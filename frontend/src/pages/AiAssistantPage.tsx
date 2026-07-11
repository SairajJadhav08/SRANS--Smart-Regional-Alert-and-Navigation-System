import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getAiChat } from '../api'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  loading?: boolean
}

const SUGGESTED_QUESTIONS = [
  'Is it safe to travel through the city right now?',
  'What road disruptions are active today?',
  'Which roads should I avoid due to flooding?',
  'Are there any construction diversions I should know about?',
  'What is the safest time to commute this morning?',
  'Summarize all active regional alerts for me.',
]

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: "Hi! I'm the SRANS Travel Assistant.\n\nI have access to all live regional alerts — road construction, flooding, traffic diversions, and infrastructure disruptions. Ask me anything about current conditions or your commute and I'll give you a real-time answer.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    const loadingMsg: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await getAiChat(trimmed)
      setMessages(prev =>
        prev.map(m =>
          m.loading ? { ...m, content: res.data.reply, loading: false } : m
        )
      )
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? { ...m, content: 'Sorry, I could not reach the AI right now. Please try again in a moment.', loading: false }
            : m
        )
      )
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: "Chat cleared. I'm ready for your next question about regional conditions or your commute.",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: 'var(--bg-subtle)' }}>

      {/* Header */}
      <div className="bg-white" style={{ borderBottom: '1px solid var(--border-color)', padding: 'var(--space-4) 0', flexShrink: 0 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="icon-box accent" style={{ width: '44px', height: '44px', fontSize: '20px', flexShrink: 0 }}>
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, lineHeight: 1.2 }}>
                AI Travel Assistant
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>
                AI-powered · Live alert context
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={clearChat} title="Clear chat">
              <i className="fas fa-trash-alt mr-1"></i> Clear
            </button>
            <Link to="/my-routes" className="btn btn-secondary btn-sm">
              <i className="fas fa-route mr-1"></i> Route Planner
            </Link>
          </div>
        </div>
      </div>

      {/* Main layout — sidebar + chat */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 0 }}>

        {/* Sidebar — suggested questions, hide on mobile */}
        <aside className="hide-mobile" style={{ width: '280px', flexShrink: 0, background: 'var(--bg-white)', borderRight: '1px solid var(--border-color)', overflowY: 'auto', padding: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-4)' }}>
            Suggested Questions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="btn btn-ghost"
                style={{ textAlign: 'left', padding: 'var(--space-3)', fontSize: 'var(--text-sm)', lineHeight: 1.4, height: 'auto', whiteSpace: 'normal', justifyContent: 'flex-start', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
              >
                <i className="fas fa-comment-dots text-primary" style={{ marginRight: 'var(--space-2)', flexShrink: 0, marginTop: '2px' }}></i>
                {q}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-4)', background: 'var(--color-primary-lighter)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary-light)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>
              <i className="fas fa-info-circle mr-1"></i> How it works
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              The assistant reads all live regional alerts from the database and uses Groq AI to answer your commuting questions in natural language.
            </p>
          </div>
        </aside>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-end',
                  maxWidth: '100%',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: 'white',
                }}>
                  <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: msg.role === 'user'
                      ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                      : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--bg-white)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.loading ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite' }}></span>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite 0.2s' }}></span>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite 0.4s' }}></span>
                      </div>
                    ) : msg.content}
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ flexShrink: 0, background: 'var(--bg-white)', borderTop: '1px solid var(--border-color)', padding: 'var(--space-4)' }}>
            {/* Mobile suggested chips */}
            <div className="hide-desktop" style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-3)', scrollbarWidth: 'none' }}>
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  style={{ flexShrink: 0, fontSize: 'var(--text-xs)', padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {q}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  className="input"
                  placeholder="Ask about road conditions, diversions, flooding, or your commute..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isLoading}
                  style={{
                    resize: 'none',
                    minHeight: '44px',
                    maxHeight: '120px',
                    paddingRight: 'var(--space-4)',
                    lineHeight: '1.5',
                    overflowY: 'auto',
                  }}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !input.trim()}
                style={{ minWidth: '48px', height: '44px', flexShrink: 0 }}
                title="Send (Enter)"
              >
                {isLoading
                  ? <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                  : <i className="fas fa-paper-plane"></i>
                }
              </button>
            </form>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)', textAlign: 'center' }}>
              Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px' }}>Enter</kbd> to send · <kbd style={{ padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px' }}>Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
