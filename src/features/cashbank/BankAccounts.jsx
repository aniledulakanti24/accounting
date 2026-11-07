import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Landmark, TrendingUp, TrendingDown } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getBankAccounts } from '../../data/services/cashBankService'

const TYPE_COLORS = {
  Current:  'bg-blue-50 text-blue-700',
  Savings:  'bg-green-50 text-green-700',
  Overdraft:'bg-red-50 text-red-700',
  FD:       'bg-purple-50 text-purple-700',
  Cash:     'bg-amber-50 text-amber-700',
}

export default function BankAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { getBankAccounts().then(d => { setAccounts(d); setLoading(false) }) }, [])

  const totalBalance = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const totalOD      = accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)

  return (
    <div>
      <PageHeader title="Bank Accounts" subtitle="All bank and cash accounts" breadcrumb={['Cash & Bank', 'Bank Accounts']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={RefreshCw} size="sm">Sync All</Button><Button variant="primary" icon={Plus} size="sm">Add Account</Button></div>}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[{label:'Total Cash & Bank',value:formatCompact(totalBalance),color:'var(--pos)'},{label:'Overdraft / OD',value:formatCompact(Math.abs(totalOD)),color:'var(--neg)'},{label:'Net Position',value:formatCompact(totalBalance+totalOD),color:'var(--text)'}].map(k=>(
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Account cards */}
      {loading ? <p className="text-sm text-[var(--muted)] p-8 text-center">Loading…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm text-[var(--text)]">{acc.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{acc.bank}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[acc.type] ?? 'bg-gray-100 text-gray-500'}`}>{acc.type}</span>
              </div>
              <div className="mb-3">
                <p className="tabular text-2xl font-bold" style={{color: acc.balance >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
                  {acc.balance < 0 ? '−' : ''}{formatCurrency(Math.abs(acc.balance))}
                </p>
              </div>
              <div className="text-xs text-[var(--faint)] space-y-1 border-t border-[var(--border)] pt-3">
                {acc.accountNo !== '—' && <p>A/c: <span className="font-mono">{acc.accountNo}</span></p>}
                {acc.ifsc !== '—' && <p>IFSC: <span className="font-mono">{acc.ifsc}</span></p>}
                <p>Branch: {acc.branch}</p>
                {acc.lastSync && <p>Synced: {acc.lastSync}</p>}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" className="flex-1">Ledger</Button>
                <Button variant="secondary" size="sm" className="flex-1">Reconcile</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
