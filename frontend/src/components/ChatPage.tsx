'use client'

import { useState, useRef, useEffect } from 'react'
import { FinancialProfile, ChatMessage } from '@/lib/types'
import { api } from '@/lib/api'

interface Props {
  profile: FinancialProfile
}

const SUGGESTED_QUESTIONS = [
  { icon: '📈', text: 'What if I increase my savings by $500/month?' },
  { icon: '⚖️', text: 'Should I pay off my debts or invest more?' },
  { icon: '🏖️', text: 'How much do I need to retire by 55?' },
  { icon: '🏦', text: 'Am I using my TFSA and RRSP effectively?' },
  { icon: '🛡️', text: 'What\'s the best way to build an emergency fund?' },
  { icon: '🏠', text: 'How does buying a house affect my retirement timeline?' },
]

export default function ChatPage({ profile }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi ${profile.name}! 👋 I'm your AI financial planning copilot. I have your full financial profile loaded — ask me anything about your money, goals, or strategies.\n\nI can help with:\n• **What-if scenarios** — "What if I increase savings by $500/mo?"\n• **Strategy questions** — "Should I pay off debt or invest?"\n• **Tax optimization** — "Am I using TFSA/RRSP effectively?"\n• **Goal planning** — "How much do I need to retire by 55?"\n\nWhat's on your mind?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMessage: ChatMessage = { role: 'user', content: msg }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await api.chat.send(
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        profile
      )
      setMessages([...updatedMessages, { role: 'assistant', content: response.reply }])
    } catch (err: any) {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}. Please try again.` },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const showSuggestions = messages.length <= 2 && !loading

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-avatar">🧭</div>
          <div>
            <div className="chat-header-title">Ask Compass</div>
            <div className="chat-header-status">
              <span className="chat-status-dot" />
              Online · Your full financial profile is loaded
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="chat-body">
        {messages.map((msg, i) => (
          <div key={i} className={`chatmsg ${msg.role === 'user' ? 'chatmsg-user' : 'chatmsg-ai'}`}>
            {msg.role === 'assistant' && <div className="chatmsg-avatar">🧭</div>}
            <div className={`chatmsg-bubble ${msg.role === 'user' ? 'chatmsg-bubble-user' : 'chatmsg-bubble-ai'}`}>
              {msg.role === 'assistant' && <div className="chatmsg-name">Compass AI</div>}
              <div className="chatmsg-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
              <div className="chatmsg-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {msg.role === 'user' && (
              <div className="chatmsg-avatar chatmsg-avatar-user">
                {profile.name[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chatmsg chatmsg-ai">
            <div className="chatmsg-avatar">🧭</div>
            <div className="chatmsg-bubble chatmsg-bubble-ai">
              <div className="chatmsg-name">Compass AI</div>
              <div className="chatmsg-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="chat-suggestions-panel">
          <div className="chat-suggestions-label">Suggested questions</div>
          <div className="chat-suggestions-grid">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="chat-suggestion-card"
                onClick={() => sendMessage(q.text)}
              >
                <span className="chat-suggestion-icon">{q.icon}</span>
                <span className="chat-suggestion-text">{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="chat-footer">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-textarea"
            placeholder="Ask about your finances…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="chat-footer-hint">
          Press Enter to send · Shift+Enter for new line · AI may make mistakes
        </div>
      </div>
    </div>
  )
}

/* Markdown-ish formatting */
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>')
    .replace(/• /g, '&bull; ')
}
