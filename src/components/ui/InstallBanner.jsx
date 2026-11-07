import { useState, useEffect } from 'react'
import { Smartphone, X, Download } from 'lucide-react'

/**
 * InstallBanner — "Install app" prompt that appears once per device.
 *
 * Fires on the beforeinstallprompt event (Chrome/Edge on Android + desktop).
 * Safari iOS: shows a manual instruction instead.
 * Dismissed state persisted in localStorage.
 */
export default function InstallBanner() {
  const [prompt,      setPrompt]      = useState(null)  // BeforeInstallPromptEvent
  const [visible,     setVisible]     = useState(false)
  const [isIOS,       setIsIOS]       = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    /* Already dismissed */
    if (localStorage.getItem('ut-pwa-dismissed') === '1') return

    /* Already installed as standalone */
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true); return
    }

    /* iOS detection — no beforeinstallprompt, show manual instructions */
    const ua = navigator.userAgent
    if (/iphone|ipad|ipod/i.test(ua) && !/(chrome|fxios)/i.test(ua)) {
      setIsIOS(true); setVisible(true); return
    }

    /* Android / Chrome / Edge */
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('ut-pwa-dismissed', '1')
    setVisible(false)
  }

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      toast?.success?.('UnifiedTree installed!')
    }
    setVisible(false)
  }

  if (!visible || isInstalled) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[800] w-full max-w-sm mx-4"
      style={{ animation: 'bannerIn 300ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border)] shadow-2xl"
        style={{ background: 'var(--surface)' }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-600))' }}
        >
          <Smartphone size={18} color="#fff" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text)] leading-tight">Install UnifiedTree</p>
          {isIOS ? (
            <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
            </p>
          ) : (
            <p className="text-[11px] text-[var(--muted)] mt-0.5">Works offline · Opens in seconds</p>
          )}
        </div>

        {/* Actions */}
        {!isIOS && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-600))' }}
          >
            <Download size={11} /> Install
          </button>
        )}

        <button
          onClick={dismiss}
          className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)] flex-shrink-0 transition-colors"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      <style>{`
        @keyframes bannerIn {
          from { opacity:0; transform:translate(-50%, 12px); }
          to   { opacity:1; transform:translate(-50%, 0);    }
        }
      `}</style>
    </div>
  )
}
