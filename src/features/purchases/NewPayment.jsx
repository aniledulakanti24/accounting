import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Banknote, CheckCircle2, Save, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getPurchaseInvoices } from '../../data/services/purchaseService'

const PAYMENT_MODES = ['NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash']

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}{required && <span className="text-[var(--neg)]"> *</span>}</span>
      {children}
    </label>
  )
}

function inputClass(extra = '') {
  return `h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] ${extra}`
}

export default function NewPayment() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState({
    supplier: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    account: 'HDFC Current',
    mode: 'NEFT',
    reference: '',
    tds: '',
    notes: '',
  })
  const [selected, setSelected] = useState({})

  useEffect(() => {
    getPurchaseInvoices().then(data => setInvoices(data.filter(row => row.total - row.paid > 0)))
  }, [])

  const suppliers = useMemo(() => Array.from(new Set(invoices.map(row => row.supplier))), [invoices])
  const supplierInvoices = useMemo(() => invoices.filter(row => !form.supplier || row.supplier === form.supplier), [form.supplier, invoices])
  const allocation = useMemo(() => supplierInvoices.reduce((sum, invoice) => selected[invoice.id] ? sum + (invoice.total - invoice.paid) : sum, 0), [supplierInvoices, selected])
  const tds = Number(form.tds || 0)
  const netPayment = Math.max(0, allocation - tds)

  function setValue(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleInvoice(id) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function submit() {
    if (!form.supplier) {
      toast.error('Select a supplier')
      return
    }
    if (!allocation) {
      toast.error('Select at least one invoice to allocate')
      return
    }
    toast.success(`Payment of ${formatCurrency(netPayment)} queued for ${form.supplier}`)
    navigate('/payables/payments')
  }

  return (
    <div>
      <PageHeader
        title="New Payment"
        subtitle="Pay supplier, allocate purchase invoices, record TDS, and bank reference"
        breadcrumb={['Purchase Operations', 'Payments Made', 'New Payment']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/payables/payments')}>Back</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><WalletCards size={18} className="text-[var(--primary)]" /><h2 className="text-sm font-bold text-[var(--text)]">Payment Details</h2></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Supplier" required>
                <select value={form.supplier} onChange={e => { setValue('supplier', e.target.value); setSelected({}) }} className={inputClass()}>
                  <option value="">Select supplier</option>
                  {suppliers.map(supplier => <option key={supplier}>{supplier}</option>)}
                </select>
              </Field>
              <Field label="Payment Date">
                <input type="date" value={form.paymentDate} onChange={e => setValue('paymentDate', e.target.value)} className={inputClass()} />
              </Field>
              <Field label="Bank / Cash Account">
                <select value={form.account} onChange={e => setValue('account', e.target.value)} className={inputClass()}>
                  <option>HDFC Current</option>
                  <option>ICICI Current</option>
                  <option>Axis Collection</option>
                  <option>Cash</option>
                </select>
              </Field>
              <Field label="Mode">
                <select value={form.mode} onChange={e => setValue('mode', e.target.value)} className={inputClass()}>
                  {PAYMENT_MODES.map(mode => <option key={mode}>{mode}</option>)}
                </select>
              </Field>
              <Field label="Reference No">
                <input value={form.reference} onChange={e => setValue('reference', e.target.value)} className={inputClass()} placeholder="UTR / cheque / UPI ref" />
              </Field>
              <Field label="TDS Deduction">
                <input value={form.tds} onChange={e => setValue('tds', e.target.value)} type="number" className={inputClass()} />
              </Field>
            </div>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-[var(--text)]">Open Bills Allocation</h2>
            <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)]">
                  <tr>
                    {['', 'Invoice', 'Due Date', 'Outstanding', 'ITC', 'Approval'].map(label => <th key={label} className="border-b border-[var(--border)] px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {supplierInvoices.map(invoice => {
                    const outstanding = invoice.total - invoice.paid
                    return (
                      <tr key={invoice.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-4 py-3"><input type="checkbox" checked={Boolean(selected[invoice.id])} onChange={() => toggleInvoice(invoice.id)} className="accent-[var(--primary)]" /></td>
                        <td className="px-4 py-3"><p className="font-mono text-xs text-[var(--primary)]">{invoice.ref}</p><p className="text-xs text-[var(--faint)]">{invoice.supplier}</p></td>
                        <td className="px-4 py-3 text-[var(--muted)]">{invoice.dueDate}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-[var(--text)]">{formatCurrency(outstanding)}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{invoice.itc}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{invoice.approval}</td>
                      </tr>
                    )
                  })}
                  {!supplierInvoices.length && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">Select a supplier to view open bills.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <Field label="Payment Notes">
              <textarea value={form.notes} onChange={e => setValue('notes', e.target.value)} className={inputClass('h-24 resize-none py-2')} placeholder="Add maker-checker comments, bank remarks, or settlement context" />
            </Field>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center gap-2"><Banknote size={18} className="text-[var(--primary)]" /><h2 className="text-sm font-bold text-[var(--text)]">Payment Summary</h2></div>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-[var(--muted)]">Allocated</span><strong>{formatCurrency(allocation)}</strong></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">TDS</span><strong>{tds ? formatCurrency(tds) : '-'}</strong></div>
              <div className="rounded-[var(--primary-tint)] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Net Payment</p>
                <p className="mt-1 font-mono text-2xl font-black text-[var(--primary)]">{formatCurrency(netPayment)}</p>
              </div>
              <div className="rounded-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
                Payment will create a bank entry and reduce selected supplier bill balances.
              </div>
            </div>
          </section>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 justify-center" icon={Save} onClick={() => toast.info('Payment saved as draft')}>Draft</Button>
            <Button variant="primary" className="flex-1 justify-center" icon={CheckCircle2} onClick={submit}>Queue Payment</Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
