import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getTCSCollections } from '../../data/services/taxService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

function StatusChip({ status }) {
  const styles = status === 'deposited' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--primary-tint)] text-[var(--primary)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function TCS() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  useEffect(() => { getTCSCollections().then(d => { setCollections(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => collections.filter(i => {
    const term = search.toLowerCase()
    const matchSearch = !search || i.customer.toLowerCase().includes(term) || i.nature.toLowerCase().includes(term)
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [collections, search, statusFilter])

  const totalCollected = collections.reduce((s, i) => s + i.tcsAmt, 0)
  const totalDeposited = collections.filter(i => i.status === 'deposited').reduce((s, i) => s + i.tcsAmt, 0)
  const totalPending = collections.filter(i => i.status === 'pending').reduce((s, i) => s + i.tcsAmt, 0)

  const title = (() => {
    if (countryCode === 'US') return 'Backup Withholding & Surcharges'
    if (countryCode === 'GB') return 'Domestic Reverse Charge'
    if (countryCode === 'AE') return 'Reverse Charge Mechanism (RCM)'
    return 'TCS Collections'
  })()

  const subtitle = (() => {
    if (countryCode === 'US') return 'Backup withholding collected from non-certified payees & state surcharges'
    if (countryCode === 'GB') return 'HMRC domestic reverse charge collections & industry levies'
    if (countryCode === 'AE') return 'B2B reverse charge collections & cross-border commercial tax'
    return 'Tax Collected at Source — section-wise tracking & challan deposit'
  })()

  const kpis = [
    { label: countryCode === 'IN' ? 'Total TCS Collected' : 'Total Collected', value: formatCompact(totalCollected), color: 'var(--text)' },
    { label: 'Deposited to Treasury', value: formatCompact(totalDeposited), color: 'var(--pos)' },
    { label: 'Pending Remittance', value: formatCompact(totalPending), color: 'var(--warn)' },
  ]

  const columns = [
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'customer', label: 'Customer / Buyer', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'invoice', label: 'Invoice Ref', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'nature', label: countryCode === 'IN' ? 'Nature / Section' : 'Category / Classification', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'grossAmt', label: 'Gross Value', align: 'right', render: v => <span className="tabular text-sm text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'tcsRate', label: 'Rate %', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v}</span> },
    { key: 'tcsAmt', label: 'Tax Collected', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--pos)]">{formatCurrency(v)}</span> },
    { key: 'challanNo', label: countryCode === 'IN' ? 'Challan No' : 'Deposit Ref', render: v => <span className="font-mono text-xs text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${subtitle} · (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={['Tax Center', title]}
        action={<Button variant="primary" icon={Plus} size="sm">Record Collection</Button>}
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
          <Filters search={search} onSearchChange={setSearch} placeholder="Search customer, classification or ref…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Statuses</option>
              <option value="deposited">Deposited / Remitted</option>
              <option value="pending">Pending</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
