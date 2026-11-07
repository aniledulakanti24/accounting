import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, CalendarClock, FileText, ReceiptText, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatCompact } from '../../lib/currency'
import {
  getARInvoiceById,
  getReceiptsForInvoice,
} from '../../data/services/receivablesService'

function StatTile({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-2)]">
          <Icon size={16} style={{ color }} />
        </span>
      </div>
      <p className="tabular text-xl font-black text-[var(--text)]">{value}</p>
    </div>
  )
}

export default function InvoicePaymentHistory() {
  const navigate = useNavigate()
  const { invoiceId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getARInvoiceById(invoiceId).then(found => {
      if (!active) return
      setInvoice(found)
      if (!found) {
        setReceipts([])
        setLoading(false)
        return
      }
      getReceiptsForInvoice(found.ref).then(history => {
        if (!active) return
        setReceipts(history)
        setLoading(false)
      })
    })
    return () => { active = false }
  }, [invoiceId])

  const clearedTotal = useMemo(
    () => receipts.filter(row => row.status === 'cleared').reduce((sum, row) => sum + row.amount, 0),
    [receipts]
  )
  const pendingTotal = useMemo(
    () => receipts.filter(row => row.status === 'pending').reduce((sum, row) => sum + row.amount, 0),
    [receipts]
  )

  const columns = [
    {
      key: 'ref',
      label: 'Receipt #',
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
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'mode',
      label: 'Mode',
      render: (val) => <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ]

  if (!loading && !invoice) {
    return (
      <div>
        <PageHeader
          title="Invoice Payment History"
          subtitle="No receivable invoice was found for this link"
          breadcrumb={['Money In', 'Receivables', 'Payment History']}
          action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/receivables')}>Back</Button>}
        />
        <EmptyState
          icon={FileText}
          title="Invoice not found"
          description="Return to receivables and select an invoice from the current list."
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={invoice ? `${invoice.ref} Payment History` : 'Invoice Payment History'}
        subtitle={invoice ? `${invoice.customer} - read-only receipt trail for this invoice` : 'Loading invoice history'}
        breadcrumb={['Money In', 'Receivables', 'Payment History']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/receivables')}>Back</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Invoice Amount" value={invoice ? formatCompact(invoice.total) : '-'} icon={FileText} color="var(--text)" />
        <StatTile label="Paid" value={invoice ? formatCompact(invoice.paid) : '-'} icon={Banknote} color="var(--pos)" />
        <StatTile label="Balance" value={invoice ? formatCompact(invoice.balance) : '-'} icon={WalletCards} color="var(--neg)" />
        <StatTile label="Due Date" value={invoice?.dueDate ?? '-'} icon={CalendarClock} color="var(--warn)" />
      </div>

      {invoice && (
        <section className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Customer</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{invoice.customer}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Invoice Date</p>
              <p className="mt-1 text-sm text-[var(--text)]">{invoice.date}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Status</p>
              <div className="mt-1"><StatusBadge status={invoice.status} /></div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Cleared Receipts</p>
              <p className="mt-1 tabular text-sm font-semibold text-[var(--pos)]">{formatCurrency(clearedTotal)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Pending Receipts</p>
              <p className="mt-1 tabular text-sm font-semibold text-[var(--warn)]">{formatCurrency(pendingTotal)}</p>
            </div>
          </div>
        </section>
      )}

      <DataTable
        columns={columns}
        data={receipts}
        loading={loading}
        rowKey="id"
        emptyState={
          <EmptyState
            icon={ReceiptText}
            title="No payment history for this invoice"
            description="This invoice has no recorded receipts in the current receivables data."
          />
        }
      />
    </div>
  )
}
