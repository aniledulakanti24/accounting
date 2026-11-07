import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, CheckCircle2, FileText, Save, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import {
  getARInvoices,
  getReceiptById,
  saveReceipt,
  updateReceipt,
} from '../../data/services/receivablesService'

const PAYMENT_MODES = ['NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash']
const PAYMENT_STATUSES = ['cleared', 'pending', 'bounced']
const ALLOCATION_STATUSES = ['Matched', 'Pending Match', 'Unmatched', 'Advance', 'Excess']
const BANK_MATCH_STATUSES = ['Bank matched', 'Pending bank', 'Manual entry', 'Failed']

const blankForm = {
  customer: '',
  invoice: '',
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  mode: 'NEFT',
  status: 'cleared',
  bankRef: '',
  allocationStatus: 'Matched',
  bankMatch: 'Bank matched',
  notes: '',
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}{required && <span className="text-[var(--neg)]"> *</span>}
      </span>
      {children}
    </label>
  )
}

function inputClass(extra = '') {
  return `h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] ${extra}`
}

function SummaryLine({ label, value, strong, tone }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={`tabular text-sm ${strong ? 'font-black' : 'font-semibold'}`} style={tone ? { color: tone } : undefined}>{value}</span>
    </div>
  )
}

export default function RecordPayment() {
  const navigate = useNavigate()
  const { receiptId } = useParams()
  const editing = Boolean(receiptId)
  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState(blankForm)
  const [loading, setLoading] = useState(Boolean(receiptId))

  useEffect(() => {
    getARInvoices().then(rows => setInvoices(rows))
  }, [])

  useEffect(() => {
    if (!receiptId) return
    getReceiptById(receiptId).then(receipt => {
      if (receipt) {
        setForm({
          customer: receipt.customer,
          invoice: receipt.invoice,
          date: receipt.date,
          amount: String(receipt.amount),
          mode: receipt.mode,
          status: receipt.status,
          bankRef: receipt.bankRef ?? '',
          allocationStatus: receipt.allocationStatus ?? 'Matched',
          bankMatch: receipt.bankMatch ?? 'Bank matched',
          notes: receipt.notes ?? '',
        })
      }
      setLoading(false)
    })
  }, [receiptId])

  const customers = useMemo(() => Array.from(new Set(invoices.map(invoice => invoice.customer))), [invoices])
  const customerInvoices = useMemo(
    () => invoices.filter(invoice => !form.customer || invoice.customer === form.customer),
    [form.customer, invoices]
  )
  const selectedInvoice = useMemo(
    () => invoices.find(invoice => invoice.ref === form.invoice),
    [form.invoice, invoices]
  )
  const paymentAmount = Number(form.amount || 0)
  const projectedBalance = selectedInvoice
    ? Math.max(0, selectedInvoice.balance - (form.status === 'cleared' ? paymentAmount : 0))
    : 0

  function setValue(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleCustomerChange(customer) {
    setForm(prev => ({ ...prev, customer, invoice: '' }))
  }

  function handleInvoiceChange(ref) {
    const invoice = invoices.find(row => row.ref === ref)
    setForm(prev => ({
      ...prev,
      invoice: ref,
      customer: invoice?.customer ?? prev.customer,
      amount: invoice ? String(invoice.balance) : prev.amount,
    }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.customer) {
      toast.error('Select a customer')
      return
    }
    if (!form.invoice) {
      toast.error('Select an invoice')
      return
    }
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Enter a valid payment amount')
      return
    }

    const payload = { ...form, amount: paymentAmount }
    const saved = editing
      ? await updateReceipt(receiptId, payload)
      : await saveReceipt(payload)

    if (!saved) {
      toast.error('Payment record was not found')
      return
    }
    toast.success(editing ? `Updated ${saved.ref}` : `Recorded ${saved.ref}`)
    navigate('/receivables/payments-received')
  }

  if (!loading && editing && !form.invoice) {
    return (
      <div>
        <PageHeader
          title="Edit Payment"
          subtitle="No payment receipt was found for this link"
          breadcrumb={['Money In', 'Payments Received', 'Edit']}
          action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/payments-received')}>Back</Button>}
        />
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[var(--text)]">Payment record not found</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Return to payments received and choose an existing receipt.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={editing ? 'Edit Payment' : 'Record Payment'}
        subtitle={editing ? 'Update customer receipt details and bank reference' : 'Capture a customer receipt against an invoice'}
        breadcrumb={['Money In', 'Payments Received', editing ? 'Edit Payment' : 'Record Payment']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/payments-received')}>Back</Button>}
      />

      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <WalletCards size={18} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Payment Details</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Customer" required>
                <select value={form.customer} onChange={event => handleCustomerChange(event.target.value)} className={inputClass()}>
                  <option value="">Select customer</option>
                  {customers.map(customer => <option key={customer}>{customer}</option>)}
                </select>
              </Field>
              <Field label="Invoice" required>
                <select value={form.invoice} onChange={event => handleInvoiceChange(event.target.value)} className={inputClass()}>
                  <option value="">Select invoice</option>
                  {customerInvoices.map(invoice => (
                    <option key={invoice.id} value={invoice.ref}>{invoice.ref} - {formatCurrency(invoice.balance)} due</option>
                  ))}
                </select>
              </Field>
              <Field label="Payment Date" required>
                <input type="date" value={form.date} onChange={event => setValue('date', event.target.value)} className={inputClass()} />
              </Field>
              <Field label="Amount Received" required>
                <input type="number" min="0" step="1" value={form.amount} onChange={event => setValue('amount', event.target.value)} className={inputClass()} placeholder="0" />
              </Field>
              <Field label="Mode">
                <select value={form.mode} onChange={event => setValue('mode', event.target.value)} className={inputClass()}>
                  {PAYMENT_MODES.map(mode => <option key={mode}>{mode}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={event => setValue('status', event.target.value)} className={inputClass()}>
                  {PAYMENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </Field>
              <Field label="Bank / UTR / Cheque Ref">
                <input value={form.bankRef} onChange={event => setValue('bankRef', event.target.value)} className={inputClass()} placeholder="Reference number" />
              </Field>
              <Field label="Allocation">
                <select value={form.allocationStatus} onChange={event => setValue('allocationStatus', event.target.value)} className={inputClass()}>
                  {ALLOCATION_STATUSES.map(status => <option key={status}>{status}</option>)}
                </select>
              </Field>
              <Field label="Bank Match">
                <select value={form.bankMatch} onChange={event => setValue('bankMatch', event.target.value)} className={inputClass()}>
                  {BANK_MATCH_STATUSES.map(status => <option key={status}>{status}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <Field label="Notes">
              <textarea value={form.notes} onChange={event => setValue('notes', event.target.value)} className={inputClass('h-28 resize-none py-2')} placeholder="Bank remarks, cheque notes, or collection context" />
            </Field>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Invoice Summary</h2>
            </div>
            {selectedInvoice ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="font-mono text-sm font-bold text-[var(--primary)]">{selectedInvoice.ref}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{selectedInvoice.customer}</p>
                </div>
                <div className="space-y-3">
                  <SummaryLine label="Invoice amount" value={formatCurrency(selectedInvoice.total)} />
                  <SummaryLine label="Already paid" value={formatCurrency(selectedInvoice.paid)} tone="var(--pos)" />
                  <SummaryLine label="Current balance" value={formatCurrency(selectedInvoice.balance)} tone="var(--neg)" />
                  <SummaryLine label="New balance" value={formatCurrency(projectedBalance)} strong tone={projectedBalance > 0 ? 'var(--warn)' : 'var(--pos)'} />
                  <SummaryLine label="Allocation" value={form.allocationStatus} />
                  <SummaryLine label="Bank match" value={form.bankMatch} />
                </div>
                <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Invoice Status</span>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">
                Select an invoice to see balance and payment impact.
              </div>
            )}
          </section>

          <section className="rounded-[var(--primary-tint)] border border-[var(--primary)]/20 p-5">
            <div className="flex items-center gap-2">
              <Banknote size={18} className="text-[var(--primary)]" />
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Receipt Amount</p>
            </div>
            <p className="mt-2 tabular text-3xl font-black text-[var(--primary)]">{formatCurrency(paymentAmount)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Cleared payments reduce receivable balance. Pending or bounced receipts stay visible for review.</p>
          </section>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1 justify-center" icon={Save} onClick={() => toast.info('Draft saved in this workspace')}>Draft</Button>
            <Button type="submit" variant="primary" className="flex-1 justify-center" icon={CheckCircle2}>{editing ? 'Update' : 'Save'}</Button>
          </div>
        </aside>
      </form>
    </div>
  )
}
