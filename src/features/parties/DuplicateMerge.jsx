import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Merge, Search } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { toast } from '../../lib/toast'
import { getParties } from '../../data/services/partiesService'

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function similarityReason(a, b) {
  if (a.gstin && a.gstin === b.gstin) return 'Same GSTIN'
  if (a.phone && a.phone === b.phone) return 'Same phone'
  if (normalize(a.name).slice(0, 8) === normalize(b.name).slice(0, 8)) return 'Similar name'
  return 'Needs review'
}

export default function DuplicateMerge() {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getParties().then(data => { setParties(data); setLoading(false) })
  }, [])

  const duplicateRows = useMemo(() => {
    const rows = []
    parties.forEach((party, index) => {
      parties.slice(index + 1).forEach(candidate => {
        const reason = similarityReason(party, candidate)
        if (reason !== 'Needs review') {
          rows.push({
            id: `${party.id}-${candidate.id}`,
            primary: party.name,
            duplicate: candidate.name,
            reason,
            gstin: party.gstin === candidate.gstin ? party.gstin : 'Different',
            owner: party.owner,
            confidence: reason === 'Same GSTIN' ? 'High' : 'Medium',
          })
        }
      })
    })
    return rows
  }, [parties])

  const filtered = duplicateRows.filter(row => {
    const term = search.toLowerCase()
    return !term || row.primary.toLowerCase().includes(term) || row.duplicate.toLowerCase().includes(term) || row.reason.toLowerCase().includes(term)
  })

  const columns = [
    { key:'primary', label:'Primary Party', sortable:true, render: value => <span className="font-semibold text-[var(--text)]">{value}</span> },
    { key:'duplicate', label:'Possible Duplicate', sortable:true },
    { key:'reason', label:'Match Reason', render: value => <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warn-tint)] px-2 py-0.5 text-xs font-semibold text-[var(--warn)]"><AlertTriangle size={12} />{value}</span> },
    { key:'gstin', label:'GSTIN' },
    { key:'owner', label:'Owner' },
    { key:'confidence', label:'Confidence', render: value => <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${value === 'High' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--primary-tint)] text-[var(--primary)]'}`}>{value}</span> },
    {
      key:'actions',
      label:'Actions',
      render: (_, row) => (
        <div className="flex justify-end gap-1.5">
          <button title="Merge parties" onClick={e => { e.stopPropagation(); toast.success(`Merge review opened for ${row.primary}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><Merge size={13} /></button>
          <button title="Mark as reviewed" onClick={e => { e.stopPropagation(); toast.success(`${row.duplicate} marked as reviewed`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--pos)]"><CheckCircle2 size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Duplicate Merge"
        subtitle="Review duplicate parties before they split ledgers, GST records, and reminders"
        breadcrumb={['More Features', 'Party Tools', 'Duplicate Merge']}
        action={<Button variant="secondary" icon={Search} size="sm" onClick={() => toast.info('Deep fuzzy scan queued')}>Run Scan</Button>}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          { label:'Duplicate Pairs', value:duplicateRows.length, color:'var(--warn)' },
          { label:'High Confidence', value:duplicateRows.filter(row => row.confidence === 'High').length, color:'var(--neg)' },
          { label:'Reviewed Today', value:0, color:'var(--pos)' },
        ].map(item => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{item.label}</p>
            <p className="mt-1 text-xl font-bold tabular" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search duplicate parties..." />}
      />
    </div>
  )
}
