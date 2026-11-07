import { useState, useEffect } from 'react'
import { Download, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getARAgeing, getARInvoices } from '../../data/services/receivablesService'

function AgeBar({ row }) {
  const total = row.total || 1
  const buckets = [
    { key: 'current', color: 'bg-[var(--pos)]',     label: '0–30d',  val: row.current  },
    { key: 'd31_60',  color: 'bg-[var(--warn)]',    label: '31–60d', val: row.d31_60   },
    { key: 'd61_90',  color: 'bg-orange-500',        label: '61–90d', val: row.d61_90   },
    { key: 'd90plus', color: 'bg-[var(--neg)]',      label: '90d+',   val: row.d90plus  },
  ]
  return (
    <div className="flex rounded-sm overflow-hidden h-2 w-28 gap-px">
      {buckets.map(b => b.val > 0 && (
        <div
          key={b.key}
          className={b.color}
          style={{ width: `${(b.val / total) * 100}%` }}
          title={`${b.label}: ${formatCurrency(b.val)}`}
        />
      ))}
    </div>
  )
}

export default function Ageing() {
  const [ageing, setAgeing]     = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getARAgeing(), getARInvoices()]).then(([a, inv]) => {
      setAgeing(a); setInvoices(inv); setLoading(false)
    })
  }, [])

  const totals = ageing.reduce((acc, r) => ({
    total:   acc.total   + r.total,
    current: acc.current + r.current,
    d31_60:  acc.d31_60  + r.d31_60,
    d61_90:  acc.d61_90  + r.d61_90,
    d90plus: acc.d90plus + r.d90plus,
  }), { total: 0, current: 0, d31_60: 0, d61_90: 0, d90plus: 0 })

  const overdueTotal = totals.d31_60 + totals.d61_90 + totals.d90plus

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val) => <span className="font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'total',
      label: 'Total Outstanding',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'current',
      label: '0–30 Days',
      align: 'right',
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'text-[var(--pos)] font-medium' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'd31_60',
      label: '31–60 Days',
      align: 'right',
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'text-[var(--warn)] font-medium' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'd61_90',
      label: '61–90 Days',
      align: 'right',
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'text-orange-600 font-medium' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'd90plus',
      label: '90+ Days',
      align: 'right',
      render: (val) => (
        <span className={`tabular text-sm ${val > 0 ? 'text-[var(--neg)] font-semibold' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'd90plus',
      label: 'Age Mix',
      render: (_, row) => <AgeBar row={row} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="AR Ageing"
        subtitle="Outstanding by age bucket"
        breadcrumb={['Receivables', 'Ageing']}
        action={<Button variant="secondary" icon={Download} size="sm">Export</Button>}
      />

      {/* KPI buckets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Outstanding', value: formatCompact(totals.total),   color: 'var(--text)'    },
          { label: '0–30 Days',         value: formatCompact(totals.current), color: 'var(--pos)'     },
          { label: '31–90 Days',        value: formatCompact(totals.d31_60 + totals.d61_90), color: 'var(--warn)'    },
          { label: '90+ Days (Critical)', value: formatCompact(totals.d90plus), color: 'var(--neg)'   },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueTotal > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--neg-tint)] border border-[var(--neg)]/20 text-xs text-[var(--neg)] mb-5">
          <AlertTriangle size={13} />
          <span>
            <strong>{formatCompact(overdueTotal)}</strong> overdue across {ageing.filter(r => r.d31_60 + r.d61_90 + r.d90plus > 0).length} customers.
            Review collections immediately.
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={ageing}
        loading={loading}
        rowKey="id"
      />

      {/* Totals footer */}
      {!loading && ageing.length > 0 && (
        <div className="mt-0 border border-t-2 border-[var(--border)] border-t-[var(--primary)] bg-[var(--surface-2)] rounded-b-[var(--radius-sm)] px-4 py-3 grid grid-cols-[1fr_repeat(5,auto)] gap-4">
          <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Totals</span>
          {[totals.total, totals.current, totals.d31_60, totals.d61_90, totals.d90plus].map((v, i) => (
            <span key={i} className="tabular text-sm font-bold text-[var(--text)] text-right">{formatCurrency(v)}</span>
          ))}
        </div>
      )}
    </div>
  )
}
