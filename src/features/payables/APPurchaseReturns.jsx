import { useState, useEffect } from 'react'
import { Download, PackageCheck, Plus, ReceiptIndianRupee, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getAPPurchaseReturns } from '../../data/services/payablesService'

const STATUS_CFG = {
  approved: { bg:'bg-[var(--pos-tint)]',     text:'text-[var(--pos)]',     label:'Approved' },
  pending:  { bg:'bg-[var(--primary-tint)]', text:'text-[var(--primary)]', label:'Pending'  },
  rejected: { bg:'bg-[var(--neg-tint)]',     text:'text-[var(--neg)]',     label:'Rejected' },
}

export default function APPurchaseReturns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getAPPurchaseReturns().then(d => { setReturns(d); setLoading(false) }) }, [])

  const totalValue = returns.reduce((s,r) => s + r.amount, 0)
  const approvedValue = returns.filter(r => r.status === 'approved').reduce((s,r) => s + r.amount, 0)
  const pendingValue = returns.filter(r => r.status === 'pending').reduce((s,r) => s + r.amount, 0)
  const maxReturn = Math.max(approvedValue, pendingValue, 1)

  const columns = [
    { key:'ref',      label:'Ref #',          render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date',     label:'Date',           sortable:true, render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Supplier',       sortable:true, render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'invoice',  label:'Against Invoice',render: v => <span className="font-mono text-xs text-[var(--faint)]">{v}</span> },
    { key:'items',    label:'Items',          render: v => <span className="text-sm text-center text-[var(--muted)]">{v}</span> },
    { key:'reason',   label:'Reason',         render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'amount',   label:'Amount',         align:'right', sortable:true, render: v => <span className="tabular text-sm font-semibold text-[var(--neg)]">{formatCurrency(v)}</span> },
    { key:'_settlement', label:'Settlement', render: (_, row) => (
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{row.status === 'approved' ? 'Ready to adjust' : 'Awaiting approval'}</p>
        <p className="text-[11px] text-[var(--faint)]">{row.status === 'approved' ? 'Included in Pay Center' : 'Hold payment impact'}</p>
      </div>
    ) },
    { key:'status',   label:'Status',         render: v => { const c=STATUS_CFG[v]??{bg:'bg-gray-100',text:'text-gray-500',label:v}; return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span> } },
  ]

  return (
    <div>
      <PageHeader title="Returns" subtitle="Supplier returns that convert into debit notes, credits, or payment reductions" breadcrumb={['Money Out', 'Returns']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm">New Return</Button></div>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label:'Total Return Value', value:formatCompact(totalValue), color:'var(--neg)' },
          { label:'Approved Returns',   value:returns.filter(r=>r.status==='approved').length, color:'var(--pos)' },
          { label:'Pending Returns',    value:returns.filter(r=>r.status==='pending').length, color:'var(--primary)' },
          { label:'Ready To Adjust',    value:formatCompact(approvedValue), color:'var(--warn)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><PackageCheck size={15} className="text-[var(--primary)]" /> GRN-linked Return</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Return rows carry supplier, invoice, item count, and reason into payment settlement.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><ReceiptIndianRupee size={15} className="text-[var(--warn)]" /> Credit Conversion</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Approved returns can become debit notes or direct deductions in the smart pay run.</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]"><ShieldCheck size={15} className="text-[var(--pos)]" /> ITC Protection</div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">Pending returns hold payment impact until approval, reducing tax and supplier disputes.</p>
        </div>
      </div>
      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Return Settlement Funnel</p>
          <p className="mt-1 text-xs text-[var(--faint)]">Approved value can reduce the next supplier payment immediately</p>
        </div>
        {[
          { label: 'Approved for adjustment', value: approvedValue, color: 'var(--pos)' },
          { label: 'Pending approval', value: pendingValue, color: 'var(--primary)' },
        ].map(item => (
          <div key={item.label} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">{item.label}</span>
              <span className="tabular text-xs font-bold text-[var(--text)]">{formatCompact(item.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(8, (item.value / maxReturn) * 100)}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={returns} loading={loading} rowKey="id" />
    </div>
  )
}
