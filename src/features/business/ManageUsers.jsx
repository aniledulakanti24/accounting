import { useState, useEffect, useMemo } from 'react'
import { UserPlus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { getSystemUsers } from '../../data/services/businessToolsService'

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>{initials}</div>
      <span className="font-medium text-[var(--text)]">{name}</span>
    </div>
  )
}

function RoleChip({ role }) {
  const map = {
    'Super Admin':       'bg-[var(--neg-tint)] text-[var(--neg)]',
    'Finance Lead':      'bg-[var(--primary-tint)] text-[var(--primary)]',
    'Senior Accountant': 'bg-[var(--primary-tint)] text-[var(--primary)]',
    'Accountant':        'bg-[var(--faint)] text-[var(--muted)]',
    'CA / Auditor':      'bg-[#ede9fe] text-[#6d28d9]',
    'Viewer (Branch)':   'bg-[var(--faint)] text-[var(--muted)]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[role] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{role}</span>
}

function StatusChip({ status }) {
  const styles = status === 'active' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[#fef3c7] text-[#92400e]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{status === 'temp' ? 'Temp Access' : status}</span>
}

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { getSystemUsers().then(d => { setUsers(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => users.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.email.toLowerCase().includes(search.toLowerCase()) || i.role.toLowerCase().includes(search.toLowerCase())
  ), [users, search])

  const activeCount = users.filter(i => i.status === 'active').length
  const tempCount = users.filter(i => i.status === 'temp').length

  const kpis = [
    { label: 'Active Users', value: activeCount, color: 'var(--pos)' },
    { label: 'Temp Access', value: tempCount, color: 'var(--warn)' },
  ]

  const columns = [
    { key: 'name', label: 'User', render: v => <Avatar name={v} /> },
    { key: 'email', label: 'Email', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'role', label: 'Role', render: v => <RoleChip role={v} /> },
    { key: 'lastLogin', label: 'Last Login', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="Manage Users" subtitle="System access & role management" breadcrumb={['Business Tools', 'Manage Users']}
        action={<Button variant="primary" icon={UserPlus} size="sm">Invite User</Button>}
      />
      <div className="grid grid-cols-2 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search user, email or role…" />}
      />
    </div>
  )
}
