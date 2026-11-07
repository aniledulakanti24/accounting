import { useEffect, useMemo, useState } from 'react'
import { Download, Mail, MessageSquare, Send, Share2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCompact, formatCurrency } from '../../lib/currency'
import { getARInvoices, getReceipts } from '../../data/services/receivablesService'
import { toast } from '../../lib/toast'

const PERIODS = ['Current Month', 'Last 30 Days', 'Last Quarter', 'Financial Year']

const DELIVERY_CFG = {
  ready:   { label: 'Ready',   bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]' },
  sent:    { label: 'Sent',    bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]' },
  overdue: { label: 'Overdue', bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]' },
  clear:   { label: 'Clear',   bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]' },
}

function buildStatements(invoices, receipts) {
  const byCustomer = new Map()
  invoices.forEach(invoice => {
    const row = byCustomer.get(invoice.customer) ?? {
      id: invoice.customer,
      customer: invoice.customer,
      invoices: 0,
      billed: 0,
      collected: 0,
      outstanding: 0,
      lastInvoice: invoice.date,
      lastReceipt: '-',
      status: 'clear',
      deliveryStatus: 'clear',
      autoSend: false,
    }
    row.invoices += 1
    row.billed += invoice.total
    row.collected += invoice.paid
    row.outstanding += invoice.balance
    row.lastInvoice = invoice.date > row.lastInvoice ? invoice.date : row.lastInvoice
    if (invoice.status === 'overdue') row.status = 'overdue'
    else if (invoice.status === 'partial' && row.status !== 'overdue') row.status = 'partial'
    row.deliveryStatus = row.outstanding > 0 ? (row.status === 'overdue' ? 'overdue' : 'ready') : 'clear'
    row.autoSend = row.outstanding > 0 && row.status !== 'overdue'
    byCustomer.set(invoice.customer, row)
  })
  receipts.forEach(receipt => {
    const row = byCustomer.get(receipt.customer)
    if (!row) return
    row.lastReceipt = row.lastReceipt === '-' || receipt.date > row.lastReceipt ? receipt.date : row.lastReceipt
  })
  return [...byCustomer.values()]
}

function DeliveryChip({ value }) {
  const cfg = DELIVERY_CFG[value] ?? DELIVERY_CFG.ready
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
}

export default function CustomerStatements() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('Current Month')

  useEffect(() => {
    Promise.all([getARInvoices(), getReceipts()]).then(([invoices, receipts]) => {
      setRows(buildStatements(invoices, receipts))
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(row => row.customer.toLowerCase().includes(term))
  }, [rows, search])

  const totalOutstanding = rows.reduce((sum, row) => sum + row.outstanding, 0)
  const statementDue = rows.filter(row => row.outstanding > 0).length
  const autoSendReady = rows.filter(row => row.autoSend).length
  const deliveryOverdue = rows.filter(row => row.deliveryStatus === 'overdue').length

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: value => <span className="font-semibold text-[var(--text)]">{value}</span>,
    },
    { key: 'invoices', label: 'Invoices', align: 'right', sortable: true },
    {
      key: 'billed',
      label: 'Billed',
      align: 'right',
      sortable: true,
      render: value => <span className="tabular text-[var(--muted)]">{formatCurrency(value)}</span>,
    },
    {
      key: 'collected',
      label: 'Collected',
      align: 'right',
      render: value => <span className="tabular font-semibold text-[var(--pos)]">{formatCurrency(value)}</span>,
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      align: 'right',
      sortable: true,
      render: value => <span className={`tabular font-bold ${value > 0 ? 'text-[var(--neg)]' : 'text-[var(--faint)]'}`}>{value > 0 ? formatCurrency(value) : '-'}</span>,
    },
    { key: 'lastInvoice', label: 'Last Invoice', sortable: true },
    { key: 'lastReceipt', label: 'Last Receipt', sortable: true },
    {
      key: 'deliveryStatus',
      label: 'Delivery',
      render: (value, row) => (
        <div className="space-y-1">
          <DeliveryChip value={value} />
          <p className="text-[10px] text-[var(--faint)]">{row.autoSend ? 'Auto-send on' : 'Manual send'}</p>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customer Statements"
        subtitle="Preview, send, and schedule customer-wise account statements"
        breadcrumb={['Money In', 'Customer Statements']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={() => toast.success('Statement PDFs prepared')}>Download PDF</Button>
            <Button variant="secondary" icon={Mail} size="sm" onClick={() => toast.info('Email statements queued')}>Email</Button>
            <Button variant="primary" icon={MessageSquare} size="sm" onClick={() => toast.info('WhatsApp statements queued')}>WhatsApp</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Customers', value: rows.length, color: 'var(--text)' },
          { label: 'Statements Due', value: statementDue, color: 'var(--primary)' },
          { label: 'Outstanding', value: formatCompact(totalOutstanding), color: 'var(--neg)' },
          { label: 'Auto-send Ready', value: autoSendReady, color: 'var(--pos)' },
          { label: 'Delivery Overdue', value: deliveryOverdue, color: 'var(--warn)' },
          { label: 'Ready to Send', value: `${filtered.length} PDFs`, color: 'var(--text)' },
        ].map(item => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{item.label}</p>
            <p className="tabular mt-1 text-xl font-black" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <section className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div>
            <p className="text-sm font-black text-[var(--text)]">Statement Preview Settings</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Choose a period before downloading or sending statements. Delivery status is shown per customer below.</p>
          </div>
          <select
            value={period}
            onChange={event => setPeriod(event.target.value)}
            className="h-10 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          >
            {PERIODS.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder={`Search customer... ${period}`} />}
        actions={(row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" icon={Share2} onClick={(event) => { event.stopPropagation(); toast.info(`Share options opened for ${row.customer}`) }}>Share</Button>
            <Button variant="secondary" size="sm" icon={Send} onClick={(event) => { event.stopPropagation(); toast.success(`Statement sent to ${row.customer}`) }}>Send</Button>
            <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); toast.info(`Monthly auto-send ${row.autoSend ? 'enabled' : 'disabled'} for ${row.customer}`) }}>Auto</Button>
          </div>
        )}
      />
    </div>
  )
}
