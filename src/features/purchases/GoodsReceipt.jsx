import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, Download, PackageCheck, Plus, Scale, Truck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import { formatCompact, formatCurrency, formatNumber } from '../../lib/currency'
import { getGoodsReceipts } from '../../data/services/purchaseService'
import { toast } from '../../lib/toast'

const MATCH_TONE = {
  matched: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  'price variance': 'bg-[var(--warn-tint)] text-[var(--warn)]',
  'qty short': 'bg-[var(--warn-tint)] text-[var(--warn)]',
  'no po': 'bg-[var(--neg-tint)] text-[var(--neg)]',
}

const STATUS_TONE = {
  accepted: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  hold: 'bg-[var(--warn-tint)] text-[var(--warn)]',
  partial: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  review: 'bg-[var(--neg-tint)] text-[var(--neg)]',
}

function Chip({ value, toneMap }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${toneMap[value] ?? 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>{value}</span>
}

export default function GoodsReceipt() {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [matchFilter, setMatchFilter] = useState('All')

  useEffect(() => {
    getGoodsReceipts().then(data => { setReceipts(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => receipts.filter(row => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || row.ref.toLowerCase().includes(term)
      || row.supplier.toLowerCase().includes(term)
      || (row.po ?? '').toLowerCase().includes(term)
    return matchSearch && (matchFilter === 'All' || row.match === matchFilter)
  }), [receipts, search, matchFilter])

  const totalLanded = receipts.reduce((sum, row) => sum + row.landedCost, 0)
  const rejected = receipts.reduce((sum, row) => sum + row.rejectedQty, 0)
  const exceptions = receipts.filter(row => row.match !== 'matched').length

  const columns = [
    { key:'ref', label:'GRN #', sortable:true, render:v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date', label:'Date', sortable:true, render:v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'supplier', label:'Supplier', sortable:true, render:v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'po', label:'PO / Bill', render:(_, row) => <div><p className="font-mono text-xs text-[var(--muted)]">{row.po ?? 'No PO'}</p><p className="text-[10px] text-[var(--faint)]">{row.bill}</p></div> },
    { key:'warehouse', label:'Warehouse', render:v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'receivedQty', label:'Received', align:'right', sortable:true, render:v => <span className="tabular font-semibold text-[var(--pos)]">{formatNumber(v)}</span> },
    { key:'rejectedQty', label:'Rejected', align:'right', render:v => <span className={`tabular font-semibold ${v ? 'text-[var(--neg)]' : 'text-[var(--faint)]'}`}>{v || '-'}</span> },
    { key:'landedCost', label:'Landed Cost', align:'right', sortable:true, sum:true, render:v => <span className="tabular font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'match', label:'3-Way Match', render:v => <Chip value={v} toneMap={MATCH_TONE} /> },
    { key:'status', label:'Status', render:v => <Chip value={v} toneMap={STATUS_TONE} /> },
    { key:'nextAction', label:'Next', render:(v,row) => <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={event => { event.stopPropagation(); toast.info(`${v} for ${row.ref}`) }}>{v}</Button> },
  ]

  return (
    <div>
      <PageHeader
        title="Goods Receipt"
        subtitle="GRN, rejected quantity, landed cost, and 3-way matching"
        breadcrumb={['Purchase Operations', 'Goods Receipt']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm" onClick={() => toast.info('New GRN form opened')}>New GRN</Button></div>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="GRNs" value={receipts.length} icon={PackageCheck} tone="text" />
        <StatCard label="Landed Cost" value={formatCompact(totalLanded)} icon={Scale} tone="primary" />
        <StatCard label="Rejected Qty" value={rejected} icon={Boxes} tone="neg" />
        <StatCard label="Exceptions" value={exceptions} icon={Truck} tone="warn" hint="not 3-way matched" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        showTotals
        onRowClick={row => navigate(`/procurement/goods-receipt/${row.id}`)}
        rowClassName={row => row.match !== 'matched' ? 'bg-[var(--warn-tint)]/30' : ''}
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search GRN, PO, supplier...">
          <select value={matchFilter} onChange={e => setMatchFilter(e.target.value)} className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]">
            <option value="All">All Match</option>
            <option value="matched">Matched</option>
            <option value="price variance">Price Variance</option>
            <option value="qty short">Qty Short</option>
            <option value="no po">No PO</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
