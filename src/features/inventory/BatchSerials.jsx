import { useEffect, useMemo, useState } from 'react'
import { Barcode, Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatNumber } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getItemBatchSerials } from '../../data/services/inventoryService'

export default function BatchSerials() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getItemBatchSerials().then(data => { setRows(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.toLowerCase()
    return !term || row.item.toLowerCase().includes(term) || row.code.toLowerCase().includes(term) || row.batch.toLowerCase().includes(term)
  }), [rows, search])

  const columns = [
    { key:'code', label:'Code', render:value => <span className="font-mono text-xs text-[var(--muted)]">{value}</span> },
    { key:'item', label:'Item', sortable:true, render:value => <span className="font-semibold text-[var(--text)]">{value}</span> },
    { key:'tracking', label:'Tracking', render:value => <span className="rounded-full bg-[var(--primary-tint)] px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">{value}</span> },
    { key:'batch', label:'Batch / Serial Prefix', render:value => <span className="font-mono text-xs text-[var(--text)]">{value}</span> },
    { key:'warehouse', label:'Warehouse' },
    { key:'qty', label:'Qty', align:'right', render:(value, row) => <span className="tabular font-semibold">{formatNumber(value)} {row.uom}</span> },
    { key:'expiry', label:'Expiry', render:value => <span className={value === '-' ? 'text-[var(--faint)]' : 'text-[var(--warn)]'}>{value}</span> },
    { key:'status', label:'Status', render:value => <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">{value}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Batch & Serial Tracking"
        subtitle="Batch, serial, expiry and location visibility for stock items"
        breadcrumb={['Items & Inventory', 'Batch & Serial']}
        action={<Button variant="secondary" icon={Download} size="sm" onClick={() => toast.success('Batch register exported')}>Export</Button>}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search item, code, batch or serial..." />}
        emptyState={<div className="flex flex-col items-center py-14 text-center"><Barcode size={28} className="mb-3 text-[var(--faint)]" /><p className="text-sm font-semibold text-[var(--text)]">No batch or serial records</p></div>}
      />
    </div>
  )
}
