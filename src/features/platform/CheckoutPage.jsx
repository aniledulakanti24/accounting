import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Lock, TreePine } from 'lucide-react'
import { api } from '../../data/api/client'
import { formatCurrency } from '../../lib/currency'
import { useAppStore } from '../../store/useAppStore'

/**
 * Public, hosted checkout for a payment link. Customers do not sign in.
 * (In this demo the link's company is looked up in the browser's workspace.)
 */
export default function CheckoutPage() {
  const { linkId } = useParams()
  const companies = useAppStore(s => s.companies)
  const [state, setState] = useState({ link: null, error: null, company: null })
  const [method, setMethod] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      for (const company of companies) {
        try {
          const link = await api.get(`/payment-links/${linkId}`, { company, token: null })
          if (!cancelled) setState({ link, error: null, company })
          return
        } catch { /* try the next workspace company */ }
      }
      if (!cancelled) setState({ link: null, error: 'This payment link was not found or has expired.', company: null })
    })()
    return () => { cancelled = true }
  }, [linkId, companies])

  async function pay() {
    setPaying(true)
    try {
      const link = await api.post(`/payment-links/${linkId}/pay`, { method }, { company: state.company, token: null })
      setState(s => ({ ...s, link }))
    } catch (err) {
      setState(s => ({ ...s, error: err.message }))
    } finally {
      setPaying(false)
    }
  }

  const { link, error } = state
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--primary)' }}><TreePine size={15} color="#fff" /></span>
          <span className="text-sm font-semibold text-[var(--text)]">{link?.companyName ?? 'UnifiedTree checkout'}</span>
        </div>
        {!link && !error && <p className="text-sm text-[var(--muted)]">Loading…</p>}
        {error && !link && <p className="text-sm text-[var(--neg)]">{error}</p>}
        {link && (
          <>
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Invoice {link.invoiceNo}</p>
            <p className="tabular text-3xl font-bold text-[var(--text)] my-1">{formatCurrency(link.amount, link.currency)}</p>
            <p className="text-sm text-[var(--muted)] mb-5">Billed to {link.customer}</p>
            {link.status === 'paid' ? (
              <div className="rounded-[var(--radius-sm)] bg-[var(--pos-tint)] p-4 text-sm text-[var(--pos)]">
                <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} /> Payment received</p>
                <p className="mt-1 font-mono text-xs">{link.paymentId} · {link.method}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {link.methods.map(m => (
                    <label key={m} className={`flex items-center gap-2 rounded-[var(--radius-sm)] border p-3 text-sm cursor-pointer ${method === m ? 'border-[var(--primary)] bg-[var(--primary-tint)]' : 'border-[var(--border)]'}`}>
                      <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} /> {m}
                    </label>
                  ))}
                </div>
                {error && <p className="mb-2 text-sm text-[var(--neg)]">{error}</p>}
                <button type="button" onClick={pay} disabled={!method || paying}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border-0 bg-[var(--primary)] text-sm font-semibold text-white cursor-pointer disabled:opacity-60">
                  <Lock size={14} /> {paying ? 'Processing…' : `Pay ${formatCurrency(link.amount, link.currency)}`}
                </button>
                <p className="mt-3 text-center text-[11px] text-[var(--muted)]">Secured by {link.gateway} · demo checkout, no real charge</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
