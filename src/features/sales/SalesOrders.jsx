import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Download, FilePlus, FileText, PackageCheck, Receipt, ShieldAlert, Truck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'
import { getSalesOrders } from '../../data/services/salesService'

const FULFILMENT_CFG = {
  ready:      { label: 'Ready',      tone: 'text-[var(--pos)] bg-[var(--pos-tint)]', icon: PackageCheck },
  dispatched: { label: 'Dispatched', tone: 'text-[var(--primary)] bg-[var(--primary-tint)]', icon: Truck },
  delivered:  { label: 'Delivered',  tone: 'text-[var(--pos)] bg-[var(--pos-tint)]', icon: PackageCheck },
  pending:    { label: 'Pending',    tone: 'text-[var(--warn)] bg-[var(--warn-tint)]', icon: Truck },
  blocked:    { label: 'Blocked',    tone: 'text-[var(--neg)] bg-[var(--neg-tint)]', icon: ShieldAlert },
}

function FulfilmentChip({ value }) {
  const cfg = FULFILMENT_CFG[value] ?? FULFILMENT_CFG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.tone}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

export default function SalesOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getSalesOrders().then(d => { setOrders(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => orders.filter(order => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || order.customer.toLowerCase().includes(q)
      || order.ref.toLowerCase().includes(q)
      || (order.quote ?? '').toLowerCase().includes(q)
      || (order.invoice ?? '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || order.status === statusFilter
    return matchSearch && matchStatus
  }), [orders, search, statusFilter])

  const orderValue = orders.reduce((sum, order) => sum + order.amount, 0)
  const openValue = orders
    .filter(order => order.status !== 'invoiced')
    .reduce((sum, order) => sum + order.amount - order.advance, 0)
  const readyCount = orders.filter(order => order.fulfilment === 'ready').length
  const blockedCount = orders.filter(order => order.fulfilment === 'blocked').length

  function handleExport() {
    exportCsv(filtered, 'sales-orders', ['ref', 'date', 'customer', 'quote', 'items', 'amount', 'advance', 'expectedShip', 'invoice', 'status'])
    toast.success(`Exported ${filtered.length} sales orders`)
  }

  function runOrderAction(label, row) {
    toast.success(`${label} for ${row.ref}`)
  }

  const columns = [
    {
      key: 'ref',
      label: 'Order #',
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-[var(--primary)]">{val}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-[10px] text-[var(--faint)]">
            {row.quote ? `From ${row.quote}` : 'Direct order'}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Order Value',
      align: 'right',
      sortable: true,
      sum: true,
      render: (val, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold text-[var(--text)]">{formatCurrency(val)}</span>
        : <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'advance',
      label: 'Advance',
      align: 'right',
      sum: true,
      render: (val, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold text-[var(--pos)]">{formatCurrency(val)}</span>
        : <span className={`tabular text-sm ${val ? 'text-[var(--pos)] font-medium' : 'text-[var(--faint)]'}`}>
            {val ? formatCurrency(val) : '-'}
          </span>,
    },
    {
      key: 'expectedShip',
      label: 'Expected Ship',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="text-sm text-[var(--muted)]">{val}</p>
          <p className="text-[10px] text-[var(--faint)]">{row.invoice ? `Invoice ${row.invoice}` : 'Not invoiced'}</p>
        </div>
      ),
    },
    {
      key: 'fulfilment',
      label: 'Fulfilment',
      render: (val) => <FulfilmentChip value={val} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val === 'confirmed' ? 'open' : val === 'invoiced' ? 'closed' : val === 'on-hold' ? 'pending' : val} label={val.replace('-', ' ')} />,
    },
    {
      key: 'nextAction',
      label: 'Next',
      render: (val, row) => (
        <div>
          <Button
            variant={row.fulfilment === 'blocked' ? 'danger' : 'secondary'}
            size="sm"
            iconRight={ArrowRight}
            onClick={() => toast.info(`${val} for ${row.ref}`)}
          >
            {val}
          </Button>
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => runOrderAction('Delivery challan created', row)}
              className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <Truck size={10} /> Challan
            </button>
            <button
              onClick={() => runOrderAction(row.invoice ? 'Invoice opened' : 'Invoice draft created', row)}
              className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <FileText size={10} /> Invoice
            </button>
            <button
              onClick={() => runOrderAction('Receipt step opened', row)}
              className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <Receipt size={10} /> Receipt
            </button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        subtitle="Track confirmed orders before delivery, invoicing, and collection"
        breadcrumb={['Sales Operations', 'Sales Orders']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="primary" icon={FilePlus} size="sm" onClick={() => toast.success('Sales order draft opened')}>New Order</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Order Pipeline', value: formatCompact(orderValue), color: 'var(--text)' },
          { label: 'Open to Invoice', value: formatCompact(openValue), color: 'var(--primary)' },
          { label: 'Ready to Ship', value: readyCount, color: 'var(--pos)' },
          { label: 'Blocked', value: blockedCount, color: 'var(--neg)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">One-click document chain</p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          {['Quote', 'Sales Order', 'Delivery Challan', 'Invoice', 'Receipt'].map((step, index, arr) => (
            <span key={step} className="inline-flex items-center gap-2">
              <span className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[var(--text)]">{step}</span>
              {index < arr.length - 1 && <ArrowRight size={13} className="text-[var(--faint)]" />}
            </span>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        showTotals
        rowClassName={(row) => row.fulfilment === 'blocked' ? 'bg-[var(--neg-tint)]/40' : ''}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search order, quote, invoice, customer...">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="partial">Partial</option>
              <option value="invoiced">Invoiced</option>
              <option value="on-hold">On Hold</option>
            </select>
          </Filters>
        }
      />
    </div>
  )
}
