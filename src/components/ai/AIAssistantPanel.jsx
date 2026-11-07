import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles, X, Send, RotateCcw, Bot,
  ThumbsUp, ThumbsDown, Copy, Loader2, Zap,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { getSectionPrompts, getMockAIResponse } from '../../data/services/aiContextService'
import { toast } from '../../lib/toast'

/* ── Section labels ─────────────────────────────────────────────────── */
const SECTION_LABELS = {
  dashboard: 'Dashboard', sales: 'Sales', receivables: 'Money In',
  procurement: 'Purchases', payables: 'Bills to Pay', cashbank: 'Cash & Bank',
  expenses: 'Expenses', tax: 'Tax', reports: 'Reports', parties: 'Contacts',
  inventory: 'Inventory', assets: 'Fixed Assets', masters: 'Setup',
  'business-tools': 'Team & Tools', storage: 'Documents',
  migration: 'Data Migration', alerts: 'Alerts',
}

/* ── Message bubble ──────────────────────────────────────────────────── */
function Message({ msg, onThumbUp, onThumbDown, onCopy }) {
  const isUser = msg.role === 'user'

  // Render basic markdown: **bold**, \n\n paragraphs, • bullets
  function renderMarkdown(text) {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <span key={i} dangerouslySetInnerHTML={{ __html: bold }} className="block" />
      )
    })
  }

  return (
    <div className={cn('flex gap-2.5 mb-4', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5',
        isUser
          ? 'bg-[var(--primary)] text-white'
          : 'bg-gradient-to-br from-[#5b5bef] to-[#a855f7] text-white'
      )}>
        {isUser ? 'U' : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'flex-1 max-w-[85%]',
        isUser ? 'items-end flex flex-col' : ''
      )}>
        <div className={cn(
          'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
          isUser
            ? 'bg-[var(--primary)] text-white rounded-tr-sm'
            : 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-tl-sm'
        )}>
          {msg.loading ? (
            <span className="flex items-center gap-1.5 text-[var(--muted)]">
              <Loader2 size={12} className="animate-spin" />
              Thinking…
            </span>
          ) : (
            <div className="space-y-1">{renderMarkdown(msg.content)}</div>
          )}
        </div>

        {/* Actions for AI messages */}
        {!isUser && !msg.loading && (
          <div className="flex items-center gap-1 mt-1.5 ml-1">
            <button onClick={() => onThumbUp(msg.id)} className={cn('p-1 rounded hover:bg-[var(--surface-2)] transition-colors', msg.liked ? 'text-[var(--pos)]' : 'text-[var(--faint)]')}>
              <ThumbsUp size={11} />
            </button>
            <button onClick={() => onThumbDown(msg.id)} className={cn('p-1 rounded hover:bg-[var(--surface-2)] transition-colors', msg.disliked ? 'text-[var(--neg)]' : 'text-[var(--faint)]')}>
              <ThumbsDown size={11} />
            </button>
            <button onClick={() => onCopy(msg.content)} className="p-1 rounded hover:bg-[var(--surface-2)] transition-colors text-[var(--faint)]">
              <Copy size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main panel ──────────────────────────────────────────────────────── */
export default function AIAssistantPanel({ open, onClose }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const sectionId    = location.pathname.split('/')[1] || 'dashboard'
  const sectionLabel = SECTION_LABELS[sectionId] ?? sectionId
  const prompts      = getSectionPrompts(sectionId)

  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: `Hi! I'm your UnifiedTree AI assistant. I can see you're on **${sectionLabel}**.\n\nAsk me anything about your finances, or pick one of the quick questions below.`,
      loading: false,
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)

  // Reset conversation when section changes
  useEffect(() => {
    setMessages([{
      id: 0,
      role: 'assistant',
      content: `Hi! I'm your UnifiedTree AI assistant. I can see you're on **${sectionLabel}**.\n\nAsk me anything about your finances, or pick one of the quick questions below.`,
      loading: false,
    }])
    setInput('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  async function sendMessage(text) {
    const q = text.trim()
    if (!q || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: q, loading: false }
    const thinkMsg = { id: Date.now() + 1, role: 'assistant', content: '', loading: true }
    setMessages(m => [...m, userMsg, thinkMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await getMockAIResponse(q)
      setMessages(m => m.map(msg =>
        msg.id === thinkMsg.id ? { ...msg, content: reply, loading: false } : msg
      ))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  function react(id, type) {
    setMessages(m => m.map(msg =>
      msg.id === id ? { ...msg, liked: type === 'up', disliked: type === 'down' } : msg
    ))
  }

  function copyMsg(content) {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  function clearChat() {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: `Chat cleared. Ask me anything about **${sectionLabel}**.`,
      loading: false,
    }])
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 end-0 h-full w-[390px] z-50 flex flex-col bg-[var(--surface)] border-s border-[var(--border)] shadow-2xl"
        style={{ animation: 'slideInRight 220ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary-tint)] to-[var(--surface)] flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5b5bef] to-[#a855f7] flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text)]">UnifiedTree AI</p>
            <p className="text-[10px] text-[var(--muted)]">Context: {sectionLabel}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Clear chat"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--faint)]"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--faint)]"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          {messages.map(msg => (
            <Message
              key={msg.id}
              msg={msg}
              onThumbUp={id => react(id, 'up')}
              onThumbDown={id => react(id, 'down')}
              onCopy={copyMsg}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick prompts ── */}
        <div className="flex-shrink-0 border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={11} className="text-[var(--primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Quick questions
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {prompts.slice(0, 4).map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="text-[10px] font-medium text-[var(--primary)] bg-[var(--primary-tint)] border border-[var(--primary)]/20 px-2.5 py-1 rounded-full hover:bg-[var(--primary)] hover:text-white transition-all disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input ── */}
        <div className="flex-shrink-0 border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-end gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] focus-within:border-[var(--primary)] transition-colors px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your finances…"
              rows={1}
              disabled={loading}
              className="flex-1 text-sm bg-transparent resize-none focus:outline-none text-[var(--text)] placeholder:text-[var(--faint)] leading-relaxed"
              style={{ maxHeight: 100, overflowY: 'auto' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[var(--primary-600)] transition-colors"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--faint)] mt-1.5 text-center">
            AI responses are based on your data. Always verify before acting.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
