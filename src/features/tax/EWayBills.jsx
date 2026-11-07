import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { getEWayBills } from '../../data/services/taxService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

function StatusChip({ status }) {
  const map = {
    active: 'bg-[var(--pos-tint)] text-[var(--pos)]',
    expired: 'bg-[var(--faint)] text-[var(--muted)]',
    pending: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{status}</span>
}

export default function EWayBills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  useEffect(() => { getEWayBills().then(d => { setBills(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => bills.filter(i => {
    const matchSearch = !search || i.party.toLowerCase().includes(search.toLowerCase()) || (i.ewbNo && i.ewbNo.includes(search)) || i.invoice.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [bills, search, statusFilter])

  const activeCount = bills.filter(i => i.status === 'active').length
  const expiredCount = bills.filter(i => i.status === 'expired').length
  const pendingCount = bills.filter(i => i.status === 'pending').length

  const title = (() => {
    if (countryCode === 'US') return 'Shipping & Waybills'
    if (countryCode === 'GB') return 'Customs Declarations & Freight'
    if (countryCode === 'AE') return 'Customs Clearance & Waybills'
    return 'E-Way Bills'
  })()

  const subtitle = (() => {
    if (countryCode === 'US') return 'Bill of lading (BOL), carrier manifests & interstate freight compliance'
    if (countryCode === 'GB') return 'CMR consignment notes, customs declarations & freight tracking'
    if (countryCode === 'AE') return 'Customs declarations, Bill of Entry (BOE) & trade clearance'
    return 'EWB generation, tracking & vehicle transit management'
  })()

  const docNoLabel = (() => {
    if (countryCode === 'US') return 'BOL / Tracking'
    if (countryCode === 'GB') return 'Customs / CMR No'
    if (countryCode === 'AE') return 'Customs BOE No'
    return 'EWB No'
  })()

  const kpis = [
    { label: 'Active Transit', value: activeCount, color: 'var(--pos)' },
    { label: 'Expired / Completed', value: expiredCount, color: 'var(--muted)' },
    { label: 'Pending Waybill', value: pendingCount, color: 'var(--warn)' },
  ]

  const columns = [
    { key: 'ewbNo', label: docNoLabel, render: v => <span className="font-mono text-xs text-[var(--primary)]">{v ?? '—'}</span> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'party', label: 'Party', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'invoice', label: 'Invoice', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'from', label: 'Route', render: (v, row) => <span className="text-sm text-[var(--muted)]">{v} → {row.to}</span> },
    { key: 'mode', label: 'Transport Mode', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'validTill', label: 'Valid Till', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${subtitle} · (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={['Tax Center', title]}
        action={<Button variant="primary" icon={Plus} size="sm">Generate Waybill</Button>}
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
          <Filters search={search} onSearchChange={setSearch} placeholder="Search waybill, party or invoice…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Transit</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
