import {
  AlertTriangle, Barcode, Boxes, Building2, FileText, PackageCheck,
  Printer, ShoppingCart, Tag,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { formatCurrency, formatNumber } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

function Chip({ children, tone = 'bg-[var(--surface-2)] text-[var(--muted)]' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{children}</span>
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--text)]">{value || '-'}</p>
    </div>
  )
}

export default function ItemDetailModal({ open, onClose, item }) {
  if (!item) return null

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryConfig = getCountryTaxConfig(activeCompany?.country || 'IN')
  const codePrefix = countryConfig.code === 'IN' ? 'HSN' : 'Commodity Code'

  const isService = item.group === 'Service'
  const stockValue = item.currentQty * item.purchasePrice
  const lowStock = item.currentQty <= item.reorderQty && item.reorderQty > 0
  const outOfStock = item.currentQty === 0 && !isService
  const margin = item.salePrice > 0 && item.purchasePrice > 0
    ? ((item.salePrice - item.purchasePrice) / item.salePrice) * 100
    : null

  const stockTone = outOfStock
    ? 'bg-[var(--neg-tint)] text-[var(--neg)]'
    : lowStock
      ? 'bg-[var(--warn-tint)] text-[var(--warn)]'
      : 'bg-[var(--pos-tint)] text-[var(--pos)]'

  return (
    <Modal open={open} onClose={onClose} title={item.name} size="2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="bg-[var(--primary-tint)] text-[var(--primary)]">{item.group}</Chip>
              <Chip tone={stockTone}>{outOfStock ? 'Out of stock' : lowStock ? 'Reorder soon' : 'Healthy stock'}</Chip>
              <Chip>{item.tracking}</Chip>
            </div>
            <p className="mt-2 font-mono text-xs text-[var(--faint)]">{item.sku || item.code} · {codePrefix} {item.hsn} · {countryConfig.taxSystem} {item.gstRate}%</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={Printer} onClick={() => toast.success(`Barcode label queued for ${item.name}`)}>Print Label</Button>
            <Button size="sm" variant="secondary" icon={ShoppingCart} onClick={() => toast.success(`Purchase order draft opened for ${item.name}`)}>Create PO</Button>
            <Button size="sm" variant="primary" icon={FileText} onClick={() => toast.success(`Item ledger opened for ${item.name}`)}>Ledger</Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Current Stock</p>
            <p className={`mt-1 tabular text-lg font-bold ${outOfStock ? 'text-[var(--neg)]' : lowStock ? 'text-[var(--warn)]' : 'text-[var(--text)]'}`}>
              {isService ? '-' : `${formatNumber(item.currentQty)} ${item.uom}`}
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Stock Value</p>
            <p className="mt-1 tabular text-lg font-bold text-[var(--text)]">{formatCurrency(stockValue)}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Sale Rate</p>
            <p className="mt-1 tabular text-lg font-bold text-[var(--primary)]">{formatCurrency(item.salePrice)}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Margin</p>
            <p className="mt-1 tabular text-lg font-bold text-[var(--pos)]">{margin == null ? '-' : `${margin.toFixed(1)}%`}</p>
          </div>
        </div>

        {lowStock && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--warn)]/25 bg-[var(--warn-tint)] px-3 py-2 text-xs font-semibold text-[var(--warn)]">
            <AlertTriangle size={14} />
            Reorder level reached. Minimum order quantity is {formatNumber(item.minOrderQty || item.reorderQty)} {item.uom}; preferred vendor is {item.preferredVendor}.
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Tag size={15} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Item Master</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code" value={item.code} />
                <Field label="SKU" value={item.sku} />
                <Field label="Barcode" value={item.barcode} />
                <Field label="Brand" value={item.brand} />
                <Field label="UOM" value={item.uom} />
                <Field label="Status" value={item.status} />
                <Field label="Purchase Rate" value={formatCurrency(item.purchasePrice)} />
                <Field label="Opening Qty" value={isService ? '-' : `${formatNumber(item.openingQty)} ${item.uom}`} />
              </div>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 size={15} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Warehouse & Vendor</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Warehouse" value={item.warehouse} />
                <Field label="Preferred Vendor" value={item.preferredVendor} />
                <Field label="Lead Time" value={`${item.leadTimeDays} days`} />
                <Field label="Reorder Level" value={isService ? '-' : `${formatNumber(item.reorderQty)} ${item.uom}`} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Barcode size={15} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Batch / Serial</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Tracking" value={item.tracking} />
                <Field label="Batch / Prefix" value={item.batch} />
                <Field label="Expiry" value={item.expiry} />
              </div>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Boxes size={15} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Stock Position</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: item.warehouse || 'Main Location', qty: item.currentQty, tone: stockTone },
                  { label: 'In Transit', qty: outOfStock ? 0 : Math.max(0, Math.round(item.reorderQty * 0.35)), tone: 'bg-[var(--primary-tint)] text-[var(--primary)]' },
                  { label: 'Committed', qty: outOfStock ? 0 : Math.max(0, Math.round(item.currentQty * 0.12)), tone: 'bg-[var(--surface-2)] text-[var(--muted)]' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2">
                    <span className="text-sm font-medium text-[var(--text)]">{row.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.tone}`}>{isService ? '-' : `${formatNumber(row.qty)} ${item.uom}`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <PackageCheck size={15} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Recent Movement</h3>
              </div>
              <div className="space-y-2 text-xs">
                <p className="font-medium text-[var(--text)]">Last inward: {formatNumber(Math.max(1, Math.round(item.openingQty * 0.08)))} {item.uom} from {item.preferredVendor}</p>
                <p className="font-medium text-[var(--text)]">Last outward: {formatNumber(Math.max(1, Math.round(item.currentQty * 0.04)))} {item.uom} from {item.warehouse}</p>
                <p className="text-[var(--muted)]">Valuation basis: weighted average mock rate.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
