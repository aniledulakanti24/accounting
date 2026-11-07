import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Check, RotateCcw, X } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'

/* ────────────────────────────────────────────────────────
   Indian number-words parser
   Handles: crore, lakh/lac, thousand, hundred + basic ones
   Examples:
     "twelve lakh fifty thousand"          → 1 250 000
     "one crore twenty five lakh"          → 12 500 000
     "three lakh seventy five thousand five hundred" → 375 500
     "forty five thousand"                 → 45 000
     "8 lakh 30 thousand 500"             → 830 500   (mixed digits+words)
──────────────────────────────────────────────────────── */

const ONES = {
  zero:0, oh:0,
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
  ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
  sixteen:16, seventeen:17, eighteen:18, nineteen:19,
  twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
  // common alternates
  'a':1,
}

const MULTS = {
  hundred:   100,
  thousands: 1000, thousand: 1000,
  lakh:      100_000, lac: 100_000, lakhs: 100_000, lacs: 100_000,
  crore:     10_000_000, crores: 10_000_000,
}

export function parseIndianWords(raw) {
  if (!raw) return null
  const text = raw.toLowerCase().replace(/[,₹\-]/g, ' ')

  // Try plain numeric first (handles "45000" or "12.5")
  const plain = parseFloat(text.trim())
  if (!isNaN(plain) && text.trim().split(/\s+/).length === 1) return plain

  const tokens = text.split(/\s+/).filter(Boolean)
  let total   = 0
  let current = 0

  for (const tok of tokens) {
    if (ONES[tok] !== undefined) {
      current += ONES[tok]
      continue
    }
    if (MULTS[tok] !== undefined) {
      const m = MULTS[tok]
      if (m === 100) {
        current = (current || 1) * 100
      } else {
        // e.g. lakh / thousand / crore — flush current into multiplier
        total  += (current || 1) * m
        current = 0
      }
      continue
    }
    // bare digit token ("8" in "8 lakh")
    const n = parseFloat(tok)
    if (!isNaN(n)) { current += n; continue }
    // ignore unrecognised words (like "and", "rupees", etc.)
  }

  total += current
  return total > 0 ? total : null
}

/* ────────────────────────────────────────────────────────
   SpeechRecognition shim
──────────────────────────────────────────────────────── */
const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

const SUPPORTED = !!SR

/* ────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────── */
/**
 * VoiceInput — mic button for amount fields.
 *
 * Props:
 *   onResult  (number) => void   — fires with parsed rupee amount
 *   disabled  boolean
 *   size      'sm' | 'md'        — button size (default 'md')
 */
export default function VoiceInput({ onResult, disabled = false, size = 'md' }) {
  const [state,      setState]      = useState('idle')     // idle | listening | result | error
  const [transcript, setTranscript] = useState('')
  const [parsed,     setParsed]     = useState(null)
  const [errMsg,     setErrMsg]     = useState('')
  const recRef = useRef(null)

  /* Clean up on unmount */
  useEffect(() => () => recRef.current?.abort(), [])

  const startListening = useCallback(() => {
    if (!SUPPORTED || disabled) return

    const rec = new SR()
    recRef.current = rec
    rec.lang            = 'en-IN'
    rec.continuous      = false
    rec.interimResults  = true
    rec.maxAlternatives = 3

    rec.onstart = () => { setState('listening'); setTranscript(''); setParsed(null); setErrMsg('') }

    rec.onresult = (e) => {
      let interim = ''
      let final   = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      setTranscript(final || interim)
    }

    rec.onend = () => {
      const raw    = recRef.current?._lastTranscript ?? transcript
      /* use closure ref — transcript may not be updated yet */
      setTimeout(() => {
        setState(prev => {
          /* already aborted by user */
          if (prev === 'idle') return 'idle'
          return 'result'
        })
      }, 0)
    }

    rec.onerror = (e) => {
      const msgs = {
        'not-allowed':   'Microphone access denied.',
        'no-speech':     'No speech detected. Try again.',
        'network':       'Network error during recognition.',
        'audio-capture': 'No microphone found.',
      }
      setErrMsg(msgs[e.error] ?? `Error: ${e.error}`)
      setState('error')
    }

    rec.start()
  }, [disabled, transcript])

  /* Keep a live ref to latest transcript so onend can read it */
  useEffect(() => {
    if (recRef.current) recRef.current._lastTranscript = transcript
  }, [transcript])

  /* Parse once we reach result state */
  useEffect(() => {
    if (state !== 'result') return
    const n = parseIndianWords(transcript)
    setParsed(n)
  }, [state, transcript])

  const stop = () => {
    recRef.current?.stop()
    /* onend fires naturally */
  }

  const abort = () => {
    recRef.current?.abort()
    recRef.current = null
    setState('idle')
    setTranscript('')
    setParsed(null)
  }

  const accept = () => {
    if (parsed != null) { onResult(parsed); setState('idle'); setTranscript('') }
  }

  const retry = () => {
    setTranscript('')
    setParsed(null)
    setState('idle')
    setTimeout(startListening, 100)
  }

  /* ── Size tokens ── */
  const btnSz   = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  const iconSz  = size === 'sm' ? 13 : 15

  if (!SUPPORTED) {
    return (
      <button
        disabled
        title="Voice input not supported in this browser"
        className={`${btnSz} rounded-lg flex items-center justify-center text-[var(--faint)] cursor-not-allowed`}
      >
        <MicOff size={iconSz} />
      </button>
    )
  }

  return (
    <div className="relative flex items-center">

      {/* ── Mic / Stop button ── */}
      {state === 'idle' || state === 'error' ? (
        <button
          onClick={startListening}
          disabled={disabled}
          title="Speak the amount (e.g. 'twelve lakh fifty thousand')"
          className={`
            ${btnSz} rounded-lg flex items-center justify-center transition-all
            ${disabled ? 'text-[var(--faint)] cursor-not-allowed' : 'text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-tint)]'}
          `}
        >
          <Mic size={iconSz} />
        </button>
      ) : state === 'listening' ? (
        <button
          onClick={stop}
          title="Stop listening"
          className={`${btnSz} rounded-lg flex items-center justify-center text-white transition-all`}
          style={{
            background: 'var(--neg)',
            animation:  'voicePulse 1.2s ease-in-out infinite',
          }}
        >
          <Mic size={iconSz} />
        </button>
      ) : null}

      {/* ── Inline result / transcript bubble ── */}
      {(state === 'listening' || state === 'result' || state === 'error') && (
        <div
          className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 flex-shrink-0"
          style={{ animation: 'voiceBubbleIn 180ms cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border border-[var(--border)] whitespace-nowrap"
            style={{ background: 'var(--surface)' }}
          >
            {/* Listening state — live transcript */}
            {state === 'listening' && (
              <>
                <span className="flex gap-0.5 items-end">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-0.5 rounded-full"
                      style={{
                        height: 12,
                        background: 'var(--neg)',
                        animation: `voiceBar 0.8s ease-in-out ${i * 120}ms infinite alternate`,
                      }}
                    />
                  ))}
                </span>
                <span className="text-xs text-[var(--muted)] max-w-[160px] truncate italic">
                  {transcript || 'Listening…'}
                </span>
              </>
            )}

            {/* Result state — show parsed + accept / retry / cancel */}
            {state === 'result' && (
              <>
                {parsed != null ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[var(--faint)] leading-none mb-0.5">Heard</span>
                      <span className="text-xs text-[var(--muted)] italic truncate max-w-[120px]">
                        {transcript}
                      </span>
                    </div>
                    <span
                      className="tabular text-sm font-bold px-2 py-0.5 rounded-lg"
                      style={{ color: 'var(--primary)', background: 'var(--primary-tint)' }}
                    >
                      {formatCurrency(parsed)}
                    </span>
                    <button
                      onClick={accept}
                      title="Use this amount"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ background: 'var(--pos)' }}
                    >
                      <Check size={11} />
                    </button>
                    <button onClick={retry} title="Try again" className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--faint)] hover:bg-[var(--surface-2)] transition-colors">
                      <RotateCcw size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-[var(--muted)] italic max-w-[160px] truncate">
                      "{transcript || '—'}"
                    </span>
                    <span className="text-[11px] text-[var(--neg)] font-semibold">Can't parse</span>
                    <button onClick={retry} title="Try again" className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--faint)] hover:bg-[var(--surface-2)] transition-colors">
                      <RotateCcw size={11} />
                    </button>
                  </>
                )}
                <button onClick={abort} title="Cancel" className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--faint)] hover:bg-[var(--surface-2)] transition-colors">
                  <X size={11} />
                </button>
              </>
            )}

            {/* Error state */}
            {state === 'error' && (
              <>
                <span className="text-[11px] text-[var(--neg)] font-semibold max-w-[160px]">{errMsg}</span>
                <button onClick={abort} className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--faint)] hover:bg-[var(--surface-2)] transition-colors">
                  <X size={11} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        @keyframes voiceBar {
          from { height: 4px; opacity: 0.5; }
          to   { height: 14px; opacity: 1;  }
        }
        @keyframes voiceBubbleIn {
          from { opacity: 0; transform: translateY(-50%) translateX(6px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0);   }
        }
      `}</style>
    </div>
  )
}
