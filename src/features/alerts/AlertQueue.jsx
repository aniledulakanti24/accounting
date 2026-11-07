import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BellRing, ShieldAlert } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import KpiCard from '../../components/ui/KpiCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { getAccountantAlerts } from '../../data/services/aiInsightService'
import { formatDate } from '../../lib/date'

const TYPE_META = {
  accountant: {
    title: 'Accountant Alerts',
    subtitle: 'Operational accounting work that needs attention today',
    breadcrumb: ['Alerts', 'Accountant Alerts'],
  },
  compliance: {
    title: 'Compliance Alerts',
    subtitle: 'GST, TDS, TCS, and statutory filing reminders',
    breadcrumb: ['Alerts', 'Compliance Alerts'],
  },
  risk: {
    title: 'Cash & Risk Alerts',
    subtitle: 'Cash dips, expense anomalies, and supplier exposure',
    breadcrumb: ['Alerts', 'Cash & Risk Alerts'],
  },
}

const SEVERITY_CLASS = {
  critical: 'text-[var(--neg)] font-semibold',
  high: 'text-[var(--neg)] font-medium',
  medium: 'text-[var(--warn)] font-medium',
  low: 'text-[var(--muted)]',
}

export default function AlertQueue({ type }) {
  const meta = TYPE_META[type] ?? TYPE_META.accountant
  const [search, setSearch] = useState('')
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    let mounted = true
    getAccountantAlerts({ type }).then((items) => {
      if (mounted) setAlerts(items)
    })
    return () => { mounted = false }
  }, [type])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return alerts
    return alerts.filter((alert) =>
      [alert.title, alert.message, alert.owner, alert.source, alert.action]
        .some((value) => value.toLowerCase().includes(term))
    )
  }, [alerts, search])

  const critical = alerts.filter((alert) => alert.severity === 'critical').length
  const high = alerts.filter((alert) => alert.severity === 'high').length

  const columns = [
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value) => <span className={SEVERITY_CLASS[value]}>{value}</span>,
    },
    {
      key: 'title',
      label: 'Alert',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{value}</p>
          <p className="text-xs text-[var(--muted)] max-w-xl">{row.message}</p>
        </div>
      ),
    },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    {
      key: 'dueDate',
      label: 'Due',
      sortable: true,
      render: (value) => <span className="tabular">{formatDate(value)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    { key: 'action', label: 'Suggested Action' },
  ]

  return (
    <div>
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        breadcrumb={meta.breadcrumb}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger">
        <KpiCard
          label="Open Alerts"
          value={String(alerts.length)}
          subline="Sorted by severity and due date"
          icon={BellRing}
          iconColor="#5b5bef"
        />
        <KpiCard
          label="Critical"
          value={String(critical)}
          subline="Needs immediate accountant action"
          icon={AlertTriangle}
          iconColor="#e11d48"
          sentiment="neg"
        />
        <KpiCard
          label="High Priority"
          value={String(high)}
          subline="Review before close or filing"
          icon={ShieldAlert}
          iconColor="#d97706"
          sentiment="warn"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={10}
        toolbar={
          <Filters
            search={search}
            onSearchChange={setSearch}
            placeholder="Search alerts, owner, source..."
          />
        }
      />
    </div>
  )
}
