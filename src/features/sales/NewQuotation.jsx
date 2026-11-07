import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileSignature, Plus, Printer, Save, Send, Trash2, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getParties } from '../../data/services/partiesService'
import { getItems } from '../../data/services/inventoryService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const INITIAL_LINE = {
  id: 'L1',
  itemId: '',
  description: '',
  qty: 1,
  rate: '',
  discount: 0,
  gstRate: 18,
}

const COMPANY = {
  name: 'NClever India Pvt. Ltd.',
  line1: 'Sweetener & Food Ingredient Division',
  address: 'Hyderabad, Telangana, India',
  gstin: '36ABCDE1234F1Z5',
  phone: '+91 90000 00000',
  email: 'sales@nclever.in',
  bank: 'HDFC Bank Current Account',
  account: '50200012345678',
  ifsc: 'HDFC0001234',
  upi: 'nclever@hdfcbank',
}

function Field({ label, children, required }) {
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
  return `h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)] ${extra}`
}

function Section({ title, children }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-[var(--text)]">{title}</h2>
      {children}
    </section>
  )
}

function lineMath(line) {
  const qty = Number(line.qty || 0)
  const rate = Number(line.rate || 0)
  const discount = Number(line.discount || 0)
  const taxable = Math.max(0, qty * rate - discount)
  const gst = taxable * (Number(line.gstRate || 0) / 100)
  return { taxable, gst, amount: taxable + gst }
}

function QrMark() {
  return (
    <div className="grid h-28 w-28 grid-cols-7 grid-rows-7 gap-1 rounded-[var(--radius-sm)] bg-white p-2 shadow-inner">
      {Array.from({ length: 49 }, (_, index) => {
        const finder = [0, 1, 2, 7, 9, 14, 15, 16, 4, 5, 6, 11, 13, 18, 19, 20, 28, 29, 30, 35, 37, 42, 43, 44].includes(index)
        const fill = finder || [22, 24, 31, 33, 39, 41, 45].includes(index)
        return <span key={index} className={fill ? 'bg-[var(--text)]' : 'bg-transparent'} />
      })}
    </div>
  )
}

function QuotationDocument({ open, onClose, form, lines, totals, customer, items, activeCompany, countryConfig }) {
  if (!open) return null
  const validLines = lines.filter(line => line.description && Number(line.qty) > 0 && Number(line.rate) > 0)
  const taxSystem = countryConfig?.taxSystem || 'Tax'
  const taxIdLabel = countryConfig?.taxIdLabel || 'Tax ID'

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" icon={Printer} size="sm" onClick={() => window.print()}>Print</Button>
          <Button variant="secondary" icon={Download} size="sm" onClick={() => toast.success('Quotation PDF queued')}>Download</Button>
          <Button variant="primary" icon={Send} size="sm" onClick={() => toast.success(`${form.ref} sent to ${customer?.name}`)}>Send</Button>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-white text-[var(--text)] shadow-sm">
            <X size={16} />
          </button>
        </div>

        <section className="overflow-hidden rounded-[var(--radius)] bg-white text-slate-950 shadow-2xl">
          <div className="grid gap-6 border-b border-slate-200 p-8 md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-xl font-black text-white shadow-sm">
                {(activeCompany?.name || 'UT').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Quotation</p>
                <h1 className="mt-1 text-2xl font-black">{activeCompany?.name || COMPANY.name}</h1>
                <p className="mt-1 text-sm text-slate-500">{activeCompany?.branch || COMPANY.line1}</p>
                <p className="text-sm text-slate-500">{activeCompany?.address || COMPANY.address}</p>
                <p className="mt-2 text-xs text-slate-500">{taxIdLabel} {activeCompany?.taxId || activeCompany?.gstin || COMPANY.gstin} / {COMPANY.phone} / {COMPANY.email}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchaser Details</p>
              <h2 className="mt-2 text-lg font-black">{customer?.name || 'Customer'}</h2>
              <p className="mt-1 text-sm text-slate-500">{customer?.city || 'City'} / {customer?.type || 'Customer'}</p>
              <p className="text-sm text-slate-500">{taxIdLabel} {customer?.taxId || customer?.gstin || '-'}</p>
              <p className="text-sm text-slate-500">{customer?.phone || '-'}</p>
            </div>
          </div>

          <div className="grid gap-3 border-b border-slate-200 px-8 py-4 md:grid-cols-4">
            {[
              ['Quotation No', form.ref],
              ['Date', form.date],
              ['Valid Till', form.validTill || '-'],
              ['Price List', form.priceList],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="p-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950 text-white">
                  {['#', 'Items & Description', taxSystem === 'GST' ? 'HSN' : 'SKU/Code', 'Qty', 'Rate', 'Taxable', taxSystem, 'Amount'].map(label => (
                    <th key={label} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validLines.map((line, index) => {
                  const item = items.find(row => row.id === line.itemId)
                  const math = lineMath(line)
                  return (
                    <tr key={line.id} className="border-b border-slate-200">
                      <td className="px-3 py-4 text-slate-500">{index + 1}</td>
                      <td className="px-3 py-4">
                        <p className="font-bold">{line.description}</p>
                        <p className="mt-1 text-xs text-slate-500">{item?.sku || item?.code || 'Custom line'}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-500">{item?.hsn || item?.sku || '-'}</td>
                      <td className="px-3 py-4">{line.qty}</td>
                      <td className="px-3 py-4">{formatCurrency(Number(line.rate || 0))}</td>
                      <td className="px-3 py-4">{formatCurrency(math.taxable)}</td>
                      <td className="px-3 py-4">{formatCurrency(math.gst)}<br /><span className="text-xs text-slate-400">{line.gstRate}%</span></td>
                      <td className="px-3 py-4 font-black">{formatCurrency(math.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{form.notes}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Terms</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{form.terms}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">{taxSystem}</span><strong>{formatCurrency(totals.gst)}</strong></div>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg"><span>Total</span><strong>{formatCurrency(totals.total)}</strong></div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 rounded-2xl border border-slate-200 p-5 md:grid-cols-[minmax(0,1fr)_160px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Details</p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="text-slate-500">Bank:</span> <strong>{COMPANY.bank}</strong></p>
                  <p><span className="text-slate-500">A/C:</span> <strong>{COMPANY.account}</strong></p>
                  <p><span className="text-slate-500">IFSC:</span> <strong>{COMPANY.ifsc}</strong></p>
                  <p><span className="text-slate-500">UPI:</span> <strong>{COMPANY.upi}</strong></p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <QrMark />
                <p className="mt-2 text-xs font-bold text-slate-500">Scan to pay</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function NewQuotation() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [parties, setParties] = useState([])
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    ref: 'QT-2526-0042',
    date: new Date().toISOString().slice(0, 10),
    validTill: '',
    customerId: '',
    salesOwner: 'Current user',
    priceList: 'Standard',
    notes: 'Prices are valid until the quotation expiry date. Taxes extra as applicable.',
    terms: '50% advance, balance before dispatch.',
  })
  const [lines, setLines] = useState([{ ...INITIAL_LINE, gstRate: countryConfig.defaultRate ?? 18 }])
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    Promise.all([getParties(), getItems()]).then(([partyData, itemData]) => {
      setParties(partyData.filter(party => party.type === 'Customer' || party.type === 'Both'))
      setItems(itemData)
    })
  }, [])

  const selectedCustomer = useMemo(() => parties.find(party => party.id === form.customerId), [form.customerId, parties])

  const totals = useMemo(() => {
    return lines.reduce((acc, line) => {
      const qty = Number(line.qty || 0)
      const rate = Number(line.rate || 0)
      const discount = Number(line.discount || 0)
      const taxable = Math.max(0, qty * rate - discount)
      const gst = taxable * (Number(line.gstRate || 0) / 100)
      return {
        subtotal: acc.subtotal + taxable,
        gst: acc.gst + gst,
        total: acc.total + taxable + gst,
      }
    }, { subtotal: 0, gst: 0, total: 0 })
  }, [lines])

  function setValue(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateLine(id, key, value) {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line
      if (key === 'itemId') {
        const item = items.find(row => row.id === value)
        return {
          ...line,
          itemId: value,
          description: item?.name ?? '',
          rate: item?.salePrice ?? '',
          gstRate: item?.gstRate ?? 18,
        }
      }
      return { ...line, [key]: value }
    }))
  }

  function addLine() {
    setLines(prev => [...prev, { ...INITIAL_LINE, id: `L${prev.length + 1}` }])
  }

  function removeLine(id) {
    setLines(prev => prev.length === 1 ? prev : prev.filter(line => line.id !== id))
  }

  function validateQuotation() {
    if (!selectedCustomer) {
      toast.error('Select a customer before saving the quotation')
      return false
    }
    const hasItem = lines.some(line => line.description && Number(line.qty) > 0 && Number(line.rate) > 0)
    if (!hasItem) {
      toast.error('Add at least one priced item')
      return false
    }
    return true
  }

  function submit(action) {
    if (!validateQuotation()) return
    toast.success(action === 'send' ? `${form.ref} opened for review` : `${form.ref} saved as draft`)
    if (action === 'send') {
      setPreviewOpen(true)
      return
    }
    navigate('/sales/quotations')
  }

  return (
    <div>
      <QuotationDocument
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={form}
        lines={lines}
        totals={totals}
        customer={selectedCustomer}
        items={items}
        activeCompany={activeCompany}
        countryConfig={countryConfig}
      />

      <PageHeader
        title="New Quotation"
        subtitle={`Create an estimate, add item lines, pricing, ${countryConfig.taxSystem}, and customer terms`}
        breadcrumb={['Sales', 'Quotations', 'New Quotation']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/sales/quotations')}>Back</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Section title="Quotation Details">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Quotation No" required>
                <input value={form.ref} onChange={e => setValue('ref', e.target.value)} className={inputClass()} />
              </Field>
              <Field label="Quotation Date" required>
                <input value={form.date} onChange={e => setValue('date', e.target.value)} type="date" className={inputClass()} />
              </Field>
              <Field label="Valid Till">
                <input value={form.validTill} onChange={e => setValue('validTill', e.target.value)} type="date" className={inputClass()} />
              </Field>
              <Field label="Customer" required>
                <select value={form.customerId} onChange={e => setValue('customerId', e.target.value)} className={inputClass()}>
                  <option value="">Select customer</option>
                  {parties.map(party => <option key={party.id} value={party.id}>{party.name}</option>)}
                </select>
              </Field>
              <Field label="Sales Owner">
                <input value={form.salesOwner} onChange={e => setValue('salesOwner', e.target.value)} className={inputClass()} />
              </Field>
              <Field label="Price List">
                <select value={form.priceList} onChange={e => setValue('priceList', e.target.value)} className={inputClass()}>
                  <option>Standard</option>
                  <option>Dealer</option>
                  <option>Bulk B2B</option>
                  <option>Introductory</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Item Lines">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)]">
                    {['Item', 'Description', 'Qty', 'Rate', 'Discount', `${countryConfig.taxSystem} %`, 'Amount', ''].map(label => (
                      <th key={label} className="border-b border-[var(--border)] px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map(line => {
                    const taxable = Math.max(0, Number(line.qty || 0) * Number(line.rate || 0) - Number(line.discount || 0))
                    const amount = taxable + taxable * (Number(line.gstRate || 0) / 100)
                    return (
                      <tr key={line.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-3 py-3">
                          <select value={line.itemId} onChange={e => updateLine(line.id, 'itemId', e.target.value)} className={inputClass('min-w-44')}>
                            <option value="">Select item</option>
                            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <input value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} className={inputClass('min-w-56')} />
                        </td>
                        <td className="px-3 py-3"><input value={line.qty} onChange={e => updateLine(line.id, 'qty', e.target.value)} type="number" className={inputClass('w-24')} /></td>
                        <td className="px-3 py-3"><input value={line.rate} onChange={e => updateLine(line.id, 'rate', e.target.value)} type="number" className={inputClass('w-28')} /></td>
                        <td className="px-3 py-3"><input value={line.discount} onChange={e => updateLine(line.id, 'discount', e.target.value)} type="number" className={inputClass('w-28')} /></td>
                        <td className="px-3 py-3"><input value={line.gstRate} onChange={e => updateLine(line.id, 'gstRate', e.target.value)} type="number" className={inputClass('w-20')} /></td>
                        <td className="px-3 py-3 font-mono font-bold text-[var(--text)]">{formatCurrency(amount)}</td>
                        <td className="px-3 py-3 text-right">
                          <button type="button" onClick={() => removeLine(line.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--neg)] hover:bg-[var(--neg-tint)]">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addLine} className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-tint)]">
              <Plus size={15} />
              Add Item Line
            </button>
          </Section>

          <Section title="Terms & Notes">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Customer Notes">
                <textarea value={form.notes} onChange={e => setValue('notes', e.target.value)} className={inputClass('h-24 resize-none py-2')} />
              </Field>
              <Field label="Terms">
                <textarea value={form.terms} onChange={e => setValue('terms', e.target.value)} className={inputClass('h-24 resize-none py-2')} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileSignature size={18} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Quotation Preview</h2>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Customer</p>
                <p className="mt-1 font-semibold text-[var(--text)]">{selectedCustomer?.name || 'Not selected'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Subtotal</p>
                  <p className="mt-1 font-mono font-semibold text-[var(--text)]">{formatCurrency(totals.subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{countryConfig.taxSystem}</p>
                  <p className="mt-1 font-mono font-semibold text-[var(--text)]">{formatCurrency(totals.gst)}</p>
                </div>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-[var(--primary-tint)] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Total</p>
                <p className="mt-1 font-mono text-2xl font-black text-[var(--primary)]">{formatCurrency(totals.total)}</p>
              </div>
            </div>
          </section>

          <div className="flex gap-2">
            <Button variant="secondary" icon={Save} className="flex-1 justify-center" onClick={() => submit('draft')}>Save Draft</Button>
            <Button variant="primary" icon={Send} className="flex-1 justify-center" onClick={() => submit('send')}>Save & Send</Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
