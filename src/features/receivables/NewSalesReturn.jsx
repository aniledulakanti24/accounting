import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, PackageCheck, Undo2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getARInvoices } from '../../data/services/receivablesService'

const REASONS = ['Defective Goods', 'Wrong Spec Delivered', 'Surplus - Client Change', 'Quality Mismatch', 'Billing Error']
const CONDITIONS = ['Awaiting receipt', 'Inspection', 'Restocked', 'Damaged', 'Rejected']
const OUTCOMES = ['Credit Note', 'Refund', 'Replacement', 'Reject']

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
      {children}
    </label>
  )
}

function inputClass(extra = '') {
  return `h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] ${extra}`
}

function StepCard({ number, title, children }) {
  return (
    <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary-tint)] text-sm font-black text-[var(--primary)]">{number}</span>
        <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function NewSalesReturn() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState({
    customer: '',
    invoice: '',
    reason: 'Defective Goods',
    items: '1',
    amount: '',
    condition: 'Awaiting receipt',
    outcome: 'Credit Note',
  })

  useEffect(() => {
    getARInvoices().then(setInvoices)
  }, [])

  const customers = useMemo(() => Array.from(new Set(invoices.map(invoice => invoice.customer))), [invoices])
  const customerInvoices = useMemo(() => invoices.filter(invoice => !form.customer || invoice.customer === form.customer), [form.customer, invoices])
  const selectedInvoice = invoices.find(invoice => invoice.ref === form.invoice)
  const amount = Number(form.amount || 0)

  function setValue(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function selectInvoice(ref) {
    const invoice = invoices.find(row => row.ref === ref)
    setForm(prev => ({
      ...prev,
      invoice: ref,
      customer: invoice?.customer ?? prev.customer,
      amount: invoice ? String(Math.min(invoice.total, invoice.balance || invoice.total)) : prev.amount,
    }))
  }

  function save() {
    if (!form.customer || !form.invoice || !amount) {
      toast.error('Select customer, invoice, and return amount')
      return
    }
    toast.success(`Sales return draft created for ${form.customer}`)
    navigate('/receivables/sales-returns')
  }

  return (
    <div>
      <PageHeader
        title="New Sales Return"
        subtitle="Select invoice, capture returned goods, and choose the settlement outcome"
        breadcrumb={['Money In', 'Sales Returns', 'New']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/sales-returns')}>Back</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <StepCard number="1" title="Select Customer and Invoice">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Customer">
                <select value={form.customer} onChange={event => setValue('customer', event.target.value)} className={inputClass()}>
                  <option value="">Select customer</option>
                  {customers.map(customer => <option key={customer}>{customer}</option>)}
                </select>
              </Field>
              <Field label="Original Invoice">
                <select value={form.invoice} onChange={event => selectInvoice(event.target.value)} className={inputClass()}>
                  <option value="">Select invoice</option>
                  {customerInvoices.map(invoice => <option key={invoice.id} value={invoice.ref}>{invoice.ref}</option>)}
                </select>
              </Field>
            </div>
          </StepCard>

          <StepCard number="2" title="Return Details">
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Reason">
                <select value={form.reason} onChange={event => setValue('reason', event.target.value)} className={inputClass()}>
                  {REASONS.map(reason => <option key={reason}>{reason}</option>)}
                </select>
              </Field>
              <Field label="Items">
                <input type="number" min="1" value={form.items} onChange={event => setValue('items', event.target.value)} className={inputClass()} />
              </Field>
              <Field label="Return Amount">
                <input type="number" min="0" value={form.amount} onChange={event => setValue('amount', event.target.value)} className={inputClass()} />
              </Field>
              <Field label="Goods Condition">
                <select value={form.condition} onChange={event => setValue('condition', event.target.value)} className={inputClass()}>
                  {CONDITIONS.map(condition => <option key={condition}>{condition}</option>)}
                </select>
              </Field>
            </div>
          </StepCard>

          <StepCard number="3" title="Choose Outcome">
            <div className="grid gap-3 md:grid-cols-4">
              {OUTCOMES.map(outcome => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setValue('outcome', outcome)}
                  className={`rounded-[var(--radius-sm)] border p-4 text-left transition-colors ${form.outcome === outcome ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]'}`}
                >
                  <p className="text-sm font-black">{outcome}</p>
                </button>
              ))}
            </div>
          </StepCard>
        </main>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Undo2 size={17} className="text-[var(--primary)]" />
              <p className="text-sm font-bold text-[var(--text)]">Review Impact</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Return Amount</p>
                <p className="mt-1 tabular text-2xl font-black text-[var(--neg)]">{formatCurrency(amount)}</p>
              </div>
              <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Invoice</span><strong>{selectedInvoice?.ref ?? '-'}</strong></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Goods</span><strong>{form.condition}</strong></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Outcome</span><strong>{form.outcome}</strong></div>
            </div>
          </section>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 justify-center" icon={PackageCheck} onClick={() => toast.info('Return draft saved')}>Draft</Button>
            <Button variant="primary" className="flex-1 justify-center" icon={CheckCircle2} onClick={save}>Save</Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
