import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileSpreadsheet, Merge, UploadCloud } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { toast } from '../../lib/toast'
import { getItemImportPreview } from '../../data/services/inventoryService'

export default function ItemImport() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getItemImportPreview().then(data => { setRows(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return rows.filter(row => !term || row.source.toLowerCase().includes(term) || row.file.toLowerCase().includes(term))
  }, [rows, search])

  const columns = [
    { key:'source', label:'Source', sortable:true, render:value => <span className="font-semibold text-[var(--text)]">{value}</span> },
    { key:'file', label:'File', render:value => <span className="font-mono text-xs text-[var(--primary)]">{value}</span> },
    { key:'rows', label:'Rows', align:'right' },
    { key:'valid', label:'Valid', align:'right', render:value => <span className="font-semibold text-[var(--pos)]">{value}</span> },
    { key:'duplicates', label:'Duplicates', align:'right', render:value => <span className="font-semibold text-[var(--warn)]">{value}</span> },
    { key:'rejected', label:'Rejected', align:'right', render:value => <span className="font-semibold text-[var(--neg)]">{value}</span> },
    { key:'status', label:'Status', render:value => <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">{value}</span> },
    {
      key:'actions',
      label:'Actions',
      render:(_, row) => (
        <div className="flex justify-end gap-1.5">
          <button title="Validate" onClick={e => { e.stopPropagation(); toast.success(`${row.file} validated`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><CheckCircle2 size={13} /></button>
          <button title="Merge duplicates" onClick={e => { e.stopPropagation(); toast.info(`${row.duplicates} duplicate items opened`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><Merge size={13} /></button>
          <button title="Import valid rows" onClick={e => { e.stopPropagation(); toast.success(`${row.valid} items imported from ${row.file}`) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)]"><UploadCloud size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Item Import"
        subtitle="Import items from Tally, Vyapar, Excel, or barcode/SKU templates"
        breadcrumb={['Items & Inventory', 'Import']}
        action={<Button variant="primary" icon={FileSpreadsheet} size="sm" onClick={() => toast.info('Item import wizard opened')}>Import File</Button>}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search source or file..." />}
      />
    </div>
  )
}
