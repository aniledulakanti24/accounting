import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileMinus, ReceiptText, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getARInvoices } from '../../data/services/receivablesService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const REASONS = ['Sales Return', 'Price Correction', 'Short Delivery', 'Billing Error', 'Excess Payment']
const SETTLEMENTS = ['Apply to invoice', 'Refund customer', 'Keep as open credit']

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

export default function NewCreditNote() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState({
    customer: '',
    invoice: '',
    reason: 'Sales Return',
    amount: '',
    settlement: 'Apply to invoice',
    notes: '',
  })

  useEffect(() => {
    getARInvoices().then(setInvoices)
  }, [])

  const customers = useMemo(() => Array.from(new Set(invoices.map(invoice => invoice.customer))), [invoices])
  const customerInvoices = useMemo(() => invoices.filter(invoice => !form.customer || invoice.customer === form.customer), [form.customer, invoices])
  const selectedInvoice = invoices.find(invoice => invoice.ref === form.invoice)
  const amount = Number(form.amount || 0)
  const taxReversal = Math.round(amount * 18 / 118)

  function setValue(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function selectInvoice(ref) {
    const invoice = invoices.find(row => row.ref === ref)
    setForm(prev => ({
      ...prev,
      invoice: ref,
      customer: invoice?.customer ?? prev.customer,
      amount: invoice ? String(Math.min(invoice.balance || invoice.total, invoice.total)) : prev.amount,
    }))
  }

  function save() {
    if (!form.customer || !form.invoice || !amount) {
      toast.error('Select customer, invoice, and amount')
      return
    }
    toast.success(`Credit note draft created for ${form.customer}`)
    navigate('/receivables/credit-notes')
  }

  return (
    <div>
      <PageHeader
        title="New Credit Note"
        subtitle={`Create credit, decide settlement, and review customer & ${countryConfig.taxSystem} statutory impact`}
        breadcrumb={['Money In', 'Credit Notes & Refunds', 'New']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/credit-notes')}>Back</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <StepCard number="1" title="Select Source">
            <div className="grid gap-4 md:grid-cols-3">
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
              <Field label="Reason">
                <select value={form.reason} onChange={event => setValue('reason', event.target.value)} className={inputClass()}>
                  {REASONS.map(reason => <option key={reason}>{reason}</option>)}
                </select>
              </Field>
            </div>
          </StepCard>

          <StepCard number="2" title="Enter Credit">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Credit Amount">
                <input type="number" min="0" value={form.amount} onChange={event => setValue('amount', event.target.value)} className={inputClass()} />
              </Field>
              <Field label="Notes">
                <input value={form.notes} onChange={event => setValue('notes', event.target.value)} className={inputClass()} placeholder="Short explanation for approval" />
              </Field>
            </div>
          </StepCard>

          <StepCard number="3" title="Decide Settlement">
            <div className="grid gap-3 md:grid-cols-3">
              {SETTLEMENTS.map(settlement => (
                <button
                  key={settlement}
                  type="button"
                  onClick={() => setValue('settlement', settlement)}
                  className={`rounded-[var(--radius-sm)] border p-4 text-left transition-colors ${form.settlement === settlement ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]'}`}
                >
                  <p className="text-sm font-black">{settlement}</p>
                </button>
              ))}
            </div>
          </StepCard>
        </main>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText size={17} className="text-[var(--primary)]" />
              <p className="text-sm font-bold text-[var(--text)]">Review</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Credit Amount</p>
                <p className="mt-1 tabular text-2xl font-black text-[var(--primary)]">{formatCurrency(amount)}</p>
              </div>
              <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Tax reversal</span><strong>{formatCurrency(taxReversal)}</strong></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Settlement</span><strong>{form.settlement}</strong></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Original invoice</span><strong>{selectedInvoice?.ref ?? '-'}</strong></div>
            </div>
          </section>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 justify-center" icon={FileMinus} onClick={() => toast.info('Draft saved')}>Draft</Button>
            <Button variant="primary" className="flex-1 justify-center" icon={CheckCircle2} onClick={save}>Save</Button>
          </div>

          <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="flex gap-2">
              <WalletCards size={16} className="mt-0.5 text-[var(--warn)]" />
              <p className="text-sm text-[var(--muted)]">Saving creates an open credit first. Apply/refund decisions remain editable from the detail page.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
