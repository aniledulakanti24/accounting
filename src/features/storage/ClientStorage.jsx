import { useState } from 'react'
import { Upload, Download, Trash2, FileText, FileSpreadsheet, File } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

const MOCK_FILES = [
  { id: 'F001', name: 'Audit Report FY25.pdf',       type: 'PDF',   size: '2.4 MB',  by: 'CA Suresh', date: '2026-01-04' },
  { id: 'F002', name: 'Bank Statement Dec.xlsx',      type: 'Excel', size: '156 KB',  by: 'Rahul M',   date: '2026-01-05' },
  { id: 'F003', name: 'GSTR-3B Dec 2025.pdf',        type: 'PDF',   size: '340 KB',  by: 'Priya S',   date: '2026-01-20' },
  { id: 'F004', name: 'Balance Sheet Q3.pdf',         type: 'PDF',   size: '890 KB',  by: 'Priya S',   date: '2025-12-31' },
]

function FileIcon({ type }) {
  if (type === 'Excel') return <FileSpreadsheet size={16} className="text-[#15803d]" />
  if (type === 'PDF') return <FileText size={16} className="text-[var(--neg)]" />
  return <File size={16} className="text-[var(--muted)]" />
}

function TypeChip({ type }) {
  const map = {
    PDF:   'bg-[var(--neg-tint)] text-[var(--neg)]',
    Excel: 'bg-[#dcfce7] text-[#15803d]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[type] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{type}</span>
}

export default function ClientStorage() {
  const [dragging, setDragging] = useState(false)

  const kpis = [
    { label: 'Files', value: '4 Files', color: 'var(--text)' },
    { label: 'Used', value: '3.9 MB', color: 'var(--primary)' },
    { label: 'Limit', value: '10 GB', color: 'var(--muted)' },
  ]

  return (
    <div>
      <PageHeader title="Client Storage" subtitle="Upload & manage client documents" breadcrumb={['Storage', 'Client Storage']}
        action={<Button variant="primary" icon={Upload} size="sm">Upload File</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false) }}
        className={`border-2 border-dashed rounded-[var(--radius)] p-8 mb-5 text-center transition-colors cursor-pointer ${dragging ? 'border-[var(--primary)] bg-[var(--primary-tint)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}
      >
        <Upload size={24} className="mx-auto mb-2 text-[var(--muted)]" />
        <p className="text-sm font-medium text-[var(--text)]">Drop files here or click to upload</p>
        <p className="text-xs text-[var(--muted)] mt-1">PDF, Excel, Word, Images up to 50 MB</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">Uploaded Files</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
              {['File Name', 'Type', 'Size', 'Uploaded By', 'Date', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {MOCK_FILES.map(file => (
              <tr key={file.id} className="hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileIcon type={file.type} />
                    <span className="font-medium text-[var(--text)]">{file.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><TypeChip type={file.type} /></td>
                <td className="px-4 py-3 tabular text-[var(--muted)]">{file.size}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{file.by}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{file.date}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 rounded hover:bg-[var(--faint)] text-[var(--primary)] transition-colors" title="Download"><Download size={14} /></button>
                    <button className="p-1 rounded hover:bg-[var(--neg-tint)] text-[var(--neg)] transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
