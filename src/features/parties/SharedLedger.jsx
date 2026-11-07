import { useState, useEffect, useMemo } from 'react'
import { ArrowRightLeft, Download, Eye, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getSharedParties } from '../../data/services/partiesService'
import { toast } from '../../lib/toast'
import PartyDetailModal from './PartyDetailModal'

export default function SharedLedger() {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [netFilter, setNetFilter] = useState('All')
  const [selectedParty, setSelectedParty] = useState(null)

  useEffect(() => {
    getSharedParties().then(d => {
      // Simulate AR and AP values — shared parties have both
      const enriched = d.map(p => ({
        ...p,
        ar: p.outstanding,             // amount we collect from them
        ap: p.advance,                 // amount we pay them (simplified)
        net: p.outstanding - p.advance,// positive = net receivable
      }))
      setParties(enriched)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => parties.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchNet    = netFilter === 'All'
      || (netFilter === 'Net Receivable' && p.net > 0)
      || (netFilter === 'Net Payable'    && p.net < 0)
      || (netFilter === 'Balanced'       && p.net === 0)
    return matchSearch && matchNet
  }), [parties, search, netFilter])

  const totalAR  = parties.reduce((s, p) => s + p.ar,  0)
  const totalAP  = parties.reduce((s, p) => s + p.ap,  0)
  const totalNet = parties.reduce((s, p) => s + p.net, 0)

  const columns = [
    {
      key: 'name',
      label: 'Party',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-xs text-[var(--faint)] font-mono">{row.gstin}</p>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'ar',
      label: 'Receivable (AR)',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-semibold ${val > 0 ? 'text-[var(--pos)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'ap',
      label: 'Payable (AP)',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={`tabular text-sm font-semibold ${val > 0 ? 'text-[var(--neg)]' : 'text-[var(--faint)]'}`}>
          {val > 0 ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      key: 'net',
      label: 'Net Position',
      align: 'right',
      sortable: true,
      render: (val) => {
        const pos = val > 0
        const neg = val < 0
        return (
          <div className="text-right">
            <span className={`tabular text-sm font-bold ${pos ? 'text-[var(--pos)]' : neg ? 'text-[var(--neg)]' : 'text-[var(--muted)]'}`}>
              {val > 0 ? '+' : ''}{formatCurrency(val)}
            </span>
            <p className="text-xs text-[var(--faint)]">
              {pos ? 'Net Receivable' : neg ? 'Net Payable' : 'Balanced'}
            </p>
          </div>
        )
      },
    },
    {
      key: 'lastTxn',
      label: 'Last Txn',
      sortable: true,
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex justify-end gap-1.5">
          <button title="View party" onClick={e => { e.stopPropagation(); setSelectedParty(row) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><Eye size={13} /></button>
          <button title="Propose settlement" onClick={e => { e.stopPropagation(); toast.success(`Net settlement proposed for ${row.name}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)]"><RefreshCw size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Shared Ledger"
        subtitle="Parties acting as both customer and supplier"
        breadcrumb={['Parties & Ledgers', 'Shared Ledger']}
        action={
          <Button variant="secondary" icon={Download} size="sm">Export</Button>
        }
      />

      {/* Net position summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total AR',      value: formatCompact(totalAR),  color: 'var(--pos)',     sub: 'receivable from these parties' },
          { label: 'Total AP',      value: formatCompact(totalAP),  color: 'var(--neg)',     sub: 'payable to these parties' },
          { label: 'Net Position',  value: formatCompact(totalNet), color: totalNet >= 0 ? 'var(--pos)' : 'var(--neg)', sub: totalNet >= 0 ? 'net receivable' : 'net payable' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-[var(--faint)] mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        onRowClick={(row) => setSelectedParty(row)}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search party…">
            <select
              value={netFilter}
              onChange={e => setNetFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All</option>
              <option value="Net Receivable">Net Receivable</option>
              <option value="Net Payable">Net Payable</option>
              <option value="Balanced">Balanced</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <ArrowRightLeft size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No shared parties</p>
            <p className="text-xs text-[var(--muted)] mt-1">Parties with both AR and AP appear here.</p>
          </div>
        }
      />
      <PartyDetailModal open={!!selectedParty} onClose={() => setSelectedParty(null)} party={selectedParty} />
    </div>
  )
}
