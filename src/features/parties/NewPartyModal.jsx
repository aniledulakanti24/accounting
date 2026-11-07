import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Save } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { getCountryTaxConfig, validateCountryTaxId } from '../../lib/countryTax'
import { useAppStore } from '../../store/useAppStore'

const INITIAL_FORM = {
  name: '',
  type: 'Customer',
  gstin: '',
  taxId: '',
  pan: '',
  secondaryId: '',
  phone: '',
  email: '',
  contactPerson: '',
  owner: 'Finance Team',
  branch: '',
  tags: '',
  city: '',
  state: '',
  billingAddress: '',
  shippingAddress: '',
  creditLimit: '',
  creditPeriod: '30',
  openingBalance: '',
  preferredMode: 'Bank Transfer',
  creditPolicy: 'Standard',
  statementAutoSend: 'Monthly',
  customField: '',
  registrationType: 'Regular',
  status: 'active',
}

const STATE_BY_GST = {
  '07': 'Delhi',
  '09': 'Uttar Pradesh',
  '27': 'Maharashtra',
  '29': 'Karnataka',
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
        {label}{required && <span className="text-[var(--neg)]"> *</span>}
      </span>
      {children}
    </label>
  )
}

function inputClass(extra = '') {
  return `h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)] ${extra}`
}

export default function NewPartyModal({ open, onClose, onCreate, existingParties = [] }) {
  const { activeCompany } = useAppStore()
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [form, setForm] = useState(INITIAL_FORM)

  const rawTaxId = form.taxId || form.gstin
  const taxIdValidation = validateCountryTaxId(rawTaxId, countryCode)
  const isTaxIdValid = !rawTaxId || taxIdValidation.valid

  const gstState = countryCode === 'IN' ? STATE_BY_GST[rawTaxId?.slice(0, 2)] : null
  const stateMismatch = Boolean(countryCode === 'IN' && rawTaxId && form.state && gstState && form.state !== gstState)

  const duplicate = useMemo(() => {
    const nameKey = form.name.trim().toLowerCase()
    const phoneKey = form.phone.trim()
    const taxKey = rawTaxId.trim().toUpperCase()
    if (!nameKey && !phoneKey && !taxKey) return null
    return existingParties.find(p =>
      (taxKey && (p.gstin?.toUpperCase() === taxKey || p.taxId?.toUpperCase() === taxKey))
      || (phoneKey && p.phone === phoneKey)
      || (nameKey && p.name.toLowerCase() === nameKey)
    )
  }, [existingParties, rawTaxId, form.name, form.phone])

  function setValue(key, value) {
    setForm(prev => {
      const updated = { ...prev, [key]: value }
      if (key === 'gstin' || key === 'taxId') {
        const val = value.toUpperCase()
        updated.gstin = val
        updated.taxId = val
      }
      if (key === 'pan' || key === 'secondaryId') {
        const val = value.toUpperCase()
        updated.pan = val
        updated.secondaryId = val
      }
      return updated
    })
  }

  function resetAndClose() {
    setForm(INITIAL_FORM)
    onClose?.()
  }

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.city.trim()) return
    const now = new Date().toISOString().slice(0, 10)
    const partyTaxId = (form.taxId || form.gstin).trim()
    const partySecondaryId = (form.secondaryId || form.pan).trim()

    onCreate?.({
      id: `P${Date.now()}`,
      name: form.name.trim(),
      taxId: partyTaxId,
      gstin: partyTaxId,
      pan: partySecondaryId,
      secondaryId: partySecondaryId,
      country: countryCode,
      currency: countryConfig.currency,
      type: form.type,
      phone: form.phone.trim(),
      city: form.city.trim(),
      creditLimit: Number(form.creditLimit || 0),
      outstanding: Number(form.openingBalance || 0),
      overdue: 0,
      advance: 0,
      lastTxn: now,
      status: form.status,
      email: form.email.trim(),
      contactPerson: form.contactPerson.trim(),
      owner: form.owner.trim(),
      branch: form.branch.trim() || form.city.trim(),
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      state: form.state.trim() || gstState || countryConfig.regions[0] || '',
      billingAddress: form.billingAddress.trim(),
      shippingAddress: form.shippingAddress.trim() || form.billingAddress.trim(),
      creditPeriod: Number(form.creditPeriod || 0),
      creditPolicy: form.creditPolicy,
      statementAutoSend: form.statementAutoSend,
      customField: form.customField.trim(),
      preferredMode: form.preferredMode,
      registrationType: form.registrationType,
    })
    resetAndClose()
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={`New Party (${countryConfig.flag} ${countryConfig.name})`}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={Save}
            disabled={!form.name.trim() || !form.city.trim() || !isTaxIdValid || stateMismatch || !!duplicate}
            onClick={submit}
          >
            Create Party
          </Button>
        </>
      }
    >
      <form id="new-party-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Party Name" required>
            <input value={form.name} onChange={e => setValue('name', e.target.value)} className={inputClass()} placeholder="e.g. Acme Corp" />
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={e => setValue('type', e.target.value)} className={inputClass()}>
              <option>Customer</option>
              <option>Supplier</option>
              <option>Both</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => setValue('status', e.target.value)} className={inputClass()}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>

        {/* Dynamic Country Tax ID Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={countryConfig.taxIdLabel}>
            <input
              value={form.taxId || form.gstin}
              onChange={e => setValue('taxId', e.target.value)}
              className={inputClass('font-mono')}
              placeholder={countryConfig.taxIdPlaceholder}
            />
          </Field>
          <Field label={countryConfig.secondaryIdLabel}>
            <input
              value={form.secondaryId || form.pan}
              onChange={e => setValue('secondaryId', e.target.value)}
              className={inputClass('font-mono')}
              placeholder={countryConfig.secondaryIdPlaceholder}
            />
          </Field>
          <Field label="Tax Registration">
            <select value={form.registrationType} onChange={e => setValue('registrationType', e.target.value)} className={inputClass()}>
              <option>Registered / Regular</option>
              <option>Exempt / Zero-Rated</option>
              <option>Unregistered / Consumer</option>
              <option>Overseas / Export</option>
            </select>
          </Field>
        </div>

        {(rawTaxId || duplicate) && (
          <div className={`flex items-start gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-xs ${
            duplicate || !isTaxIdValid || stateMismatch
              ? 'border-[var(--warn)]/25 bg-[var(--warn-tint)] text-[var(--warn)]'
              : 'border-[var(--pos)]/25 bg-[var(--pos-tint)] text-[var(--pos)]'
          }`}>
            {duplicate || !isTaxIdValid || stateMismatch ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> : <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />}
            <div>
              {duplicate && <span>Duplicate detected: A party with this name, phone, or tax ID already exists ({duplicate.name}).</span>}
              {!duplicate && !isTaxIdValid && <span>{taxIdValidation.message}</span>}
              {!duplicate && isTaxIdValid && stateMismatch && <span>State mismatch: Tax ID prefix indicates {gstState}, but selected state is {form.state}.</span>}
              {!duplicate && isTaxIdValid && !stateMismatch && <span>Valid {countryConfig.taxIdLabel} for {countryConfig.name}.</span>}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Contact Person">
            <input value={form.contactPerson} onChange={e => setValue('contactPerson', e.target.value)} className={inputClass()} placeholder="Alex Morgan" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={e => setValue('phone', e.target.value)} className={inputClass()} placeholder="+1 555 019 283" />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={e => setValue('email', e.target.value)} className={inputClass()} placeholder="billing@acme.com" />
          </Field>
          <Field label="Account Owner">
            <input value={form.owner} onChange={e => setValue('owner', e.target.value)} className={inputClass()} placeholder="Finance Team" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="City" required>
            <input value={form.city} onChange={e => setValue('city', e.target.value)} className={inputClass()} placeholder="City / Municipality" />
          </Field>
          <Field label="State / Region">
            <select
              value={form.state || (countryCode === 'IN' ? gstState : '') || countryConfig.regions[0] || ''}
              onChange={e => setValue('state', e.target.value)}
              className={inputClass()}
            >
              {countryConfig.regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Branch / Location">
            <input value={form.branch} onChange={e => setValue('branch', e.target.value)} className={inputClass()} placeholder="Headquarters" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Billing Address">
            <textarea value={form.billingAddress} onChange={e => setValue('billingAddress', e.target.value)} rows={2} className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" placeholder="Suite, Street, ZIP / Postal Code" />
          </Field>
          <Field label="Shipping Address">
            <textarea value={form.shippingAddress} onChange={e => setValue('shippingAddress', e.target.value)} rows={2} className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" placeholder="Leave empty if same as billing" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Field label={`Credit Limit (${countryConfig.currencySymbol})`}>
            <input type="number" value={form.creditLimit} onChange={e => setValue('creditLimit', e.target.value)} className={inputClass()} placeholder="50000" />
          </Field>
          <Field label="Credit Period (Days)">
            <input type="number" value={form.creditPeriod} onChange={e => setValue('creditPeriod', e.target.value)} className={inputClass()} placeholder="30" />
          </Field>
          <Field label={`Opening Balance (${countryConfig.currencySymbol})`}>
            <input type="number" value={form.openingBalance} onChange={e => setValue('openingBalance', e.target.value)} className={inputClass()} placeholder="0" />
          </Field>
          <Field label="Payment Mode">
            <select value={form.preferredMode} onChange={e => setValue('preferredMode', e.target.value)} className={inputClass()}>
              <option>Bank Transfer / Wire</option>
              <option>Credit Card</option>
              <option>ACH / Direct Debit</option>
              <option>UPI / Instant</option>
              <option>Cheque</option>
            </select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}
