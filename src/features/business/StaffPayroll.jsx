import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { getStaff, getAttendance, getPayrollRuns } from '../../data/services/businessToolsService'

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'}`}>
      {children}
    </button>
  )
}

function StatusChip({ status }) {
  const map = {
    active: 'bg-[var(--pos-tint)] text-[var(--pos)]',
    resigned: 'bg-[var(--faint)] text-[var(--muted)]',
    paid: 'bg-[var(--pos-tint)] text-[var(--pos)]',
    pending: 'bg-[var(--primary-tint)] text-[var(--primary)]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-[var(--faint)] text-[var(--muted)]'}`}>{status}</span>
}

export default function StaffPayroll() {
  const [tab, setTab] = useState('staff')
  const [staff, setStaff] = useState([])
  const [attendance, setAttendance] = useState([])
  const [payrollRuns, setPayrollRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStaff(), getAttendance(), getPayrollRuns()]).then(([s, a, p]) => {
      setStaff(s); setAttendance(a); setPayrollRuns(p); setLoading(false)
    })
  }, [])

  const staffColumns = [
    { key: 'name', label: 'Name', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'dept', label: 'Department', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'designation', label: 'Designation', render: v => <span className="text-sm text-[var(--text)]">{v}</span> },
    { key: 'salary', label: 'Salary', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'joining', label: 'Joining Date', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
  ]

  const attendanceColumns = [
    { key: 'empName', label: 'Employee', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'month', label: 'Month', render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
    { key: 'workingDays', label: 'Working Days', align: 'center', render: v => <span className="tabular text-sm">{v}</span> },
    { key: 'present', label: 'Present', align: 'center', render: v => <span className="tabular text-sm text-[var(--pos)]">{v}</span> },
    { key: 'absent', label: 'Absent', align: 'center', render: v => <span className="tabular text-sm text-[var(--neg)]">{v}</span> },
    { key: 'leaves', label: 'Leaves', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v}</span> },
    { key: 'lop', label: 'LOP', align: 'center', render: v => <span className={`tabular text-sm ${v > 0 ? 'text-[var(--warn)]' : 'text-[var(--faint)]'}`}>{v}</span> },
  ]

  const payrollColumns = [
    { key: 'month', label: 'Month', render: v => <span className="font-medium text-[var(--text)]">{v}</span> },
    { key: 'employees', label: 'Employees', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v}</span> },
    { key: 'gross', label: 'Gross', align: 'right', sortable: true, render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(v)}</span> },
    { key: 'pf', label: 'PF', align: 'right', render: v => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(v)}</span> },
    { key: 'tds', label: 'TDS', align: 'right', render: v => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(v)}</span> },
    { key: 'netPay', label: 'Net Pay', align: 'right', render: v => <span className="tabular text-sm font-bold text-[var(--pos)]">{formatCurrency(v)}</span> },
    { key: 'status', label: 'Status', render: v => <StatusChip status={v} /> },
    { key: 'paidOn', label: 'Paid On', render: v => <span className="text-sm text-[var(--muted)]">{v ?? '—'}</span> },
  ]

  return (
    <div>
      <PageHeader title="Staff Attendance & Payroll" subtitle="Employee management, attendance & payroll processing" breadcrumb={['Business Tools', 'Staff Attendance & Payroll']} />
      <div className="flex gap-1 border-b border-[var(--border)] mb-5">
        <TabButton active={tab === 'staff'} onClick={() => setTab('staff')}>Staff</TabButton>
        <TabButton active={tab === 'attendance'} onClick={() => setTab('attendance')}>Attendance</TabButton>
        <TabButton active={tab === 'payroll'} onClick={() => setTab('payroll')}>Payroll Runs</TabButton>
      </div>

      {tab === 'staff' && <DataTable columns={staffColumns} data={staff} loading={loading} rowKey="id" />}
      {tab === 'attendance' && <DataTable columns={attendanceColumns} data={attendance} loading={loading} rowKey="id" />}
      {tab === 'payroll' && (
        <DataTable columns={payrollColumns} data={payrollRuns} loading={loading} rowKey="id"
          toolbar={<div className="flex justify-end"><Button variant="primary" icon={Play} size="sm">Run Payroll</Button></div>}
        />
      )}
    </div>
  )
}
