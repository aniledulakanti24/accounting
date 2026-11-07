import { useEffect, useMemo, useState } from 'react'
import { KeyRound, Link2, ShieldCheck, UserPlus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import KpiCard from '../../components/ui/KpiCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatDate } from '../../lib/date'
import {
  createTemporaryCaAccess,
  getTemporaryCaAccess,
  revokeTemporaryCaAccess,
} from '../../data/services/aiInsightService'

const DEFAULT_SCOPE = ['GST Returns', 'Financial Statements', 'Audit Logs']

export default function CATemporaryAccess() {
  const [accessList, setAccessList] = useState([])

  useEffect(() => {
    let mounted = true
    getTemporaryCaAccess().then((items) => {
      if (mounted) setAccessList(items)
    })
    return () => { mounted = false }
  }, [])

  const activeCount = accessList.filter((access) => access.status === 'active').length
  const expiredCount = accessList.filter((access) => access.status === 'expired').length

  const latestLink = useMemo(() => {
    const active = accessList.find((access) => access.status === 'active')
    return active ? `https://accounting.unifiedtree.app/ca/${active.id.toLowerCase()}` : 'No active CA link'
  }, [accessList])

  async function addAccess() {
    const created = await createTemporaryCaAccess({
      caName: 'New CA Reviewer',
      email: 'reviewer@example.com',
      scope: DEFAULT_SCOPE,
      expiresInDays: 7,
    })
    setAccessList((items) => [created, ...items])
  }

  async function revokeAccess(row) {
    const revoked = await revokeTemporaryCaAccess(row.id)
    setAccessList((items) =>
      items.map((item) =>
        item.id === row.id ? { ...item, ...revoked } : item
      )
    )
  }

  const columns = [
    { key: 'caName', label: 'CA / Firm', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'scope',
      label: 'Scope',
      render: (value) => value.join(', '),
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      sortable: true,
      render: (value) => <span className="tabular">{formatDate(value)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="CA Temporary Access"
        subtitle="Generate time-boxed read-only access for chartered accountants"
        breadcrumb={['Alerts', 'CA Temporary Access']}
        action={
          <Button variant="primary" icon={UserPlus} onClick={addAccess}>
            Generate Access
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger">
        <KpiCard
          label="Active Links"
          value={String(activeCount)}
          subline="Read-only CA sessions"
          icon={KeyRound}
          iconColor="#16a34a"
          sentiment="pos"
        />
        <KpiCard
          label="Expired Links"
          value={String(expiredCount)}
          subline="No longer accessible"
          icon={ShieldCheck}
          iconColor="#8a93a3"
        />
        <KpiCard
          label="Latest Access Link"
          value={latestLink.includes('/ca/') ? 'Ready' : 'None'}
          subline={latestLink}
          icon={Link2}
          iconColor="#5b5bef"
        />
      </div>

      <DataTable
        columns={columns}
        data={accessList}
        pageSize={8}
        actions={(row) => (
          <Button
            size="sm"
            variant="danger"
            disabled={row.status !== 'active'}
            onClick={(event) => {
              event.stopPropagation()
              revokeAccess(row)
            }}
          >
            Revoke
          </Button>
        )}
      />
    </div>
  )
}
