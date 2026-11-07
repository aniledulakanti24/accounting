const PAYROLL_FUNDING_REQUESTS = [
  {
    id: 'PAYROLL-2026-05',
    sourceModule: 'HR Payroll',
    payrollPeriod: 'May 2026',
    requestedBy: 'HR Manager',
    employees: 142,
    amount: 2780000,
    requestedOn: '2026-05-24',
    dueDate: '2026-05-31',
    status: 'pending',
    accountingImpact: 'Salary payable pending approval',
    suggestedEntry: 'Debit Salary Expense, Credit Salary Payable',
  },
  {
    id: 'PAYROLL-2026-04',
    sourceModule: 'HR Payroll',
    payrollPeriod: 'Apr 2026',
    requestedBy: 'HR Manager',
    employees: 139,
    amount: 3825000,
    requestedOn: '2026-04-24',
    dueDate: '2026-04-30',
    status: 'approved',
    accountingImpact: 'Ready for bank payment batch',
    suggestedEntry: 'Debit Salary Payable, Credit Bank',
  },
  {
    id: 'PAYROLL-2026-03',
    sourceModule: 'HR Payroll',
    payrollPeriod: 'Mar 2026',
    requestedBy: 'HR Manager',
    employees: 136,
    amount: 1820000,
    requestedOn: '2026-03-24',
    dueDate: '2026-03-31',
    status: 'paid',
    accountingImpact: 'Payment posted and reconciled',
    suggestedEntry: 'Debit Salary Payable, Credit Bank',
  },
  {
    id: 'PAYROLL-2026-BONUS',
    sourceModule: 'HR Payroll',
    payrollPeriod: 'FY 2025-26 Bonus',
    requestedBy: 'HR Director',
    employees: 58,
    amount: 0,
    requestedOn: '2026-05-20',
    dueDate: '2026-06-05',
    status: 'draft',
    accountingImpact: 'Awaiting final HR confirmation',
    suggestedEntry: 'Provision after HR finalizes bonus amount',
  },
]

export async function getPayrollFundingRequests() {
  return PAYROLL_FUNDING_REQUESTS.filter((request) => request.amount > 0)
}

export async function getPayrollFundingSummary() {
  const requests = await getPayrollFundingRequests()
  return requests.reduce((summary, request) => {
    summary.totalRequested += request.amount
    if (request.status === 'pending') summary.pendingAmount += request.amount
    if (request.status === 'approved') summary.approvedAmount += request.amount
    if (request.status === 'paid') summary.paidAmount += request.amount
    return summary
  }, {
    totalRequested: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
  })
}
