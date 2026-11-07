import { useState, useEffect, useMemo } from 'react'
import { Zap } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getEInvoices } from '../../data/services/taxService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

function StatusChip({ status }) {
  const map = {
    generated: 'bg-[var(--pos-tint)] text-[var(--pos)]',
    pending: 'bg-[var(--primary-tint)] text-[var(--primary)]',
    cancelled: 'bg-[var(--neg-tint)] text-[var(--neg)]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{status}</span>
}

export default function EInvoicing() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  useEffect(() => { getEInvoices().then(d => { setInvoices(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => invoices.filter(i => {
    const matchSearch = !search || i.invoiceNo.toLowerCase().includes(search.toLowerCase()) || i.party.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [invoices, search, statusFilter])

  const generated = invoices.filter(i => i.status === 'generated').length
  const pending = invoices.filter(i => i.status === 'pending').length
  const cancelled = invoices.filter(i => i.status === 'cancelled').length

  const title = (() => {
    if (countryCode === 'US') return 'Electronic Invoicing & EDI'
    if (countryCode === 'GB') return 'E-Invoicing & Peppol'
    if (countryCode === 'AE') return 'ZATCA / FTA E-Invoicing'
    return 'E-Invoicing'
  })()

  const subtitle = (() => {
    if (countryCode === 'US') return 'B2B electronic invoicing, Peppol network & digital audit trails'
    if (countryCode === 'GB') return 'Making Tax Digital compliant digital links & Peppol exchange'
    if (countryCode === 'AE') return 'ZATCA Phase-2 clearance, cryptographic stamp & XML generation'
    return 'IRN generation, QR code & GSTN clearance management'
  })()

  const idColLabel = (() => {
    if (countryCode === 'US') return 'EDI / Doc UUID'
    if (countryCode === 'GB') return 'Peppol Msg ID'
    if (countryCode === 'AE') return 'ZATCA Hash / UUID'
    return 'IRN'
  })()

  const kpis = [
    { label: 'Cleared / Generated', value: generated, color: 'var(--pos)' },
    { label: 'Pending Transmission', value: pending, color: 'var(--warn)' },
    { label: 'Rejected / Cancelled', value: cancelled, color: 'var(--neg)' },
  ]

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No', render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'party', label: 'Party', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'irn', label: idColLabel, render: v => v ? <span className="font-mono text-xs text-[var(--muted)]">{v.slice(0, 16)}…</span> : <span className="text-[var(--faint)]">—</span> },
    { key: 'ackDate', label: 'Ack Timestamp', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${subtitle} · (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={['Tax Center', title]}
        action={<Button variant="primary" icon={Zap} size="sm">Transmit Bulk E-Invoices</Button>}
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
          <Filters search={search} onSearchChange={setSearch} placeholder="Search invoice or party…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Statuses</option>
              <option value="generated">Cleared / Generated</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
