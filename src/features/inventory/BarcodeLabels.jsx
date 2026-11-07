import { useEffect, useMemo, useState } from 'react'
import { Barcode, Printer } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { toast } from '../../lib/toast'
import { getItems } from '../../data/services/inventoryService'
import { formatCurrencyWhole } from '../../lib/currency'

export default function BarcodeLabels() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getItems().then(data => { setItems(data.filter(item => item.group !== 'Service')); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return items.filter(item => !term || item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term) || item.barcode.includes(term))
  }, [items, search])

  const columns = [
    { key:'code', label:'Code', render:value => <span className="font-mono text-xs text-[var(--muted)]">{value}</span> },
    { key:'name', label:'Item', sortable:true, render:value => <span className="font-semibold text-[var(--text)]">{value}</span> },
    { key:'barcode', label:'Barcode', render:value => <span className="font-mono text-xs text-[var(--text)]">{value}</span> },
    { key:'brand', label:'Brand' },
    { key:'salePrice', label:'MRP / Sale Rate', align:'right', render:(value, row) => <span className="tabular font-semibold">{formatCurrencyWhole(value)}/{row.uom}</span> },
    { key:'warehouse', label:'Default Warehouse' },
    {
      key:'actions',
      label:'Actions',
      render:(_, row) => <button title="Print label" onClick={e => { e.stopPropagation(); toast.success(`Barcode label queued for ${row.name}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><Printer size={13} /></button>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Barcode Labels"
        subtitle="Generate barcode labels for billing counters and warehouse stock"
        breadcrumb={['Items & Inventory', 'Barcode Labels']}
        action={<Button variant="primary" icon={Printer} size="sm" onClick={() => toast.success('Bulk barcode print queued')}>Print Selected</Button>}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search item, SKU or barcode..." />}
        emptyState={<div className="flex flex-col items-center py-14 text-center"><Barcode size={28} className="mb-3 text-[var(--faint)]" /><p className="text-sm font-semibold text-[var(--text)]">No barcoded items</p></div>}
      />
    </div>
  )
}
