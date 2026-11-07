import { useMemo, useState, useEffect } from 'react'
import { FileCheck2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'
import { currentFYYear, fyLabel } from '../../lib/fy'
import { formatDate } from '../../lib/date'

const COUNTRY_DEADLINES = {
  IN: [
    { id: 'TAX-IN-001', dueDate: '2025-01-11', form: 'GSTR-1 Outward Supplies', category: 'GST', period: 'Dec 2024', owner: 'Tax Team', status: 'pending', priority: 'High' },
    { id: 'TAX-IN-002', dueDate: '2025-01-20', form: 'GSTR-3B Summary Return', category: 'GST', period: 'Dec 2024', owner: 'Tax Team', status: 'pending', priority: 'High' },
    { id: 'TAX-IN-003', dueDate: '2025-01-30', form: 'TDS Payment (Challan 281)', category: 'TDS', period: 'Q3 FY 2024-25', owner: 'Payroll', status: 'open', priority: 'Medium' },
    { id: 'TAX-IN-004', dueDate: '2025-01-31', form: 'TCS Statement (Form 27EQ)', category: 'TCS', period: 'Q3 FY 2024-25', owner: 'Compliance', status: 'open', priority: 'Medium' },
    { id: 'TAX-IN-005', dueDate: '2025-02-10', form: 'E-Way Bill Audit', category: 'E-Way', period: 'Jan 2025', owner: 'Operations', status: 'open', priority: 'Low' },
    { id: 'TAX-IN-006', dueDate: '2025-02-15', form: 'GSTR-2B ITC Matching', category: 'GST', period: 'Jan 2025', owner: 'CA Office', status: 'open', priority: 'Medium' },
    { id: 'TAX-IN-007', dueDate: '2025-03-15', form: 'Advance Tax 4th Installment', category: 'Income Tax', period: 'FY 2024-25', owner: 'Finance Lead', status: 'open', priority: 'High' },
  ],
  US: [
    { id: 'TAX-US-001', dueDate: '2025-01-20', form: 'State Sales & Use Tax Return', category: 'Sales Tax', period: 'Dec 2024', owner: 'Tax Compliance', status: 'pending', priority: 'High' },
    { id: 'TAX-US-002', dueDate: '2025-01-31', form: 'Form 1099-NEC (Contractors)', category: '1099 Withholding', period: 'CY 2024', owner: 'Accounts Payable', status: 'pending', priority: 'High' },
    { id: 'TAX-US-003', dueDate: '2025-01-31', form: 'Form 941 (Quarterly Payroll Tax)', category: 'Federal Tax', period: 'Q4 2024', owner: 'Payroll', status: 'open', priority: 'High' },
    { id: 'TAX-US-004', dueDate: '2025-02-15', form: 'Resale Exemption Certificate Audit', category: 'Sales Tax', period: 'Q1 2025', owner: 'Finance Team', status: 'open', priority: 'Medium' },
    { id: 'TAX-US-005', dueDate: '2025-02-28', form: 'County & City Local Tax Remittance', category: 'Local Tax', period: 'Jan 2025', owner: 'Tax Lead', status: 'open', priority: 'Medium' },
    { id: 'TAX-US-006', dueDate: '2025-03-15', form: 'Form 1120 / Corporate Tax Extension', category: 'IRS Income Tax', period: 'CY 2024', owner: 'CPA Advisor', status: 'open', priority: 'High' },
  ],
  GB: [
    { id: 'TAX-GB-001', dueDate: '2025-01-07', form: 'HMRC MTD VAT Return (9-Box)', category: 'MTD VAT', period: 'Nov 2024 Period', owner: 'Tax Lead', status: 'pending', priority: 'High' },
    { id: 'TAX-GB-002', dueDate: '2025-01-19', form: 'PAYE / NIC Electronic Payment', category: 'Payroll', period: 'Month 9 (Dec)', owner: 'Payroll', status: 'pending', priority: 'High' },
    { id: 'TAX-GB-003', dueDate: '2025-01-21', form: 'EC Sales List & Reverse Charge Audit', category: 'VAT Compliance', period: 'Q4 2024', owner: 'Accountant', status: 'open', priority: 'Medium' },
    { id: 'TAX-GB-004', dueDate: '2025-01-31', form: 'Self Assessment / Statutory Review', category: 'HMRC Tax', period: '2023-24', owner: 'Chartered Accountant', status: 'open', priority: 'High' },
    { id: 'TAX-GB-005', dueDate: '2025-02-07', form: 'HMRC MTD VAT Return & Direct Debit', category: 'MTD VAT', period: 'Dec 2024 Period', owner: 'Tax Lead', status: 'open', priority: 'High' },
  ],
  AE: [
    { id: 'TAX-AE-001', dueDate: '2025-01-28', form: 'FTA VAT 201 Quarterly Return', category: 'FTA VAT', period: 'Q4 2024', owner: 'Tax Specialist', status: 'pending', priority: 'High' },
    { id: 'TAX-AE-002', dueDate: '2025-01-31', form: 'Customs Bill of Entry BOE Matching', category: 'Customs', period: 'Dec 2024', owner: 'Logistics Lead', status: 'open', priority: 'Medium' },
    { id: 'TAX-AE-003', dueDate: '2025-02-15', form: 'Emirate-Wise Sales Allocation Review', category: 'FTA VAT', period: 'Jan 2025', owner: 'Finance Lead', status: 'open', priority: 'Medium' },
    { id: 'TAX-AE-004', dueDate: '2025-03-31', form: 'Corporate Tax Registration & Audit', category: 'Corporate Tax', period: 'FY 2024', owner: 'Tax Consultant', status: 'open', priority: 'High' },
  ],
}

export default function DashboardTaxCalendar() {
  const { financialYear, activeCompany } = useAppStore()
  const fy = financialYear ?? currentFYYear()
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const initialDeadlines = COUNTRY_DEADLINES[countryCode] || COUNTRY_DEADLINES.IN
  const [deadlines, setDeadlines] = useState(initialDeadlines)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setDeadlines(COUNTRY_DEADLINES[countryCode] || COUNTRY_DEADLINES.IN)
  }, [countryCode])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return deadlines
    return deadlines.filter((item) =>
      [item.form, item.category, item.period, item.owner, item.priority]
        .some((value) => value.toLowerCase().includes(term))
    )
  }, [deadlines, search])

  function markComplete(row) {
    setDeadlines((items) =>
      items.map((item) =>
        item.id === row.id ? { ...item, status: 'closed' } : item
      )
    )
  }

  const columns = [
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value) => <span className="tabular">{formatDate(value)}</span>,
    },
    { key: 'form', label: 'Compliance Requirement', sortable: true },
    { key: 'category', label: `${countryConfig.taxSystem} Authority / Category`, sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value) => (
        <span className={value === 'High' ? 'text-[var(--neg)] font-medium' : 'text-[var(--muted)]'}>
          {value}
        </span>
      ),
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
        title={`${countryConfig.taxSystem} & Statutory Calendar`}
        subtitle={`${fyLabel(fy)} · ${activeCompany?.name || 'UnifiedTree Entity'} (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={['Dashboard', 'Tax Calendar']}
      />

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={7}
        toolbar={
          <Filters
            search={search}
            onSearchChange={setSearch}
            placeholder={`Search ${countryConfig.taxSystem} filing, owner, period...`}
          />
        }
        actions={(row) => (
          <Button
            size="sm"
            variant={row.status === 'closed' ? 'ghost' : 'secondary'}
            icon={FileCheck2}
            disabled={row.status === 'closed'}
            onClick={(event) => {
              event.stopPropagation()
              markComplete(row)
            }}
          >
            {row.status === 'closed' ? 'Done' : 'Mark'}
          </Button>
        )}
      />
    </div>
  )
}
