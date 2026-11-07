import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Download, Printer } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import PeriodSelector from '../../components/ui/PeriodSelector'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { getParties, getPartyStatement } from '../../data/services/partiesService'
import { useAppStore } from '../../store/useAppStore'
import { currentFYYear } from '../../lib/fy'
import { format } from 'date-fns'

export default function Statements() {
  const [searchParams] = useSearchParams()
  const { financialYear } = useAppStore()
  const fy = financialYear ?? currentFYYear()

  const [parties, setParties]       = useState([])
  const [selectedId, setSelectedId] = useState('')
  // Default to previous FY so mock data (FY 2025-26) shows immediately
  const prevFy = fy - 1
  const [period, setPeriod]         = useState({
    mode: 'year', value: prevFy,
    from: new Date(prevFy, 3, 1), to: new Date(prevFy + 1, 2, 31),
  })
  const [txns, setTxns]             = useState([])

  useEffect(() => {
    getParties().then(setParties)
  }, [])

  const partyIdFromUrl = searchParams.get('partyId')
  const partyNameFromUrl = searchParams.get('party')
  const urlSelectedParty = parties.find(p => p.id === partyIdFromUrl || p.name === partyNameFromUrl)
  const effectiveSelectedId = selectedId || urlSelectedParty?.id || ''

  useEffect(() => {
    if (!effectiveSelectedId) return
    getPartyStatement(effectiveSelectedId).then(setTxns)
  }, [effectiveSelectedId])

  const selectedParty = parties.find(p => p.id === effectiveSelectedId)

  // Filter txns by period
  const filteredTxns = txns.filter(t => {
    if (!period.from || !period.to) return true
    const d = new Date(t.date)
    return d >= period.from && d <= period.to
  })

  const openingBalance = 0 // simplified — real: balance before period.from
  const closingBalance = filteredTxns.length > 0
    ? filteredTxns[filteredTxns.length - 1].balance
    : 0

  const totalDr = filteredTxns.reduce((s, t) => s + t.dr, 0)
  const totalCr = filteredTxns.reduce((s, t) => s + t.cr, 0)

  return (
    <div>
      <PageHeader
        title="Party Statements"
        subtitle="Account ledger statement for any party"
        breadcrumb={['Parties & Ledgers', 'Statements']}
        action={
          selectedParty && (
            <div className="flex gap-2">
              <Button variant="secondary" icon={Printer} size="sm">Print</Button>
              <Button variant="secondary" icon={Download} size="sm">Export PDF</Button>
            </div>
          )
        }
      />

      {/* Controls */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 mb-5 shadow-sm flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-56">
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Party</label>
          <select
            value={effectiveSelectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">— Select a party —</option>
            {parties.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Period</label>
          <PeriodSelector value={period} onChange={setPeriod} fyYear={fy} />
        </div>
      </div>

      {/* Statement */}
      {!selectedParty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-tint)] flex items-center justify-center mb-4">
            <FileText size={26} className="text-[var(--primary)]" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">Select a party to view statement</p>
          <p className="text-xs text-[var(--muted)]">Choose any customer or supplier from the dropdown above.</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm overflow-hidden">
          {/* Statement header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">{selectedParty.name}</h3>
              <p className="text-xs text-[var(--faint)] font-mono mt-0.5">{selectedParty.gstin} · {selectedParty.city}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Period: {period.from ? format(period.from, 'd MMM yyyy') : '—'} – {period.to ? format(period.to, 'd MMM yyyy') : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--muted)] mb-0.5">Closing Balance</p>
              <p className={`tabular text-xl font-bold ${closingBalance > 0 ? 'text-[var(--neg)]' : 'text-[var(--pos)]'}`}>
                {formatCurrency(Math.abs(closingBalance))}
              </p>
              <p className="text-xs text-[var(--faint)]">
                {closingBalance > 0 ? 'Receivable / Dr' : closingBalance < 0 ? 'Payable / Cr' : 'NIL'}
              </p>
            </div>
          </div>

          {/* Opening row */}
          <div className="px-6 py-3 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--muted)]">Opening Balance</span>
            <span className="tabular text-[var(--text)] font-semibold">{formatCurrency(openingBalance)}</span>
          </div>

          {/* Transactions */}
          {filteredTxns.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--faint)]">No transactions in this period.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[var(--border)]">
                  {['Date', 'Reference', 'Description', 'Debit (Dr)', 'Credit (Cr)', 'Balance'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="px-5 py-3 text-[var(--muted)] whitespace-nowrap">{t.date}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--primary)]">{t.ref}</td>
                    <td className="px-5 py-3 text-[var(--text)]">{t.desc}</td>
                    <td className="px-5 py-3 text-right tabular">
                      {t.dr > 0
                        ? <span className="text-[var(--pos)] font-medium">{formatCurrency(t.dr)}</span>
                        : <span className="text-[var(--faint)]">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-right tabular">
                      {t.cr > 0
                        ? <span className="text-[var(--neg)] font-medium">{formatCurrency(t.cr)}</span>
                        : <span className="text-[var(--faint)]">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-right tabular font-semibold text-[var(--text)]">
                      {formatCurrency(t.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--border)]">
                  <td colSpan={3} className="px-5 py-3 text-xs font-bold text-[var(--muted)] uppercase">Total</td>
                  <td className="px-5 py-3 text-right tabular font-bold text-[var(--pos)]">
                    {formatCurrency(totalDr)}
                  </td>
                  <td className="px-5 py-3 text-right tabular font-bold text-[var(--neg)]">
                    {formatCurrency(totalCr)}
                  </td>
                  <td className="px-5 py-3 text-right tabular font-bold text-[var(--text)]">
                    {formatCurrency(closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
