import { useState, useEffect, useMemo } from 'react'
import { Truck, Plus, Download, Package, CheckCircle2, Clock, RotateCcw, FileText } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { getChallans } from '../../data/services/salesService'

const STATUS_CFG = {
  pending:    { bg: 'bg-gray-100',              text: 'text-gray-500',         label: 'Pending',    icon: Clock        },
  dispatched: { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]', label: 'Dispatched', icon: Truck        },
  delivered:  { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Delivered',  icon: CheckCircle2 },
  returned:   { bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]',     label: 'Returned',   icon: RotateCcw    },
}

const MODE_COLORS = {
  Road: 'bg-blue-50 text-blue-600',
  Rail: 'bg-purple-50 text-purple-600',
  Air:  'bg-orange-50 text-orange-600',
}

function StatusChip({ status }) {
  const c = STATUS_CFG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: status, icon: FileText }
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon size={10} />
      {c.label}
    </span>
  )
}

export default function DeliveryChallans() {
  const [challans, setChallans] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getChallans().then(d => { setChallans(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => challans.filter(c => {
    const matchSearch = !search
      || c.customer.toLowerCase().includes(search.toLowerCase())
      || c.ref.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    return matchSearch && matchStatus
  }), [challans, search, statusFilter])

  const dispatched = challans.filter(c => c.status === 'dispatched').length
  const delivered  = challans.filter(c => c.status === 'delivered').length
  const pending    = challans.filter(c => c.status === 'pending').length
  const returned   = challans.filter(c => c.status === 'returned').length

  const columns = [
    {
      key: 'ref',
      label: 'Challan #',
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-[var(--primary)]">{val}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val) => <span className="font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'invoice',
      label: 'Invoice Ref',
      render: (val) => val
        ? <span className="font-mono text-xs text-[var(--muted)]">{val}</span>
        : <span className="text-xs text-[var(--faint)] italic">No invoice</span>,
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'qty',
      label: 'Total Qty',
      align: 'center',
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text)]">
          <Package size={12} className="text-[var(--muted)]" />
          {val}
        </span>
      ),
    },
    {
      key: 'dispatchMode',
      label: 'Mode',
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MODE_COLORS[val] ?? 'bg-gray-100 text-gray-500'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusChip status={val} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Delivery Challans"
        subtitle="Dispatch & delivery tracking"
        breadcrumb={['Sales Operations', 'Delivery Challans']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Export</Button>
            <Button variant="primary" icon={Plus} size="sm">New Challan</Button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Pending',    value: pending,    color: 'var(--muted)'   },
          { label: 'Dispatched', value: dispatched, color: 'var(--primary)' },
          { label: 'Delivered',  value: delivered,  color: 'var(--pos)'     },
          { label: 'Returned',   value: returned,   color: 'var(--neg)'     },
        ].map(k => (
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
          <Filters search={search} onSearchChange={setSearch} placeholder="Search customer or challan…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <Truck size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No challans found</p>
          </div>
        }
      />
    </div>
  )
}
