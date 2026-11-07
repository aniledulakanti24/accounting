import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getGSTR2B } from '../../data/services/taxService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

function StatusChip({ status, ok = true }) {
  const styles = ok ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--neg-tint)] text-[var(--neg)]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status}</span>
}

export default function GSTReconciliation() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  useEffect(() => {
    getGSTR2B().then(d => { setData(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => data.filter(i => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || i.supplier.toLowerCase().includes(term)
      || i.invoiceNo.toLowerCase().includes(term)
      || (i.gstin && i.gstin.toLowerCase().includes(term))
    const matchStatus = statusFilter === 'All' || i.itcStatus === statusFilter
    return matchSearch && matchStatus
  }), [data, search, statusFilter])

  const totalInputTax = data.filter(i => i.itcStatus === 'Available').reduce((s, i) => s + (i.cgst || 0) + (i.sgst || 0), 0)
  const matchedCount = data.filter(i => i.matched).length
  const unmatchedCount = data.filter(i => !i.matched).length

  const title = (() => {
    if (countryCode === 'US') return 'Sales Tax Exemption Matching'
    if (countryCode === 'GB') return 'HMRC MTD Input VAT Reconciliation'
    if (countryCode === 'AE') return 'FTA VAT Input Recovery Reconciliation'
    return 'GST Reconciliation'
  })()

  const subtitle = (() => {
    if (countryCode === 'US') return 'Customer resale certificate matching, 501(c)(3) verification & non-taxable sales audit'
    if (countryCode === 'GB') return 'Digital link matching between purchase invoices, supplier VAT registration & HMRC ledger'
    if (countryCode === 'AE') return 'Matching supplier Tax Invoices & Customs BOE declarations with recoverable VAT ledger'
    return 'GSTR-2B ITC matching & reconciliation with purchase register'
  })()

  const kpis = [
    {
      label: countryCode === 'IN' ? 'Total ITC Available' : `Total Recoverable ${countryConfig.taxSystem}`,
      value: formatCompact(totalInputTax),
      color: 'var(--pos)',
    },
    { label: 'Statutory Matched', value: matchedCount, color: 'var(--pos)' },
    { label: 'Unmatched / Variance', value: unmatchedCount, color: 'var(--neg)' },
  ]

  const columns = [
    {
      key: 'supplier',
      label: countryCode === 'US' ? 'Account / Customer' : 'Supplier',
      render: v => <span className="font-medium text-[var(--text)]">{v}</span>,
    },
    {
      key: 'gstin',
      label: countryConfig.taxIdLabel,
      render: v => <span className="font-mono text-xs text-[var(--muted)]">{v}</span>,
    },
    {
      key: 'invoiceNo',
      label: countryCode === 'US' ? 'Invoice / Certificate Ref' : 'Invoice No',
      render: v => <span className="text-sm text-[var(--text)]">{v}</span>,
    },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'taxable', label: 'Taxable Base', align: 'right', render: v => <span className="tabular text-sm">{formatCurrency(v)}</span> },
    {
      key: 'cgst',
      label: countryCode === 'IN' ? 'GST (C+S)' : countryConfig.taxSystem,
      align: 'right',
      render: (v, row) => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(v + (row.sgst || 0))}</span>,
    },
    {
      key: 'itcStatus',
      label: countryCode === 'IN' ? 'ITC Status' : 'Recovery Status',
      render: v => <StatusChip status={v} ok={v === 'Available'} />,
    },
    {
      key: 'matched',
      label: 'Verified',
      align: 'center',
      render: v => v ? <CheckCircle2 size={16} className="text-[var(--pos)] mx-auto" /> : <XCircle size={16} className="text-[var(--neg)] mx-auto" />,
    },
  ]

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${subtitle} · (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={['Tax Center', title]}
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
          <Filters
            search={search}
            onSearchChange={setSearch}
            placeholder={`Search by counterparty, ${countryConfig.taxIdLabel} or reference…`}
          >
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available / Active</option>
              <option value="Blocked">Blocked / Pending</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
