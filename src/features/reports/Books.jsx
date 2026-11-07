import { useState, useEffect } from 'react'
import { Download, BookOpen, TrendingUp, TrendingDown } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getDayBook, getSalesRegister, getPurchaseRegister } from '../../data/services/reportsService'

const BOOK_TABS = ['Day Book', 'Sales Register', 'Purchase Register']

const TYPE_COLORS = {
  Sales:   'bg-[var(--pos-tint)] text-[var(--pos)]',
  Receipt: 'bg-blue-50 text-blue-700',
  Payment: 'bg-[var(--neg-tint)] text-[var(--neg)]',
  Journal: 'bg-purple-50 text-purple-700',
}

export default function Books() {
  const [book, setBook]     = useState('Day Book')
  const [dayBook, setDayBook]     = useState([])
  const [salesReg, setSalesReg]   = useState([])
  const [purchReg, setPurchReg]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getDayBook(), getSalesRegister(), getPurchaseRegister()]).then(([d, s, p]) => {
      setDayBook(d); setSalesReg(s); setPurchReg(p); setLoading(false)
    })
  }, [])

  const totalDr = dayBook.reduce((s,r) => s + r.dr, 0)
  const totalCr = dayBook.reduce((s,r) => s + r.cr, 0)
  const salesTotal = salesReg.reduce((s,r) => s + r.total, 0)
  const purchTotal = purchReg.reduce((s,r) => s + r.total, 0)

  return (
    <div>
      <PageHeader title="Books" subtitle="Day Book · Sales Register · Purchase Register" breadcrumb={['Reports & Analytics', 'Books']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-5">
        {BOOK_TABS.map(t => (
          <button key={t} onClick={() => setBook(t)}
            className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${book===t?'bg-[var(--primary)] text-white':'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center text-sm text-[var(--faint)] py-12">Loading…</p> : (
        <>
          {/* Day Book */}
          {book === 'Day Book' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label:'Total Debit',  value:formatCompact(totalDr), color:'var(--pos)' },
                  { label:'Total Credit', value:formatCompact(totalCr), color:'var(--neg)' },
                  { label:'Entries',      value:dayBook.length,          color:'var(--text)' },
                ].map(k => (
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Time</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Ref</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Type</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Party</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Narration</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Debit</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBook.map((r,i) => (
                      <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                        <td className="px-4 py-2.5 font-mono text-xs text-[var(--muted)]">{r.time}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[var(--primary)]">{r.ref}</td>
                        <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.type]??'bg-gray-100 text-gray-600'}`}>{r.type}</span></td>
                        <td className="px-4 py-2.5 font-medium text-[var(--text)]">{r.party}</td>
                        <td className="px-4 py-2.5 text-[var(--muted)] max-w-xs truncate">{r.narration}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--pos)] font-medium">{r.dr > 0 ? formatCurrency(r.dr) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--neg)] font-medium">{r.cr > 0 ? formatCurrency(r.cr) : '—'}</td>
                      </tr>
                    ))}
                    <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--primary)]">
                      <td colSpan={5} className="px-4 py-3 text-sm font-bold text-[var(--text)]">TOTAL</td>
                      <td className="px-4 py-3 tabular text-right font-bold text-[var(--pos)]">{formatCurrency(totalDr)}</td>
                      <td className="px-4 py-3 tabular text-right font-bold text-[var(--neg)]">{formatCurrency(totalCr)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Sales Register */}
          {book === 'Sales Register' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label:'Total Sales',  value:formatCompact(salesTotal), color:'var(--pos)' },
                  { label:'GST Collected',value:formatCompact(salesReg.reduce((s,r)=>s+r.cgst+r.sgst+r.igst,0)), color:'var(--primary)' },
                  { label:'Invoices',     value:salesReg.length,           color:'var(--text)' },
                ].map(k => (
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      {['Date','Ref','Party','Taxable','CGST','SGST','IGST','Total'].map(h => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${['Taxable','CGST','SGST','IGST','Total'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salesReg.map((r,i) => (
                      <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                        <td className="px-4 py-2.5 text-[var(--muted)] text-xs">{r.date}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[var(--primary)]">{r.ref}</td>
                        <td className="px-4 py-2.5 font-medium text-[var(--text)]">{r.party}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--text)]">{formatCurrency(r.taxable)}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.cgst > 0 ? formatCurrency(r.cgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.sgst > 0 ? formatCurrency(r.sgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.igst > 0 ? formatCurrency(r.igst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right font-semibold text-[var(--pos)]">{formatCurrency(r.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--primary)]">
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-[var(--text)]">TOTAL</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(salesReg.reduce((s,r)=>s+r.taxable,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(salesReg.reduce((s,r)=>s+r.cgst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(salesReg.reduce((s,r)=>s+r.sgst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(salesReg.reduce((s,r)=>s+r.igst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold text-[var(--pos)]">{formatCurrency(salesTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Purchase Register */}
          {book === 'Purchase Register' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label:'Total Purchases', value:formatCompact(purchTotal), color:'var(--neg)'     },
                  { label:'Input Tax Credit', value:formatCompact(purchReg.reduce((s,r)=>s+r.cgst+r.sgst+r.igst,0)), color:'var(--primary)' },
                  { label:'Invoices',         value:purchReg.length,           color:'var(--text)'   },
                ].map(k => (
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      {['Date','Ref','Supplier','Taxable','CGST','SGST','IGST','Total'].map(h => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${['Taxable','CGST','SGST','IGST','Total'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchReg.map((r,i) => (
                      <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                        <td className="px-4 py-2.5 text-[var(--muted)] text-xs">{r.date}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[var(--primary)]">{r.ref}</td>
                        <td className="px-4 py-2.5 font-medium text-[var(--text)]">{r.party}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--text)]">{formatCurrency(r.taxable)}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.cgst > 0 ? formatCurrency(r.cgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.sgst > 0 ? formatCurrency(r.sgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.igst > 0 ? formatCurrency(r.igst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right font-semibold text-[var(--neg)]">{formatCurrency(r.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--primary)]">
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-[var(--text)]">TOTAL</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(purchReg.reduce((s,r)=>s+r.taxable,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(purchReg.reduce((s,r)=>s+r.cgst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(purchReg.reduce((s,r)=>s+r.sgst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(purchReg.reduce((s,r)=>s+r.igst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold text-[var(--neg)]">{formatCurrency(purchTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
