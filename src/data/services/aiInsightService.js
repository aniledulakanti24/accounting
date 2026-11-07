const BASE_ALERTS = [
  {
    id: 'ALT-001',
    type: 'accountant',
    severity: 'critical',
    title: 'Collections follow-up needed',
    message: '7 invoices are overdue by more than 30 days. Prioritize Infosys BPO and Wipro Digital.',
    owner: 'Accountant',
    source: 'Receivables',
    dueDate: '2025-01-03',
    status: 'open',
    action: 'Open ageing report',
  },
  {
    id: 'ALT-002',
    type: 'accountant',
    severity: 'high',
    title: 'Bank reconciliation gap',
    message: '12 bank statement lines are unmatched against system vouchers.',
    owner: 'Accountant',
    source: 'Cash & Bank',
    dueDate: '2025-01-04',
    status: 'open',
    action: 'Review reconciliation',
  },
  {
    id: 'ALT-003',
    type: 'accountant',
    severity: 'medium',
    title: 'Draft journals pending posting',
    message: '4 journal vouchers are still in draft and affect month-end reporting.',
    owner: 'Accountant',
    source: 'Expenses & Journals',
    dueDate: '2025-01-05',
    status: 'open',
    action: 'Post journals',
  },
  {
    id: 'ALT-004',
    type: 'compliance',
    severity: 'critical',
    title: 'GSTR-1 filing approaching',
    message: 'December GSTR-1 is due on 11 Jan. Sales register validation is incomplete.',
    owner: 'Accountant',
    source: 'Tax Center',
    dueDate: '2025-01-11',
    status: 'open',
    action: 'Prepare GSTR-1',
  },
  {
    id: 'ALT-005',
    type: 'compliance',
    severity: 'high',
    title: 'GSTR-3B liability review',
    message: 'GST payable is estimated at Rs 8.9L. Confirm ITC reconciliation before filing.',
    owner: 'CA',
    source: 'Tax Center',
    dueDate: '2025-01-20',
    status: 'open',
    action: 'Review GSTR-3B',
  },
  {
    id: 'ALT-006',
    type: 'compliance',
    severity: 'medium',
    title: 'TDS challan verification',
    message: 'Q3 TDS challan details need verification before return preparation.',
    owner: 'Accountant',
    source: 'Tax Center',
    dueDate: '2025-01-30',
    status: 'open',
    action: 'Verify challans',
  },
  {
    id: 'ALT-007',
    type: 'risk',
    severity: 'high',
    title: 'Large payment scheduled',
    message: 'Payroll and GST outflows create a Rs 27.1L cash dip in the next 15 days.',
    owner: 'Finance Lead',
    source: 'Cash Flow',
    dueDate: '2025-01-15',
    status: 'open',
    action: 'Review cash forecast',
  },
  {
    id: 'ALT-008',
    type: 'risk',
    severity: 'medium',
    title: 'Expense spike detected',
    message: 'Cloud infrastructure expense is 18% above the trailing 3-month average.',
    owner: 'Accountant',
    source: 'Expenses',
    dueDate: '2025-01-08',
    status: 'open',
    action: 'Inspect expense center',
  },
  {
    id: 'ALT-009',
    type: 'risk',
    severity: 'low',
    title: 'Supplier advance aging',
    message: 'Two supplier advances have not been adjusted against bills after 45 days.',
    owner: 'Accountant',
    source: 'Payables',
    dueDate: '2025-01-18',
    status: 'open',
    action: 'Review advances',
  },
]

const BASE_CA_ACCESS = [
  {
    id: 'CA-001',
    caName: 'Rao & Iyer Associates',
    email: 'audit@raoiyer.example',
    scope: ['GST Returns', 'Financial Statements', 'Audit Logs'],
    createdAt: '2024-12-28',
    expiresAt: '2025-01-12',
    status: 'active',
  },
  {
    id: 'CA-002',
    caName: 'Kumar Tax Office',
    email: 'gst@kumartax.example',
    scope: ['GST Reconciliation'],
    createdAt: '2024-11-10',
    expiresAt: '2024-11-17',
    status: 'expired',
  },
]

function severityRank(severity) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[severity] ?? 0
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

export async function getAccountantAlerts({ type } = {}) {
  const alerts = type ? BASE_ALERTS.filter((alert) => alert.type === type) : BASE_ALERTS
  return [...alerts].sort((a, b) => {
    const severity = severityRank(b.severity) - severityRank(a.severity)
    if (severity !== 0) return severity
    return a.dueDate.localeCompare(b.dueDate)
  })
}

export async function getAiDashboardInsights() {
  const alerts = await getAccountantAlerts()
  const critical = alerts.filter((alert) => alert.severity === 'critical').length
  const high = alerts.filter((alert) => alert.severity === 'high').length
  const suggestions = alerts.slice(0, 5).map((alert) => ({
    id: `AI-${alert.id}`,
    severity: alert.severity,
    title: alert.title,
    suggestion: alert.message,
    action: alert.action,
    source: alert.source,
  }))

  return {
    summary: {
      openAlerts: alerts.length,
      critical,
      high,
      confidence: 86,
    },
    narrative: 'AI reviewed receivables, cash flow, tax calendar, and voucher status to prioritize today\'s accounting work.',
    suggestions,
  }
}

export async function getTemporaryCaAccess() {
  return [...BASE_CA_ACCESS]
}

export async function createTemporaryCaAccess({
  caName,
  email = 'ca@example.com',
  scope,
  expiresInDays = 7,
}) {
  return {
    id: `CA-${Date.now()}`,
    caName,
    email,
    scope,
    createdAt: new Date().toISOString().slice(0, 10),
    expiresAt: addDays(new Date(), expiresInDays),
    status: 'active',
  }
}

export async function revokeTemporaryCaAccess(id) {
  return {
    id,
    status: 'revoked',
    revokedAt: new Date().toISOString().slice(0, 10),
  }
}
