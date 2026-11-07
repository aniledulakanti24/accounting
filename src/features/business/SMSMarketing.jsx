import { useState, useEffect, useMemo } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { getSMSCampaigns } from '../../data/services/businessToolsService'

function TypeChip({ type }) {
  const styles = type === 'Marketing' ? 'bg-[var(--primary-tint)] text-[var(--primary)]' : 'bg-[#fef3c7] text-[#92400e]'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{type}</span>
}

function StatusChip({ status }) {
  const map = {
    sent:      'bg-[var(--pos-tint)] text-[var(--pos)]',
    scheduled: 'bg-[var(--primary-tint)] text-[var(--primary)]',
    draft:     'bg-[var(--faint)] text-[var(--muted)]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{status}</span>
}

export default function SMSMarketing() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { getSMSCampaigns().then(d => { setCampaigns(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => campaigns.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.type.toLowerCase().includes(search.toLowerCase())
  ), [campaigns, search])

  const totalSent = campaigns.reduce((s, i) => s + i.sent, 0)
  const totalDelivered = campaigns.reduce((s, i) => s + i.delivered, 0)
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0.0'

  const kpis = [
    { label: 'Total Sent', value: totalSent, color: 'var(--text)' },
    { label: 'Delivery Rate', value: `${deliveryRate}%`, color: 'var(--pos)' },
    { label: 'Campaigns', value: campaigns.length, color: 'var(--primary)' },
  ]

  const columns = [
    { key: 'name', label: 'Campaign Name', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'type', label: 'Type', render: v => <TypeChip type={v} /> },
    { key: 'date', label: 'Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'recipients', label: 'Recipients', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v}</span> },
    { key: 'sent', label: 'Sent', align: 'center', render: v => <span className="tabular text-sm text-[var(--text)]">{v}</span> },
    { key: 'delivered', label: 'Delivered', align: 'center', render: v => <span className="tabular text-sm font-medium" style={{ color: 'var(--pos)' }}>{v}</span> },
    { key: 'failed', label: 'Failed', align: 'center', render: v => <span className={`tabular text-sm font-medium ${v > 0 ? 'text-[var(--neg)]' : 'text-[var(--faint)]'}`}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  return (
    <div>
      <PageHeader title="SMS Marketing" subtitle="Campaigns, reminders & bulk messaging" breadcrumb={['Business Tools', 'SMS Marketing']}
        action={<Button variant="primary" icon={MessageSquarePlus} size="sm">New Campaign</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        toolbar={<Filters search={search} onSearchChange={setSearch} placeholder="Search campaign…" />}
      />
    </div>
  )
}
