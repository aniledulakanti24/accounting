import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, FileUp } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { toast } from '../../lib/toast'
import { getPartyDocumentCenter } from '../../data/services/partiesService'

const TONE = {
  verified: 'bg-[var(--pos-tint)] text-[var(--pos)]',
  available: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  'pending-review': 'bg-[var(--warn-tint)] text-[var(--warn)]',
  required: 'bg-[var(--neg-tint)] text-[var(--neg)]',
}

export default function PartyDocuments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getPartyDocumentCenter().then(data => { setRows(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => rows.filter(row => {
    const term = search.toLowerCase()
    return !search || row.party.toLowerCase().includes(term) || row.document.toLowerCase().includes(term) || row.category.toLowerCase().includes(term)
  }), [rows, search])

  const columns = [
    { key:'party', label:'Party', sortable:true, render:value => <span className="font-medium text-[var(--text)]">{value}</span> },
    { key:'document', label:'Document', sortable:true },
    { key:'category', label:'Category' },
    { key:'expiry', label:'Expiry' },
    { key:'required', label:'Required', render:value => value ? 'Yes' : 'No' },
    { key:'owner', label:'Owner' },
    { key:'status', label:'Status', render:value => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[value] ?? TONE.available}`}>{value}</span> },
    {
      key:'actions',
      label:'Actions',
      render:(_, row) => (
        <div className="flex justify-end gap-1.5">
          <button title="Upload" onClick={e => { e.stopPropagation(); toast.info(`Upload opened for ${row.party}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><FileUp size={13} /></button>
          <button title="Verify" onClick={e => { e.stopPropagation(); toast.success(`${row.document} verified`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><CheckCircle2 size={13} /></button>
          <button title="Download" onClick={e => { e.stopPropagation(); toast.success(`${row.document} downloaded`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><Download size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Party Documents"
        subtitle="GST certificates, PAN, bank proofs, contracts, and signed statements"
        breadcrumb={['Parties & Ledgers', 'Documents']}
        action={<Button variant="primary" icon={FileUp} size="sm" onClick={() => toast.info('Bulk upload opened')}>Upload</Button>}
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label:'Total Documents', value:rows.length, color:'var(--text)' },
          { label:'Verified', value:rows.filter(row => row.status === 'verified').length, color:'var(--pos)' },
          { label:'Needs Review', value:rows.filter(row => row.status !== 'verified' && row.status !== 'available').length, color:'var(--warn)' },
        ].map(item => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{item.label}</p>
            <p className="mt-1 text-xl font-bold tabular" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search party, document or category..." />} />
    </div>
  )
}
