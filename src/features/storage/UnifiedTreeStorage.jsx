import { useState } from 'react'
import { Download, Archive, Database, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

const SYSTEM_FILES = [
  { id: 'SF001', name: 'Auto-Backup 2026-01-06.zip',     type: 'Backup', size: '45 MB',   date: '2026-01-06', status: 'complete' },
  { id: 'SF002', name: 'Auto-Backup 2026-01-05.zip',     type: 'Backup', size: '44 MB',   date: '2026-01-05', status: 'complete' },
  { id: 'SF003', name: 'GSTR-1 Export Dec 2025.json',    type: 'JSON',   size: '128 KB',  date: '2026-01-10', status: 'complete' },
  { id: 'SF004', name: 'E-Invoice Batch Dec.xml',         type: 'XML',    size: '256 KB',  date: '2025-12-18', status: 'complete' },
]

function TypeChip({ type }) {
  const map = {
    Backup: 'bg-[var(--primary-tint)] text-[var(--primary)]',
    JSON:   'bg-[#fef3c7] text-[#92400e]',
    XML:    'bg-[#ede9fe] text-[#6d28d9]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[type] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{type}</span>
}

function FileIcon({ type }) {
  if (type === 'Backup') return <Archive size={16} className="text-[var(--primary)]" />
  if (type === 'JSON') return <Database size={16} className="text-[#92400e]" />
  return <Database size={16} className="text-[#6d28d9]" />
}

export default function UnifiedTreeStorage() {
  const kpis = [
    { label: 'System Files', value: '4 Files', color: 'var(--text)' },
    { label: 'Used', value: '89.4 MB', color: 'var(--primary)' },
    { label: 'Auto-backup', value: 'Daily', color: 'var(--pos)' },
  ]

  return (
    <div>
      <PageHeader title="UnifiedTree Storage" subtitle="System-generated exports, backups & documents" breadcrumb={['Storage', 'UnifiedTree Storage']} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--primary-tint)] border border-[var(--primary)] border-opacity-20 rounded-[var(--radius-sm)] px-4 py-3 mb-5 flex items-center gap-3">
        <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0" />
        <p className="text-sm text-[var(--primary)]">
          <span className="font-semibold">Auto-backup is active.</span> Next backup scheduled: <span className="font-mono font-medium">2026-01-07 02:00 AM IST</span>
        </p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text)]">System Files</h3>
          <Button variant="secondary" icon={Download} size="sm">Download All</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
              {['File Name', 'Type', 'Size', 'Generated', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {SYSTEM_FILES.map(file => (
              <tr key={file.id} className="hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileIcon type={file.type} />
                    <span className="font-medium text-[var(--text)]">{file.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><TypeChip type={file.type} /></td>
                <td className="px-4 py-3 tabular text-[var(--muted)]">{file.size}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{file.date}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--pos-tint)] text-[var(--pos)]">
                    <CheckCircle2 size={11} />
                    {file.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 rounded hover:bg-[var(--faint)] text-[var(--primary)] transition-colors" title="Download"><Download size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
