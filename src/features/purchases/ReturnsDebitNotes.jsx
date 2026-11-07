import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download, FileMinus2, Plus, RotateCcw, Scale } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import { formatCompact, formatCurrency } from '../../lib/currency'
import { getDebitNotes, getPurchaseReturns } from '../../data/services/purchaseService'
import { toast } from '../../lib/toast'

const STATUS_TONE = {
  approved: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  pending: 'bg-[var(--warn-tint)] text-[var(--warn)]',
  open: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  adjusted: 'bg-[var(--surface-2)] text-[var(--muted)]',
}

function Chip({ value }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[value] ?? 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>{value}</span>
}

export default function ReturnsDebitNotes() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    Promise.all([getPurchaseReturns(), getDebitNotes()]).then(([returns, debitNotes]) => {
      setRows([
        ...returns.map(row => ({ ...row, docType:'Return With Goods', creditStatus: row.status === 'approved' ? 'Debit note ready' : 'Awaiting approval', goods:'Yes' })),
        ...debitNotes.map(row => ({ ...row, docType:'Debit Note Only', items:'-', creditStatus: row.status === 'adjusted' ? 'Adjusted' : 'Open credit', goods:'No' })),
      ])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.toLowerCase()
    const matchSearch = !search
      || row.ref.toLowerCase().includes(term)
      || row.supplier.toLowerCase().includes(term)
      || row.invoice.toLowerCase().includes(term)
    return matchSearch && (typeFilter === 'All' || row.docType === typeFilter)
  }), [rows, search, typeFilter])

  const totalCredit = rows.reduce((sum, row) => sum + row.amount, 0)
  const openCredit = rows.filter(row => ['open', 'pending'].includes(row.status)).reduce((sum, row) => sum + row.amount, 0)
  const withGoods = rows.filter(row => row.goods === 'Yes').length

  const columns = [
    { key:'ref', label:'Document #', sortable:true, render:v => <span className="font-mono text-xs text-[var(--primary)]">{v}</span> },
    { key:'date', label:'Date', sortable:true, render:v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'docType', label:'Type', render:v => <span className="font-semibold text-[var(--text)]">{v}</span> },
    { key:'supplier', label:'Supplier', sortable:true, render:v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key:'invoice', label:'Linked Invoice', render:v => <span className="font-mono text-xs text-[var(--muted)]">{v}</span> },
    { key:'goods', label:'Goods', render:v => <span className={`text-xs font-bold ${v === 'Yes' ? 'text-[var(--pos)]' : 'text-[var(--muted)]'}`}>{v}</span> },
    { key:'amount', label:'Credit Value', align:'right', sortable:true, sum:true, render:v => <span className="tabular font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key:'reason', label:'Reason', render:v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key:'status', label:'Status', render:v => <Chip value={v} /> },
    { key:'creditStatus', label:'Next', render:(v,row) => <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={event => { event.stopPropagation(); toast.info(`${v} for ${row.ref}`) }}>{v}</Button> },
  ]

  return (
    <div>
      <PageHeader
        title="Returns & Debit Notes"
        subtitle="Supplier returns, debit-only adjustments, and credit tracking"
        breadcrumb={['Purchase Operations', 'Returns & Debit Notes']}
        action={<div className="flex gap-2"><Button variant="secondary" icon={Download} size="sm">Export</Button><Button variant="primary" icon={Plus} size="sm" onClick={() => toast.info('Return / debit note form opened')}>New Adjustment</Button></div>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Documents" value={rows.length} icon={FileMinus2} tone="text" />
        <StatCard label="Credit Value" value={formatCompact(totalCredit)} icon={Scale} tone="primary" />
        <StatCard label="Open Credit" value={formatCompact(openCredit)} icon={RotateCcw} tone="warn" />
        <StatCard label="With Goods" value={withGoods} icon={RotateCcw} tone="pos" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        showTotals
        onRowClick={row => navigate(`/procurement/returns-debit-notes/${row.id}`)}
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search supplier, return, debit note...">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]">
            <option value="All">All Types</option>
            <option value="Return With Goods">Return With Goods</option>
            <option value="Debit Note Only">Debit Note Only</option>
          </select>
        </Filters>}
      />
    </div>
  )
}
