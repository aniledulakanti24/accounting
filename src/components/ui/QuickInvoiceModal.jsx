import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays, FilePlus, Plus, QrCode, Save, ScanBarcode,
  Send, Settings, Trash2, X,
} from 'lucide-react'
import { getCountryTaxConfig, invoiceRatesFor, standardRateFor } from '../../lib/countryTax'
import { CURRENCY_META, currencySymbol, formatCurrency } from '../../lib/currency'
import { toBase } from '../../lib/fx'
import { api } from '../../data/api/client'
import { useMarketRate } from '../../features/cashbank/fx/fxHooks'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'

const DEFAULT_ITEM = {
  id: 1,
  name: '',
  code: '',
  qty: 1,
  price: 0,
  discount: 0,
  taxRate: 18,
}

const TERMS = [
  'Goods once sold will not be taken back or exchanged.',
  'All disputes are subject to local jurisdiction only.',
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fieldClass(extra = '') {
  return `h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)] ${extra}`
}

export default function QuickInvoiceModal({ open, onClose }) {
  const { activeCompany, recordAudit, markSetupAction } = useAppStore()
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  // Invoice tax rates come from the country's rate table (every country supported)
  const defaultRates = useMemo(() => invoiceRatesFor(countryCode), [countryCode])
  const defaultTaxRate = standardRateFor(countryCode)

  const [party, setParty] = useState({
    name: '',
    phone: '',
    taxId: '',
    gstin: '',
    address: '',
  })
  const [invoice, setInvoice] = useState({
    prefix: `${countryCode}/INV/26-27`,
    number: '101',
    date: today(),
    terms: 30,
    dueDate: today(),
    taxDocRef: '',
  })
  const [items, setItems] = useState([{ ...DEFAULT_ITEM, taxRate: defaultTaxRate }])
  const [notes, setNotes] = useState('')
  const [additionalCharges, setAdditionalCharges] = useState(0)
  const [invoiceDiscount, setInvoiceDiscount] = useState(0)
  const [applyWithholding, setApplyWithholding] = useState(false)
  const [roundOff, setRoundOff] = useState(false)
  const [amountReceived, setAmountReceived] = useState(0)
  const [paymentMode, setPaymentMode] = useState('Bank Transfer')
  const [saving, setSaving] = useState(false)

  /* Invoice currency — base currency by default, or any supported foreign currency */
  const baseCurrency = activeCompany?.currency || countryConfig.currency
  const [currency, setCurrency] = useState(baseCurrency)
  const [rateOverride, setRateOverride] = useState('')
  const isForeign = currency !== baseCurrency
  const [marketRate, loadingRate] = useMarketRate(open && isForeign ? currency : null, invoice.date)
  const exchangeRate = isForeign ? (rateOverride !== '' ? Number(rateOverride) : marketRate) : 1
  const money = (value) => formatCurrency(value, currency)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) return
    setParty({ name: '', phone: '', taxId: '', gstin: '', address: '' })
    setInvoice({ prefix: `${countryCode}/INV/26-27`, number: '101', date: today(), terms: 30, dueDate: today(), taxDocRef: '' })
    setItems([{ ...DEFAULT_ITEM, taxRate: defaultTaxRate }])
    setNotes('')
    setAdditionalCharges(0)
    setInvoiceDiscount(0)
    setApplyWithholding(false)
    setRoundOff(false)
    setAmountReceived(0)
    setPaymentMode('Bank Transfer')
    setSaving(false)
    setCurrency(baseCurrency)
    setRateOverride('')
  }, [open, countryCode, defaultTaxRate, baseCurrency])

  const totals = useMemo(() => {
    const itemRows = items.map(item => {
      const taxable = Number(item.qty || 0) * Number(item.price || 0)
      const discount = Number(item.discount || 0)
      const taxableAfterDiscount = Math.max(taxable - discount, 0)
      const tax = taxableAfterDiscount * (Number(item.taxRate || 0) / 100)
      return { taxable, discount, taxableAfterDiscount, tax, total: taxableAfterDiscount + tax }
    })
    const subtotal = itemRows.reduce((sum, row) => sum + row.taxableAfterDiscount, 0)
    const tax = itemRows.reduce((sum, row) => sum + row.tax, 0)
    const withholding = applyWithholding ? (subtotal + tax) * 0.01 : 0
    const beforeRound = subtotal + tax + Number(additionalCharges || 0) + withholding - Number(invoiceDiscount || 0)
    const rounded = roundOff ? Math.round(beforeRound) : beforeRound
    return {
      subtotal,
      tax,
      withholding,
      total: rounded,
      balance: Math.max(rounded - Number(amountReceived || 0), 0),
    }
  }, [items, additionalCharges, invoiceDiscount, applyWithholding, roundOff, amountReceived])

  if (!open) return null

  function updateItem(id, field, value) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { ...DEFAULT_ITEM, id: Date.now(), taxRate: defaultTaxRate }])
  }

  function removeItem(id) {
    setItems(prev => prev.length === 1 ? prev : prev.filter(item => item.id !== id))
  }

  function saveInvoice(sendAfterSave = false) {
    if (!party.name.trim()) {
      toast.error('Add a customer before saving the invoice')
      return
    }
    const hasItem = items.some(item => item.name.trim() && Number(item.price) > 0)
    if (!hasItem) {
      toast.error('Add at least one item with a price')
      return
    }
    if (isForeign && !(exchangeRate > 0)) {
      toast.error(`Enter an exchange rate for ${currency}`)
      return
    }
    setSaving(true)
    const finish = (extra = '') => {
      recordAudit(
        'sales',
        sendAfterSave ? `${countryConfig.invoiceTitle} saved and sent` : `${countryConfig.invoiceTitle} saved`,
        `Invoice ${invoice.prefix}-${invoice.number} for ${party.name} totals ${money(totals.total)}${extra}.`,
        { module: 'Sales' }
      )
      markSetupAction('first-invoice')
      toast.success(`${countryConfig.invoiceTitle} saved${sendAfterSave ? ' and ready to send' : ''}${extra}`)
      setSaving(false)
      onClose?.()
    }

    if (!isForeign) {
      window.setTimeout(() => finish(), 450)
      return
    }
    // Foreign-currency invoice → recorded as an FX receivable at the booked rate
    api.post('/fx/documents', {
      kind: 'receivable',
      party: party.name,
      currency,
      amount: Math.round(totals.total * 100) / 100,
      date: invoice.date,
      rate: exchangeRate,
      reference: `${invoice.prefix}-${invoice.number}`,
    }).then(
      doc => finish(` · booked at ${exchangeRate} = ${formatCurrency(doc.baseAtBooked, baseCurrency)}`),
      err => { toast.error(err.message); setSaving(false) },
    )
  }

  return (
    <div className="fixed inset-0 z-[920] bg-black/45">
      <div className="flex h-full flex-col bg-[var(--bg)]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-2)]">
              <X size={17} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{countryConfig.flag}</span>
                <FilePlus size={16} className="text-[var(--primary)]" />
                <h2 className="text-sm font-bold text-[var(--text)]">Create {countryConfig.invoiceTitle}</h2>
                <span className="rounded bg-[var(--primary-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                  {countryConfig.name} ({countryConfig.taxSystem})
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                {countryConfig.taxSystemName} compliant document billed in {currency}{isForeign ? ` · books in ${baseCurrency}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveInvoice(true)}
              disabled={saving}
              className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--primary-tint)] px-3 text-xs font-semibold text-[var(--primary)] disabled:opacity-50"
            >
              <Send size={13} /> Save & Send
            </button>
            <button
              onClick={() => saveInvoice(false)}
              disabled={saving}
              className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Save size={13} /> Save
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid min-h-full grid-cols-1 xl:grid-cols-[1fr_380px]">
            <section className="border-r border-[var(--border)] bg-[var(--surface)]">
              <div className="grid gap-4 border-b border-[var(--border)] p-4 lg:grid-cols-[minmax(320px,1fr)_minmax(360px,430px)]">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Bill To</p>
                  <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--primary)] bg-[var(--primary-tint)]/35 p-4">
                    <input
                      value={party.name}
                      onChange={e => setParty(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="+ Add Customer / Party Name"
                      className="mb-3 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={party.phone}
                        onChange={e => setParty(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone Number"
                        className={fieldClass()}
                      />
                      <input
                        value={party.taxId || party.gstin}
                        onChange={e => setParty(prev => ({ ...prev, taxId: e.target.value, gstin: e.target.value }))}
                        placeholder={countryConfig.taxIdLabel}
                        className={fieldClass('font-mono')}
                      />
                    </div>
                    <textarea
                      value={party.address}
                      onChange={e => setParty(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={`Billing address (${countryConfig.regions[0] || 'State/Region'})`}
                      rows={2}
                      className="mt-3 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">Prefix</span>
                    <input value={invoice.prefix} onChange={e => setInvoice(prev => ({ ...prev, prefix: e.target.value }))} className={fieldClass('font-mono')} />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">Invoice No.</span>
                    <input value={invoice.number} onChange={e => setInvoice(prev => ({ ...prev, number: e.target.value }))} className={fieldClass('font-mono')} />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">Invoice Date</span>
                    <div className="relative">
                      <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
                      <input type="date" value={invoice.date} onChange={e => setInvoice(prev => ({ ...prev, date: e.target.value }))} className={fieldClass('pl-8')} />
                    </div>
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">Due Date</span>
                    <input type="date" value={invoice.dueDate} onChange={e => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))} className={fieldClass()} />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">Payment Terms</span>
                    <div className="flex items-center gap-2">
                      <input type="number" value={invoice.terms} onChange={e => setInvoice(prev => ({ ...prev, terms: e.target.value }))} className={fieldClass('w-20 tabular')} />
                      <span className="text-xs text-[var(--muted)]">days</span>
                    </div>
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">
                      {countryConfig.hasEWayBill ? 'E-Way Bill No' : 'Tax Reference'}
                    </span>
                    <input
                      value={invoice.taxDocRef}
                      onChange={e => setInvoice(prev => ({ ...prev, taxDocRef: e.target.value }))}
                      placeholder={countryConfig.hasEWayBill ? 'Optional EWB' : 'Exemption / Ref'}
                      className={fieldClass('font-mono')}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">Invoice Currency</span>
                    <select
                      value={currency}
                      onChange={e => { setCurrency(e.target.value); setRateOverride('') }}
                      className={fieldClass()}
                    >
                      {Object.keys(CURRENCY_META).map(code => (
                        <option key={code} value={code}>{code}{code === baseCurrency ? ' (base)' : ''}</option>
                      ))}
                    </select>
                  </label>
                  {isForeign && (
                    <label>
                      <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">
                        Rate · 1 {currency} = ? {baseCurrency}
                      </span>
                      <input
                        type="number"
                        step="0.000001"
                        value={rateOverride}
                        placeholder={loadingRate ? 'Fetching…' : String(marketRate ?? '')}
                        onChange={e => setRateOverride(e.target.value)}
                        className={fieldClass('text-right tabular')}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1120px] text-sm">
                  <thead className="bg-[var(--surface-2)] text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    <tr>
                      <th className="w-12 px-3 py-2 text-left">No</th>
                      <th className="px-3 py-2 text-left">Items / Services</th>
                      <th className="w-32 px-3 py-2 text-left">{countryConfig.codeLabel}</th>
                      <th className="w-24 px-3 py-2 text-right">Qty</th>
                      <th className="w-32 px-3 py-2 text-right">Price ({currencySymbol(currency)})</th>
                      <th className="w-32 px-3 py-2 text-right">Discount</th>
                      <th className="w-28 px-3 py-2 text-right">{countryConfig.taxSystem} %</th>
                      <th className="w-36 px-3 py-2 text-right">Amount ({currencySymbol(currency)})</th>
                      <th className="w-12 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const taxable = Math.max((Number(item.qty || 0) * Number(item.price || 0)) - Number(item.discount || 0), 0)
                      const total = taxable + taxable * (Number(item.taxRate || 0) / 100)
                      return (
                        <tr key={item.id} className="border-b border-[var(--border)]">
                          <td className="px-3 py-2 text-[var(--muted)]">{index + 1}</td>
                          <td className="px-3 py-2">
                            <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="+ Add Item" className={fieldClass()} />
                          </td>
                          <td className="px-3 py-2">
                            <input value={item.code} onChange={e => updateItem(item.id, 'code', e.target.value)} placeholder="Code" className={fieldClass('font-mono')} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} className={fieldClass('text-right tabular')} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className={fieldClass('text-right tabular')} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" value={item.discount} onChange={e => updateItem(item.id, 'discount', e.target.value)} className={fieldClass('text-right tabular')} />
                          </td>
                          <td className="px-3 py-2">
                            <select value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', Number(e.target.value))} className={fieldClass('text-right tabular')}>
                              {defaultRates.map(rate => <option key={rate} value={rate}>{rate}%</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right tabular font-semibold text-[var(--text)]">
                            {money(total)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => removeItem(item.id)} className="rounded-lg p-1.5 text-[var(--faint)] hover:bg-[var(--neg-tint)] hover:text-[var(--neg)]">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 border-b border-[var(--border)] p-3 lg:grid-cols-[1fr_260px]">
                <button
                  onClick={addItem}
                  className="flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--primary)] bg-[var(--primary-tint)] text-sm font-semibold text-[var(--primary)]"
                >
                  <Plus size={14} /> Add Line Item
                </button>
                <button className="flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text)]">
                  <ScanBarcode size={18} /> Scan Barcode
                </button>
              </div>

              <div className="grid gap-5 p-4 lg:grid-cols-2">
                <div>
                  <button className="mb-3 text-xs font-semibold text-[var(--primary)]">+ Add Notes</button>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Customer notes..." className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" />
                  <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
                    <p className="mb-2 text-xs font-semibold text-[var(--muted)]">Terms and Conditions</p>
                    <ol className="list-decimal space-y-1 pl-4 text-xs text-[var(--muted)]">
                      {TERMS.map(term => <li key={term}>{term}</li>)}
                    </ol>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[110px_1fr] lg:grid-cols-[100px_1fr]">
                  <div className="flex h-[100px] w-[100px] items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--primary)] bg-white">
                    <QrCode size={74} className="text-[var(--text)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">Payment QR / Link</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">pay@unifiedtree.com</p>
                    <p className="mt-2 text-xs text-[var(--faint)]">Payer can scan or tap to settle this invoice.</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="mb-2 text-xs font-semibold text-[var(--muted)]">Settlement Account</p>
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
                      <p>Company: {activeCompany?.name}</p>
                      <p>{countryConfig.taxIdLabel}: {activeCompany?.taxId || activeCompany?.gstin || 'Registered'}</p>
                      <p>Region: {activeCompany?.branch || countryConfig.regions[0]}, {countryConfig.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="bg-[var(--surface)] p-4">
              <div className="sticky top-4 space-y-4">
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
                  <h3 className="mb-3 text-sm font-bold text-[var(--text)]">Document Summary</h3>
                  <div className="space-y-3 text-sm">
                    <SummaryRow label="Subtotal" value={totals.subtotal} currency={currency} />
                    <SummaryRow label={`${countryConfig.taxSystem} Total`} value={totals.tax} currency={currency} />
                    <label className="block">
                      <span className="mb-1 block text-xs text-[var(--muted)]">Additional Shipping / Charges</span>
                      <input type="number" value={additionalCharges} onChange={e => setAdditionalCharges(e.target.value)} className={fieldClass('text-right tabular')} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-[var(--muted)]">Discount</span>
                      <input type="number" value={invoiceDiscount} onChange={e => setInvoiceDiscount(e.target.value)} className={fieldClass('text-right tabular')} />
                    </label>
                    {countryConfig.hasWithholding && (
                      <label className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
                        <input type="checkbox" checked={applyWithholding} onChange={e => setApplyWithholding(e.target.checked)} />
                        Apply {countryConfig.withholdingName} (1%)
                      </label>
                    )}
                    <label className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
                      <input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} />
                      Auto round off
                    </label>
                    <div className="border-t border-[var(--border)] pt-3">
                      <SummaryRow label="Total Amount" value={totals.total} currency={currency} strong />
                      {isForeign && (
                        <div className="mt-2">
                          <SummaryRow
                            label={`Booked in ${baseCurrency} @ ${exchangeRate > 0 ? exchangeRate : '…'}`}
                            value={exchangeRate > 0 ? toBase(totals.total, exchangeRate) : null}
                            currency={baseCurrency}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
                  <h3 className="mb-3 text-sm font-bold text-[var(--text)]">Payment</h3>
                  <label className="block">
                    <span className="mb-1 block text-xs text-[var(--muted)]">Amount Received</span>
                    <input type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} className={fieldClass('text-right tabular')} />
                  </label>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs text-[var(--muted)]">Payment Mode</span>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className={fieldClass()}>
                      {['Bank Transfer', 'Credit Card', 'Cash', 'UPI', 'Direct Debit / ACH', 'Cheque'].map(mode => <option key={mode}>{mode}</option>)}
                    </select>
                  </label>
                  <button
                    onClick={() => setAmountReceived(Math.round(totals.total))}
                    className="mt-3 w-full rounded-[var(--radius-sm)] bg-[var(--primary-tint)] px-3 py-2 text-xs font-semibold text-[var(--primary)]"
                  >
                    Mark as fully paid
                  </button>
                  <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
                    <SummaryRow label="Balance Amount" value={totals.balance} currency={currency} strong color={totals.balance > 0 ? 'var(--neg)' : 'var(--pos)'} />
                  </div>
                </div>

                <div className="rounded-[var(--radius-sm)] border border-[var(--primary)]/20 bg-[var(--primary-tint)] p-4">
                  <p className="text-sm font-bold text-[var(--primary)]">{countryConfig.name} Statutory Audit</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--primary)]">
                    <li>• Customer {countryConfig.taxIdLabel} checked</li>
                    <li>• {countryConfig.taxSystemName} applied</li>
                    <li>• Billed in {currency}{isForeign ? `, booked in ${baseCurrency} at ${exchangeRate ?? "…"}` : ""}</li>
                    <li>• Ledger balance updated in real-time</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, currency, strong = false, color }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? 'text-sm font-bold text-[var(--text)]' : 'text-sm text-[var(--muted)]'}>{label}</span>
      <span className={strong ? 'tabular text-sm font-bold' : 'tabular text-sm font-medium text-[var(--text)]'} style={{ color: color ?? undefined }}>
        {formatCurrency(value, currency)}
      </span>
    </div>
  )
}
