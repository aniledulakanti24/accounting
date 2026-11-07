import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getTaxPayments } from '../../data/services/taxService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

function TypeChip({ type }) {
  const map = {
    'GST':          'bg-[var(--primary-tint)] text-[var(--primary)]',
    'SalesTax':     'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'VAT':          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'TDS':          'bg-[#fef3c7] text-[#92400e]',
    'Withholding':  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'Adv Tax':      'bg-[#ede9fe] text-[#6d28d9]',
    'Corporate Tax':'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[type] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{type}</span>
}

function StatusChip({ status }) {
  const styles = status === 'paid' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--primary-tint)] text-[var(--primary)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function TaxPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  useEffect(() => {
    getTaxPayments().then(d => {
      // Map payment types to country tax system if needed
      const mapped = d.map(p => ({
        ...p,
        type: p.type === 'GST' ? (countryCode === 'IN' ? 'GST' : countryConfig.taxSystem) : p.type,
      }))
      setPayments(mapped)
      setLoading(false)
    })
  }, [countryCode, countryConfig.taxSystem])

  const filtered = useMemo(() => payments.filter(i => {
    const term = search.toLowerCase()
    const matchSearch = !search || i.task?.toLowerCase().includes(term) || (i.challanNo && i.challanNo.toLowerCase().includes(term))
    const matchType = typeFilter === 'All' || i.type === typeFilter
    return matchSearch && matchType
  }), [payments, search, typeFilter])

  const totalPaid = payments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = payments.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)

  const kpis = [
    { label: 'Total Paid', value: formatCompact(totalPaid), color: 'var(--pos)' },
    { label: 'Pending Remittance', value: formatCompact(totalPending), color: 'var(--warn)' },
    { label: 'Payment Records', value: payments.length, color: 'var(--text)' },
  ]

  const columns = [
    { key: 'type', label: 'Tax Category', render: v => <TypeChip type={v} /> },
    { key: 'period', label: 'Tax Period', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'challanNo', label: countryCode === 'IN' ? 'Challan No' : 'Receipt / EFT Ref', render: v => <span className="font-mono text-xs text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'date', label: 'Payment Date', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'amount', label: 'Remitted Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'bank', label: 'Payment Method', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Tax Payments & Remittances"
        subtitle={`Statutory ${countryConfig.taxSystem}, withholding & tax payment records · (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={['Tax Center', 'Tax Payments']}
        action={<Button variant="primary" icon={Plus} size="sm">Record Remittance</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search receipt ref, task or period…">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Categories</option>
              <option value={countryCode === 'IN' ? 'GST' : countryConfig.taxSystem}>{countryCode === 'IN' ? 'GST' : countryConfig.taxSystem}</option>
              <option value="TDS">TDS / Withholding</option>
              <option value="Adv Tax">Advance / Estimated Tax</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
