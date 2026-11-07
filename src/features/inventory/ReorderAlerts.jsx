import { useEffect, useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatNumber } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getItemReorderAlerts } from '../../data/services/inventoryService'

export default function ReorderAlerts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')

  useEffect(() => {
    getItemReorderAlerts().then(data => { setRows(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.toLowerCase()
    return (!term || row.name.toLowerCase().includes(term) || row.code.toLowerCase().includes(term) || row.vendor.toLowerCase().includes(term))
      && (status === 'All' || row.status === status)
  }), [rows, search, status])

  const columns = [
    { key:'code', label:'Code', render:value => <span className="font-mono text-xs text-[var(--muted)]">{value}</span> },
    { key:'name', label:'Item', sortable:true, render:value => <span className="font-semibold text-[var(--text)]">{value}</span> },
    { key:'currentQty', label:'Current', align:'right', sortable:true, render:(value, row) => <span className="tabular font-semibold">{formatNumber(value)} {row.uom}</span> },
    { key:'reorderQty', label:'Reorder Level', align:'right', render:(value, row) => <span className="tabular text-[var(--muted)]">{formatNumber(value)} {row.uom}</span> },
    { key:'minOrderQty', label:'Min Order', align:'right', render:(value, row) => <span className="tabular text-[var(--muted)]">{formatNumber(value)} {row.uom}</span> },
    { key:'vendor', label:'Preferred Vendor' },
    { key:'leadTimeDays', label:'Lead Time', render:value => `${value} days` },
    { key:'status', label:'Status', render:value => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${value === 'Out of stock' ? 'bg-[var(--neg-tint)] text-[var(--neg)]' : value === 'Reorder soon' ? 'bg-[var(--warn-tint)] text-[var(--warn)]' : 'bg-[var(--pos-tint)] text-[var(--pos)]'}`}>{value}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Reorder Alerts"
        subtitle="Low-stock and reorder planning by preferred vendor"
        breadcrumb={['Items & Inventory', 'Reorder Alerts']}
        action={<Button variant="primary" icon={ShoppingCart} size="sm" onClick={() => toast.success('Purchase order draft created for low-stock items')}>Create PO</Button>}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search item, code or vendor...">
          <select value={status} onChange={e => setStatus(e.target.value)} className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]">
            <option value="All">All Status</option>
            <option value="Healthy">Healthy</option>
            <option value="Reorder soon">Reorder soon</option>
            <option value="Out of stock">Out of stock</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
