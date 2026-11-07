import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BadgeIndianRupee, Boxes, PackagePlus, Save, Warehouse } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { getGodowns, ITEM_GROUPS, UOM_LIST } from '../../data/services/inventoryService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const INITIAL_FORM = {
  name: '',
  code: '',
  sku: '',
  barcode: '',
  group: ITEM_GROUPS[0],
  brand: 'Clever',
  hsn: '21069099',
  gstRate: '18',
  uom: 'Pcs',
  tracking: 'Batch',
  warehouse: '',
  openingQty: '',
  openingRate: '',
  movementType: 'Opening Stock',
  batch: '',
  expiry: '',
  salePrice: '',
  purchasePrice: '',
  minOrderQty: '',
  preferredVendor: '',
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

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} className="text-[var(--primary)]" />
        <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function NewInventoryItem() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [godowns, setGodowns] = useState([])
  const [form, setForm] = useState({ ...INITIAL_FORM, gstRate: String(countryConfig.defaultRate || 18) })

  useEffect(() => {
    getGodowns().then(data => {
      setGodowns(data)
      setForm(prev => ({ ...prev, warehouse: prev.warehouse || data[0]?.name || '' }))
    })
  }, [])

  const openingValue = useMemo(() => Number(form.openingQty || 0) * Number(form.openingRate || form.purchasePrice || 0), [form.openingQty, form.openingRate, form.purchasePrice])
  const margin = useMemo(() => {
    const sale = Number(form.salePrice || 0)
    const purchase = Number(form.purchasePrice || 0)
    return sale > 0 && purchase > 0 ? (((sale - purchase) / sale) * 100).toFixed(1) : '-'
  }, [form.salePrice, form.purchasePrice])

  function setValue(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Enter item name and item code')
      return
    }
    toast.success(`${form.name} added to item draft`)
    navigate('/inventory/inventory-items')
  }

  return (
    <div>
      <PageHeader
        title="New Item"
        subtitle="Create item master, warehouse opening, first movement, and pricing in one flow"
        breadcrumb={['Items & Inventory', 'Items', 'New Item']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/inventory/inventory-items')}>Back</Button>}
      />

      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Section title="Item Profile" icon={PackagePlus}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Item Name" required>
                <input value={form.name} onChange={e => setValue('name', e.target.value)} className={inputClass()} placeholder="Clever Diet Sugar 500gm" />
              </Field>
              <Field label="Item Code" required>
                <input value={form.code} onChange={e => setValue('code', e.target.value)} className={inputClass()} placeholder="CLV-DS-500" />
              </Field>
              <Field label="SKU">
                <input value={form.sku} onChange={e => setValue('sku', e.target.value)} className={inputClass()} placeholder="CLV-DIET-500G" />
              </Field>
              <Field label="Barcode">
                <input value={form.barcode} onChange={e => setValue('barcode', e.target.value)} className={inputClass()} placeholder="890950505001" />
              </Field>
              <Field label="Group">
                <select value={form.group} onChange={e => setValue('group', e.target.value)} className={inputClass()}>
                  {ITEM_GROUPS.map(group => <option key={group}>{group}</option>)}
                </select>
              </Field>
              <Field label="Brand">
                <input value={form.brand} onChange={e => setValue('brand', e.target.value)} className={inputClass()} />
              </Field>
              <Field label={countryCode === 'IN' ? 'HSN' : 'Tax / Commodity Code'}>
                <input value={form.hsn} onChange={e => setValue('hsn', e.target.value)} className={inputClass()} />
              </Field>
              <Field label={`${countryConfig.taxSystem} Rate %`}>
                <input value={form.gstRate} onChange={e => setValue('gstRate', e.target.value)} type="number" className={inputClass()} />
              </Field>
              <Field label="UOM">
                <select value={form.uom} onChange={e => setValue('uom', e.target.value)} className={inputClass()}>
                  {UOM_LIST.map(uom => <option key={uom}>{uom}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Warehouse & Stock" icon={Warehouse}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Warehouse">
                <select value={form.warehouse} onChange={e => setValue('warehouse', e.target.value)} className={inputClass()}>
                  {godowns.map(godown => <option key={godown.id}>{godown.name}</option>)}
                </select>
              </Field>
              <Field label="Tracking">
                <select value={form.tracking} onChange={e => setValue('tracking', e.target.value)} className={inputClass()}>
                  <option>Batch</option>
                  <option>Serial</option>
                  <option>Qty</option>
                  <option>None</option>
                </select>
              </Field>
              <Field label="Minimum Order Qty">
                <input value={form.minOrderQty} onChange={e => setValue('minOrderQty', e.target.value)} type="number" className={inputClass()} />
              </Field>
              <Field label="Opening Quantity">
                <input value={form.openingQty} onChange={e => setValue('openingQty', e.target.value)} type="number" className={inputClass()} />
              </Field>
              <Field label="Opening Rate">
                <input value={form.openingRate} onChange={e => setValue('openingRate', e.target.value)} type="number" className={inputClass()} />
              </Field>
              <Field label="Batch No">
                <input value={form.batch} onChange={e => setValue('batch', e.target.value)} className={inputClass()} placeholder="DS-500-2601" />
              </Field>
            </div>
          </Section>

          <Section title="Stock Movement" icon={Boxes}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Movement Type">
                <select value={form.movementType} onChange={e => setValue('movementType', e.target.value)} className={inputClass()}>
                  <option>Opening Stock</option>
                  <option>Inward</option>
                  <option>Transfer</option>
                  <option>Adjustment</option>
                </select>
              </Field>
              <Field label="Expiry Date">
                <input value={form.expiry} onChange={e => setValue('expiry', e.target.value)} type="date" className={inputClass()} />
              </Field>
              <Field label="Preferred Vendor">
                <input value={form.preferredVendor} onChange={e => setValue('preferredVendor', e.target.value)} className={inputClass()} placeholder="NClever Plant" />
              </Field>
            </div>
          </Section>

          <Section title="Pricing" icon={BadgeIndianRupee}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Selling Price">
                <input value={form.salePrice} onChange={e => setValue('salePrice', e.target.value)} type="number" className={inputClass()} />
              </Field>
              <Field label="Purchase Price">
                <input value={form.purchasePrice} onChange={e => setValue('purchasePrice', e.target.value)} type="number" className={inputClass()} />
              </Field>
              <Field label="Price List Margin">
                <input value={margin === '-' ? '-' : `${margin}%`} readOnly className={inputClass('bg-[var(--surface-2)]')} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--text)]">Item Preview</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Item</p>
                <p className="mt-1 font-semibold text-[var(--text)]">{form.name || 'Unnamed item'}</p>
                <p className="text-xs text-[var(--faint)]">{form.code || 'No code'} / {form.group}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Warehouse</p>
                <p className="mt-1 text-[var(--text)]">{form.warehouse || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Opening Value</p>
                <p className="mt-1 font-mono text-lg font-bold text-[var(--text)]">{formatCurrency(openingValue)}</p>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
                <p className="text-xs text-[var(--muted)]">This creates the item master, starting stock, first stock movement, and price rule together.</p>
              </div>
            </div>
          </section>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => navigate('/inventory/inventory-items')}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Save} className="flex-1 justify-center">Save Item</Button>
          </div>
        </aside>
      </form>
    </div>
  )
}
