import { useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  TrendingUp,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import PeriodSelector from '../../components/ui/PeriodSelector'
import KpiCard from '../../components/ui/KpiCard'
import DataTable from '../../components/ui/DataTable'
import Panel from '../../components/ui/Panel'
import TrendChart from '../../components/charts/TrendChart'
import { formatCompact, formatCurrency } from '../../lib/currency'
import { currentFYYear, fyLabel } from '../../lib/fy'
import { useAppStore } from '../../store/useAppStore'

const MONTHLY_CASH_FLOW = [
  { label: 'Apr', inflow: 4200000, outflow: 3100000, projected: 1050000, actual: 1100000 },
  { label: 'May', inflow: 5800000, outflow: 3800000, projected: 1760000, actual: 2000000 },
  { label: 'Jun', inflow: 3900000, outflow: 4200000, projected: 220000, actual: -300000 },
  { label: 'Jul', inflow: 6700000, outflow: 3600000, projected: 2600000, actual: 3100000 },
  { label: 'Aug', inflow: 7200000, outflow: 4100000, projected: 2820000, actual: 3100000 },
  { label: 'Sep', inflow: 5500000, outflow: 3900000, projected: 1500000, actual: 1600000 },
  { label: 'Oct', inflow: 8100000, outflow: 4800000, projected: 3000000, actual: 3300000 },
  { label: 'Nov', inflow: 6300000, outflow: 5200000, projected: 1250000, actual: 1100000 },
  { label: 'Dec', inflow: 9400000, outflow: 5600000, projected: 3350000, actual: 3800000 },
  { label: 'Jan', inflow: 7600000, outflow: 4900000, projected: 2700000, actual: 0 },
  { label: 'Feb', inflow: 6900000, outflow: 5200000, projected: 1700000, actual: 0 },
  { label: 'Mar', inflow: 8800000, outflow: 6100000, projected: 2700000, actual: 0 },
]

const UPCOMING_MOVES = [
  { id: 'CF-001', date: '2025-01-05', type: 'Inflow', party: 'Infosys BPO Ltd', category: 'Receivable', amount: 1250000, confidence: 'High' },
  { id: 'CF-002', date: '2025-01-07', type: 'Outflow', party: 'AWS India', category: 'Cloud bill', amount: -485000, confidence: 'High' },
  { id: 'CF-003', date: '2025-01-10', type: 'Inflow', party: 'Wipro Digital', category: 'Receivable', amount: 790000, confidence: 'Medium' },
  { id: 'CF-004', date: '2025-01-15', type: 'Outflow', party: 'Payroll batch', category: 'Salary', amount: -1820000, confidence: 'High' },
  { id: 'CF-005', date: '2025-01-20', type: 'Outflow', party: 'Tax authority portal', category: 'Tax payment', amount: -890000, confidence: 'High' },
]

const columns = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'party', label: 'Party', sortable: true },
  { key: 'category', label: 'Category' },
  {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    sortable: true,
    render: (value) => (
      <span className={value < 0 ? 'text-[var(--neg)]' : 'text-[var(--pos)]'}>
        {formatCurrency(value)}
      </span>
    ),
  },
  { key: 'confidence', label: 'Confidence', sortable: true },
]

export default function DashboardCashFlow() {
  const { financialYear, activeCompany } = useAppStore()
  const fy = financialYear ?? currentFYYear()
  const [period, setPeriod] = useState({
    mode: 'year',
    value: fy,
    from: new Date(fy, 3, 1),
    to: new Date(fy + 1, 2, 31),
  })

  const totalInflow = MONTHLY_CASH_FLOW.reduce((sum, row) => sum + row.inflow, 0)
  const totalOutflow = MONTHLY_CASH_FLOW.reduce((sum, row) => sum + row.outflow, 0)
  const netMovement = totalInflow - totalOutflow
  const projectedClose = 12650000 + MONTHLY_CASH_FLOW.slice(9).reduce((sum, row) => sum + row.projected, 0)

  return (
    <div>
      <PageHeader
        title="Cash Flow"
        subtitle={`${fyLabel(fy)} - ${activeCompany?.name}`}
        breadcrumb={['Dashboard', 'Cash Flow']}
      >
        <PeriodSelector value={period} onChange={setPeriod} fyYear={fy} />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 stagger">
        <KpiCard
          label="Total Inflow"
          value={formatCompact(totalInflow)}
          delta={14.8}
          sentiment="pos"
          subline="Apr to Mar forecast"
          icon={ArrowDownCircle}
          iconColor="#16a34a"
        />
        <KpiCard
          label="Total Outflow"
          value={formatCompact(totalOutflow)}
          delta={6.2}
          sentiment="neg"
          subline="Committed plus recurring"
          icon={ArrowUpCircle}
          iconColor="#e11d48"
        />
        <KpiCard
          label="Net Movement"
          value={formatCompact(netMovement)}
          delta={9.7}
          sentiment="pos"
          subline="Operating cash surplus"
          icon={TrendingUp}
          iconColor="#5b5bef"
        />
        <KpiCard
          label="Projected Close"
          value={formatCompact(projectedClose)}
          subline="Expected at FY close"
          icon={Landmark}
          iconColor="#d97706"
          sentiment="warn"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <Panel>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Monthly Movement</h3>
              <p className="text-xs text-[var(--muted)]">Inflow and outflow across the financial year</p>
            </div>
          </div>
          <TrendChart
            data={MONTHLY_CASH_FLOW}
            series={[
              { key: 'inflow', label: 'Inflow', color: 'var(--pos)' },
              { key: 'outflow', label: 'Outflow', color: 'var(--neg)' },
            ]}
            type="bar"
            height={260}
          />
        </Panel>
      </div>

      <DataTable
        columns={columns}
        data={UPCOMING_MOVES}
        pageSize={5}
        className="h-full"
      />
      </div>
  )
}
