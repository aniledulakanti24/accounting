import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getOnlineOrders } from '../../data/services/businessToolsService'

function PlatformChip({ platform }) {
  const map = {
    Website:  'bg-[var(--primary-tint)] text-[var(--primary)]',
    WhatsApp: 'bg-[#dcfce7] text-[#15803d]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[platform] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{platform}</span>
}

function StatusChip({ status }) {
  const map = {
    confirmed:  'bg-[var(--primary-tint)] text-[var(--primary)]',
    dispatched: 'bg-[#fef3c7] text-[#92400e]',
    delivered:  'bg-[var(--pos-tint)] text-[var(--pos)]',
    cancelled:  'bg-[var(--neg-tint)] text-[var(--neg)]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{status}</span>
}

export default function OnlineOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => { getOnlineOrders().then(d => { setOrders(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => orders.filter(i => {
    const matchSearch = !search || i.customer.toLowerCase().includes(search.toLowerCase()) || i.ref.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  }), [orders, search, statusFilter])

  const totalRevenue = orders.reduce((s, i) => s + i.amount, 0)
  const pendingCount = orders.filter(i => i.status === 'confirmed' || i.status === 'dispatched').length

  const kpis = [
    { label: 'Total Orders', value: orders.length, color: 'var(--text)' },
    { label: 'Total Revenue', value: formatCompact(totalRevenue), color: 'var(--pos)' },
    { label: 'Pending', value: pendingCount, color: 'var(--warn)' },
  ]

  const columns = [
    { key: 'ref', label: 'Order Ref', render: v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'customer', label: 'Customer', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'items', label: 'Items', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v}</span> },
    { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'platform', label: 'Platform', render: v => <PlatformChip platform={v} /> },
    { key: 'payment', label: 'Payment', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Online Orders" subtitle="Website & WhatsApp order management" breadcrumb={['Business Tools', 'Online Orders']} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search customer or order ref…">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
            <option value="All">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
