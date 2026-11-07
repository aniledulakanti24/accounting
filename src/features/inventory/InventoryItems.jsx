import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Barcode, Boxes, CalendarDays, Download, Edit3, FileText,
  Plus, Printer, Search, SlidersHorizontal, Trash2,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import { formatCurrency, formatNumber } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getItems, getStockMovements } from '../../data/services/inventoryService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const DETAIL_TABS = [
  { id: 'details', label: 'Item Profile', icon: FileText },
  { id: 'stock', label: 'Stock Position', icon: Boxes },
  { id: 'party-report', label: 'Party Activity', icon: FileText },
  { id: 'party-prices', label: 'Price Rules', icon: FileText },
]

function StockPill({ item }) {
  const low = item.currentQty <= item.reorderQty && item.reorderQty > 0
  const out = item.currentQty === 0 && item.group !== 'Service'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
      out ? 'bg-[var(--neg-tint)] text-[var(--neg)]'
        : low ? 'bg-[var(--warn-tint)] text-[var(--warn)]'
          : 'bg-[var(--pos-tint)] text-[var(--pos)]'
    }`}>
      {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
    </span>
  )
}

function IconButton({ title, icon: Icon, onClick, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-colors ${
        danger ? 'text-[var(--neg)] hover:bg-[var(--neg-tint)]' : 'text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]'
      }`}
    >
      <Icon size={16} />
    </button>
  )
}

function FieldGrid({ item }) {
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryConfig = getCountryTaxConfig(activeCompany?.country || 'IN')
  const taxLabel = `${countryConfig.taxSystem} Rate`
  const codeLabel = countryConfig.code === 'IN' ? 'HSN / SAC' : 'Commodity Code'

  const fields = [
    ['Item Code', item.code],
    ['SKU', item.sku],
    ['Group', item.group],
    ['Brand', item.brand],
    [codeLabel, item.hsn],
    [taxLabel, `${item.gstRate}%`],
    ['UOM', item.uom],
    ['Sale Rate', formatCurrency(item.salePrice)],
    ['Purchase Rate', formatCurrency(item.purchasePrice)],
    ['Preferred Vendor', item.preferredVendor],
    ['Tracking', item.tracking],
  ]

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {fields.map(([label, value]) => (
        <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value || '-'}</p>
        </div>
      ))}
    </div>
  )
}

function BarcodePanel({ item }) {
  const digits = item.barcode || 'No barcode'
  return (
    <div className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Barcode</p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2 font-mono text-sm font-semibold text-[var(--text)]">
          <Barcode size={16} className="text-[var(--primary)]" />
          {digits}
        </div>
        <p className="mt-2 text-xs text-[var(--faint)]">Used for billing, stock scan, label print, and warehouse movement.</p>
      </div>
      <div className="flex min-h-20 items-end justify-center gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-white px-4 py-3">
        {(item.barcode || item.code).split('').slice(0, 18).map((char, index) => (
          <span
            key={`${char}-${index}`}
            className="block rounded-full bg-[var(--text)]"
            style={{ height: `${28 + ((char.charCodeAt(0) + index) % 32)}px`, width: `${index % 3 === 0 ? 3 : 2}px` }}
          />
        ))}
      </div>
    </div>
  )
}

function StockDetails({ item }) {
  const rows = [
    { location: item.warehouse, qty: item.currentQty, committed: Math.round(item.currentQty * 0.12), available: Math.max(0, item.currentQty - Math.round(item.currentQty * 0.12)) },
    { location: 'In Transit', qty: Math.round(item.reorderQty * 0.35), committed: 0, available: Math.round(item.reorderQty * 0.35) },
    { location: 'QC Hold', qty: Math.round(item.currentQty * 0.04), committed: 0, available: 0 },
  ]

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)]">
          <tr>
            {['Warehouse', 'Physical Qty', 'Committed', 'Available', 'Reorder Level'].map(label => (
              <th key={label} className="border-b border-[var(--border)] px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.location} className="border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.location}</td>
              <td className="px-4 py-3 tabular">{formatNumber(row.qty)} {item.uom}</td>
              <td className="px-4 py-3 tabular">{formatNumber(row.committed)} {item.uom}</td>
              <td className="px-4 py-3 tabular font-semibold text-[var(--pos)]">{formatNumber(row.available)} {item.uom}</td>
              <td className="px-4 py-3 tabular text-[var(--muted)]">{formatNumber(item.reorderQty)} {item.uom}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PartyWiseReport({ item }) {
  const rows = [
    { party: 'Awfis Space Solutions Limited', salesQty: Math.max(1, Math.round(item.openingQty * 0.05)), salesAmount: item.salePrice * Math.max(1, Math.round(item.openingQty * 0.05)), purchaseQty: 0, purchaseAmount: 0 },
    { party: item.preferredVendor, salesQty: 0, salesAmount: 0, purchaseQty: Math.max(1, Math.round(item.openingQty * 0.12)), purchaseAmount: item.purchasePrice * Math.max(1, Math.round(item.openingQty * 0.12)) },
  ]

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)]">
          <tr>
            {['Party Name', 'Sales Quantity', 'Sales Amount', 'Purchase Quantity', 'Purchase Amount'].map(label => (
              <th key={label} className="border-b border-[var(--border)] px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.party} className="border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.party}</td>
              <td className="px-4 py-3 tabular">{formatNumber(row.salesQty)}</td>
              <td className="px-4 py-3 tabular">{row.salesAmount ? formatCurrency(row.salesAmount) : '-'}</td>
              <td className="px-4 py-3 tabular">{formatNumber(row.purchaseQty)}</td>
              <td className="px-4 py-3 tabular">{row.purchaseAmount ? formatCurrency(row.purchaseAmount) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PartyWisePrices({ item }) {
  const rows = [
    { party: 'Retail Customers', type: 'Sales', price: item.salePrice, discount: '0%', lastRate: item.salePrice },
    { party: 'Preferred Dealers', type: 'Sales', price: Math.round(item.salePrice * 0.96), discount: '4%', lastRate: Math.round(item.salePrice * 0.97) },
    { party: item.preferredVendor, type: 'Purchase', price: item.purchasePrice, discount: '-', lastRate: Math.round(item.purchasePrice * 1.02) },
  ]

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)]">
          <tr>
            {['Party / Price List', 'Type', 'Rate', 'Discount', 'Last Rate'].map(label => (
              <th key={label} className="border-b border-[var(--border)] px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={`${row.party}-${row.type}`} className="border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.party}</td>
              <td className="px-4 py-3">{row.type}</td>
              <td className="px-4 py-3 tabular font-semibold">{formatCurrency(row.price)}</td>
              <td className="px-4 py-3">{row.discount}</td>
              <td className="px-4 py-3 tabular">{formatCurrency(row.lastRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MovementPreview({ movements, item }) {
  const rows = movements.filter(row => row.item === item.name).slice(0, 5)
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text)]">Recent Movement</h3>
        <span className="text-xs text-[var(--muted)]">Last 365 days</span>
      </div>
      <div className="space-y-2">
        {(rows.length ? rows : [{ id:'empty', date:'-', ref:'-', type:'No movement yet', qty:0, unit:item.uom, value:0 }]).map(row => (
          <div key={row.id} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2 text-sm">
            <div>
              <p className="font-semibold text-[var(--text)]">{row.type}</p>
              <p className="text-xs text-[var(--faint)]">{row.date} · {row.ref}</p>
            </div>
            <p className="tabular font-semibold text-[var(--text)]">{formatNumber(row.qty)} {row.unit}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ItemDetailWorkspace({ item, items, movements, detailTab, setDetailTab, setSelectedId }) {
  const switchItems = items.filter(row => row.id !== item.id).slice(0, 5)

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5">
            <button
              onClick={() => setSelectedId('')}
              className="mb-4 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            >
              <ArrowLeft size={16} />
              Back to items
            </button>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black text-[var(--text)]">{item.name}</h1>
                  <StockPill item={item} />
                </div>
                <p className="mt-2 font-mono text-xs text-[var(--faint)]">{item.code} / {item.sku || 'No SKU'} / {item.barcode || 'No barcode'}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="primary" icon={SlidersHorizontal} onClick={() => toast.success(`Adjust stock opened for ${item.name}`)}>Adjust Stock</Button>
                <IconButton title="Edit" icon={Edit3} onClick={() => toast.info(`Edit opened for ${item.name}`)} />
                <IconButton title="Delete" icon={Trash2} danger onClick={() => toast.info(`Delete confirmation opened for ${item.name}`)} />
                <IconButton title="Barcode" icon={Barcode} onClick={() => toast.success(`Barcode label queued for ${item.name}`)} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                ['On Hand', item.group === 'Service' ? '-' : `${formatNumber(item.currentQty)} ${item.uom}`],
                ['Selling Price', formatCurrency(item.salePrice)],
                ['Purchase Price', item.purchasePrice ? formatCurrency(item.purchasePrice) : '-'],
                ['Warehouse', item.warehouse],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
                  <p className="mt-2 text-base font-bold text-[var(--text)]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--text)] p-5 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Scan Identity</p>
            <div className="mt-4 rounded-[var(--radius-sm)] bg-white p-4 text-[var(--text)]">
              <div className="flex min-h-24 items-end justify-center gap-1 border border-dashed border-[var(--border)] bg-white px-4 py-3">
                {(item.barcode || item.code).split('').slice(0, 18).map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    className="block rounded-full bg-[var(--text)]"
                    style={{ height: `${30 + ((char.charCodeAt(0) + index) % 38)}px`, width: `${index % 3 === 0 ? 4 : 2}px` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-center font-mono text-sm font-black">{item.barcode || 'No barcode'}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/65">Barcode links billing, stock scan, label print, and warehouse movement for this item.</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
          {DETAIL_TABS.map(tab => {
            const Icon = tab.icon
            const active = detailTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-sm">
            <CalendarDays size={15} />
            Last 365 Days
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-sm">
            <Download size={15} />
            Download
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-sm">
            <Printer size={15} />
            Print PDF
          </button>
        </div>
      </div>

      {detailTab === 'details' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <FieldGrid item={item} />
            <MovementPreview item={item} movements={movements} />
          </div>
          <aside className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Quick Switch</p>
            <div className="mt-3 space-y-2">
              {switchItems.map(nextItem => (
                <button
                  key={nextItem.id}
                  onClick={() => { setSelectedId(nextItem.id); setDetailTab('details') }}
                  className="flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left text-sm transition-colors hover:bg-[var(--surface)]"
                >
                  <span className="min-w-0 truncate font-semibold text-[var(--text)]">{nextItem.name}</span>
                  <span className="ml-2 shrink-0 font-mono text-xs text-[var(--muted)]">{nextItem.code}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
      {detailTab === 'stock' && <StockDetails item={item} />}
      {detailTab === 'party-report' && <PartyWiseReport item={item} />}
      {detailTab === 'party-prices' && <PartyWisePrices item={item} />}
    </div>
  )
}

export default function InventoryItems() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')
  const [selectedId, setSelectedId] = useState('')
  const [detailTab, setDetailTab] = useState('details')

  useEffect(() => {
    Promise.all([getItems(), getStockMovements()]).then(([itemData, movementData]) => {
      setItems(itemData)
      setMovements(movementData)
      setSelectedId('')
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return items.filter(item => {
      const matchesGroup = groupFilter === 'All' || item.group === groupFilter
      const matchesSearch = !term
        || item.name.toLowerCase().includes(term)
        || item.code.toLowerCase().includes(term)
        || item.group.toLowerCase().includes(term)
        || item.sku?.toLowerCase().includes(term)
        || item.barcode?.includes(term)
      return matchesGroup && matchesSearch
    })
  }, [items, search, groupFilter])

  const itemGroups = useMemo(() => ['All', ...Array.from(new Set(items.map(item => item.group)))], [items])

  const summary = useMemo(() => {
    const stockItems = items.filter(item => item.group !== 'Service')
    const totalQty = stockItems.reduce((total, item) => total + item.currentQty, 0)
    const totalValue = stockItems.reduce((total, item) => total + (item.currentQty * item.purchasePrice), 0)
    const lowStock = stockItems.filter(item => item.currentQty <= item.reorderQty).length
    return { stockItems: stockItems.length, totalQty, totalValue, lowStock }
  }, [items])

  const selectedItem = items.find(item => item.id === selectedId) ?? null

  if (loading) {
    return <div className="py-16 text-center text-sm text-[var(--faint)]">Loading items...</div>
  }

  if (!selectedItem) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--faint)]">Items & Inventory / Items</p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">Items</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {summary.stockItems} stock items · Total stock value {formatCurrency(summary.totalValue)}
            </p>
          </div>
          <Button icon={Plus} onClick={() => navigate('/inventory/inventory-items/new')}>New Item</Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Items</p>
            <p className="mt-2 text-2xl font-bold text-[var(--primary)]">{items.length}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Total Quantity</p>
            <p className="mt-2 font-mono text-2xl font-bold text-[var(--text)]">{formatNumber(summary.totalQty)}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Low Stock Alerts</p>
            <p className={`mt-2 text-2xl font-bold ${summary.lowStock ? 'text-[var(--warn)]' : 'text-[var(--pos)]'}`}>{summary.lowStock}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] pl-11 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              placeholder="Search item or code..."
            />
          </div>
          <select
            value={groupFilter}
            onChange={event => setGroupFilter(event.target.value)}
            className="h-11 min-w-32 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
          >
            {itemGroups.map(group => <option key={group} value={group}>{group}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-sm">
            <thead className="bg-[var(--surface-2)]">
              <tr>
                {['Code', 'Item / Group', 'Warehouse', 'Qty', 'Selling Price', 'Purchase Price', 'Status'].map(label => (
                  <th key={label} className="border-b border-[var(--border)] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                return (
                  <tr
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setDetailTab('details') }}
                    className="cursor-pointer border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-[var(--muted)]">{item.code}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--text)]">{item.name}</p>
                      <p className="mt-1 text-xs text-[var(--faint)]">{item.group}</p>
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">{item.warehouse}</td>
                    <td className="px-5 py-4 font-mono text-sm text-[var(--muted)]">{item.group === 'Service' ? '-' : `${formatNumber(item.currentQty)} ${item.uom}`}</td>
                    <td className="px-5 py-4 font-mono font-bold text-[var(--pos)]">{formatCurrency(item.salePrice)}</td>
                    <td className="px-5 py-4 font-mono font-semibold text-[var(--text)]">{item.purchasePrice ? formatCurrency(item.purchasePrice) : '-'}</td>
                    <td className="px-5 py-4"><StockPill item={item} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          {!filtered.length && (
            <div className="p-8 text-center text-sm text-[var(--muted)]">No items match this search.</div>
          )}
        </div>
      </div>
    )
  }

  if (selectedItem) {
    return (
      <ItemDetailWorkspace
        item={selectedItem}
        items={filtered.length ? filtered : items}
        movements={movements}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        setSelectedId={setSelectedId}
      />
    )
  }

  return (
    <div className="h-[calc(100vh-150px)] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="grid h-full grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                placeholder="Search by Item Name"
              />
            </div>
            <button
              onClick={() => toast.info('Create item form opened')}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-[var(--primary)] text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-tint)]"
            >
              + Create Item
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {filtered.map(item => {
              const active = item.id === selectedItem?.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); setDetailTab('details') }}
                  className={`flex min-h-20 w-full items-center justify-between rounded-[var(--radius-sm)] border px-3 py-3 text-left transition-colors ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-[var(--faint)]">{item.code}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-xs font-semibold text-[var(--muted)]">{item.group === 'Service' ? '-' : `${formatNumber(item.currentQty)}${item.uom}`}</span>
                </button>
              )
            })}
            {!filtered.length && (
              <div className="col-span-full rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
                No items match this search.
              </div>
            )}
          </div>
        </aside>

        {selectedItem && (
          <section className="min-h-0 overflow-y-auto bg-[var(--bg)]">
            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedId('')}
                    className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-xl font-bold text-[var(--text)]">{selectedItem.name}</h1>
                      <StockPill item={selectedItem} />
                    </div>
                    <p className="mt-1 font-mono text-xs text-[var(--faint)]">{selectedItem.sku || selectedItem.code} · {selectedItem.barcode || 'No barcode'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" icon={SlidersHorizontal} onClick={() => toast.success(`Adjust stock opened for ${selectedItem.name}`)}>Adjust Stock</Button>
                  <IconButton title="Edit" icon={Edit3} onClick={() => toast.info(`Edit opened for ${selectedItem.name}`)} />
                  <IconButton title="Delete" icon={Trash2} danger onClick={() => toast.info(`Delete confirmation opened for ${selectedItem.name}`)} />
                  <IconButton title="Barcode" icon={Barcode} onClick={() => toast.success(`Barcode label queued for ${selectedItem.name}`)} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-b border-[var(--border)]">
                {DETAIL_TABS.map(tab => {
                  const Icon = tab.icon
                  const active = detailTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? 'border-[var(--primary)] text-[var(--primary)]'
                          : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Icon size={15} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-sm">
                  <CalendarDays size={15} />
                  Last 365 Days
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-sm">
                  <Download size={15} />
                  Download
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-sm">
                  <Printer size={15} />
                  Print PDF
                </button>
              </div>

              {detailTab === 'details' && (
                <div className="space-y-4">
                  <BarcodePanel item={selectedItem} />
                  <FieldGrid item={selectedItem} />
                  <MovementPreview item={selectedItem} movements={movements} />
                </div>
              )}
              {detailTab === 'stock' && <StockDetails item={selectedItem} />}
              {detailTab === 'party-report' && <PartyWiseReport item={selectedItem} />}
              {detailTab === 'party-prices' && <PartyWisePrices item={selectedItem} />}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
