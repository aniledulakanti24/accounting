/* ── Expenses & Journals service — mock data ── */

export const EXPENSES = [
  { id:'EX001', ref:'EXP-2526-0088', date:'2026-01-06', category:'Travel',          desc:'Flight — Mumbai to Delhi (client)',  vendor:'IndiGo Airlines',    amount:8500,  gst:0,    total:8500,  paidBy:'Priya S',     mode:'Card',   status:'approved' },
  { id:'EX002', ref:'EXP-2526-0085', date:'2026-01-05', category:'Office Supplies', desc:'Stationery and printer cartridges',  vendor:'Staples India',      amount:3200,  gst:576,  total:3776,  paidBy:'Rahul M',     mode:'Cash',   status:'approved' },
  { id:'EX003', ref:'EXP-2526-0082', date:'2026-01-04', category:'Software',        desc:'Adobe CC — monthly subscription',    vendor:'Adobe Systems',      amount:4237,  gst:763,  total:5000,  paidBy:'Company Card',mode:'Card',   status:'approved' },
  { id:'EX004', ref:'EXP-2526-0079', date:'2026-01-03', category:'Travel',          desc:'Taxi — airport transfer (outstation)',vendor:'Ola Corporate',     amount:1500,  gst:0,    total:1500,  paidBy:'Ankit R',     mode:'UPI',    status:'pending'  },
  { id:'EX005', ref:'EXP-2526-0075', date:'2025-12-31', category:'Repairs',         desc:'AC service — server room',           vendor:'CoolTech Services',  amount:8475,  gst:1525, total:10000, paidBy:'Finance',     mode:'NEFT',   status:'approved' },
  { id:'EX006', ref:'EXP-2526-0070', date:'2025-12-28', category:'Marketing',       desc:'Google Ads — Dec 2025',              vendor:'Google India Pvt',   amount:42373, gst:7627, total:50000, paidBy:'Company Card',mode:'Card',   status:'approved' },
  { id:'EX007', ref:'EXP-2526-0065', date:'2025-12-20', category:'Professional',    desc:'CA audit fees — Q3 FY26',            vendor:'Mehta & Associates', amount:42373, gst:7627, total:50000, paidBy:'Finance',     mode:'Cheque', status:'approved' },
  { id:'EX008', ref:'EXP-2526-0060', date:'2025-12-15', category:'Utilities',       desc:'Internet — Dec 2025 (Airtel)',       vendor:'Airtel Business',    amount:23729, gst:4271, total:28000, paidBy:'Finance',     mode:'NEFT',   status:'approved' },
]
export function getExpenses() { return Promise.resolve([...EXPENSES]) }

export const EXPENSE_CATEGORIES = [
  { id:'CAT001', name:'Travel',          parent:null,      ledger:'Travel & Conveyance', budget:200000, used:145000, txns:28 },
  { id:'CAT002', name:'Office Supplies', parent:null,      ledger:'Office Expenses',     budget:50000,  used:38000,  txns:15 },
  { id:'CAT003', name:'Software',        parent:null,      ledger:'Software & Licenses', budget:150000, used:125000, txns:12 },
  { id:'CAT004', name:'Marketing',       parent:null,      ledger:'Marketing Expenses',  budget:500000, used:420000, txns:8  },
  { id:'CAT005', name:'Professional',    parent:null,      ledger:'Professional Fees',   budget:300000, used:180000, txns:6  },
  { id:'CAT006', name:'Utilities',       parent:null,      ledger:'Utilities',           budget:100000, used:88000,  txns:20 },
  { id:'CAT007', name:'Repairs',         parent:null,      ledger:'Repairs & Maintenance',budget:80000, used:42000,  txns:5  },
  { id:'CAT008', name:'Air Travel',      parent:'Travel',  ledger:'Travel & Conveyance', budget:100000, used:95000,  txns:10 },
  { id:'CAT009', name:'Local Travel',    parent:'Travel',  ledger:'Travel & Conveyance', budget:50000,  used:32000,  txns:18 },
]
export function getExpenseCategories() { return Promise.resolve([...EXPENSE_CATEGORIES]) }

export const AUTOMATED_BILLS = [
  { id:'AB001', desc:'Office Rent — Mumbai HO',    vendor:'Space Landlord',     amount:180000, frequency:'Monthly', nextDue:'2026-02-01', lastPosted:'2026-01-01', status:'active' },
  { id:'AB002', desc:'AWS Cloud Services',         vendor:'Amazon Web Services', amount:85000,  frequency:'Monthly', nextDue:'2026-02-05', lastPosted:'2026-01-05', status:'active' },
  { id:'AB003', desc:'Airtel Internet & Phone',    vendor:'Airtel Business',    amount:28000,  frequency:'Monthly', nextDue:'2026-02-05', lastPosted:'2026-01-05', status:'active' },
  { id:'AB004', desc:'Sodexo Cafeteria',           vendor:'Sodexo India',       amount:65000,  frequency:'Monthly', nextDue:'2026-02-01', lastPosted:'2026-01-01', status:'active' },
  { id:'AB005', desc:'Adobe Creative Cloud',       vendor:'Adobe Systems',      amount:5000,   frequency:'Monthly', nextDue:'2026-02-04', lastPosted:'2026-01-04', status:'active' },
  { id:'AB006', desc:'Annual Fire Insurance',      vendor:'ICICI Lombard',      amount:24000,  frequency:'Annual',  nextDue:'2026-04-01', lastPosted:'2025-04-01', status:'active' },
]
export function getAutomatedBills() { return Promise.resolve([...AUTOMATED_BILLS]) }

export const JOURNAL_VOUCHERS = [
  { id:'JV001', ref:'JV-2026-048', date:'2026-01-06', narration:'Depreciation — Jan 2026 (WDV method)', entries:[{account:'Depreciation A/c',dr:125000,cr:0},{account:'Fixed Assets A/c',dr:0,cr:125000}], status:'posted',  postedBy:'Finance Lead' },
  { id:'JV002', ref:'JV-2026-045', date:'2026-01-04', narration:'Provision for bad debts — Q3 FY26',    entries:[{account:'Bad Debts A/c',dr:85000,cr:0},{account:'Provision for Doubtful Debts',dr:0,cr:85000}],   status:'posted',  postedBy:'Finance Lead' },
  { id:'JV003', ref:'JV-2026-042', date:'2025-12-31', narration:'Salary payable provision — Dec 2025',  entries:[{account:'Salary Expenses',dr:2800000,cr:0},{account:'Salary Payable',dr:0,cr:2800000}],           status:'posted',  postedBy:'Finance Lead' },
  { id:'JV004', ref:'JV-2026-040', date:'2025-12-31', narration:'Prepaid insurance adjustment',         entries:[{account:'Prepaid Insurance',dr:12000,cr:0},{account:'Insurance Premium',dr:0,cr:12000}],          status:'posted',  postedBy:'Accountant'   },
  { id:'JV005', ref:'JV-2026-038', date:'2025-12-28', narration:'Accrued interest on FD — Q3',         entries:[{account:'Interest Receivable',dr:45000,cr:0},{account:'Interest Income',dr:0,cr:45000}],           status:'posted',  postedBy:'Accountant'   },
  { id:'JV006', ref:'JV-2026-035', date:'2025-12-20', narration:'GST output adjustment — Nov 2025',    entries:[{account:'GST Output A/c',dr:320000,cr:0},{account:'GST Payable',dr:0,cr:320000}],                  status:'draft',   postedBy:null           },
]
export function getJournalVouchers() { return Promise.resolve([...JOURNAL_VOUCHERS]) }

export const PROVISIONS = [
  { id:'PV001', ref:'PROV-2526-010', date:'2026-01-04', desc:'Provision for bad debts (Q3)',     account:'Provision for Doubtful Debts', amount:85000,  status:'posted'   },
  { id:'PV002', ref:'PROV-2526-009', date:'2025-12-31', desc:'Salary payable — Dec 2025',        account:'Salary Payable A/c',           amount:2800000,status:'posted'   },
  { id:'PV003', ref:'PROV-2526-008', date:'2025-12-31', desc:'Audit fees provision Q3',          account:'Provision for Audit Fees',     amount:50000,  status:'posted'   },
  { id:'PV004', ref:'PROV-2526-007', date:'2025-12-31', desc:'Gratuity provision FY26',          account:'Gratuity Liability',           amount:380000, status:'posted'   },
  { id:'PV005', ref:'PROV-2526-006', date:'2025-12-31', desc:'Income tax provision Q3',          account:'Income Tax Payable',           amount:650000, status:'draft'    },
]
export function getProvisions() { return Promise.resolve([...PROVISIONS]) }

export const WRITE_OFFS = [
  { id:'WO001', ref:'WO-2526-004', date:'2026-01-05', desc:'Bad debt — Falcon Traders (defunct)',  account:'Bad Debts A/c',     amount:125000, approvedBy:'Finance Lead', status:'approved' },
  { id:'WO002', ref:'WO-2526-003', date:'2025-12-28', desc:'Damaged stock — Godown 2 fire',       account:'Stock Write-off',   amount:85000,  approvedBy:'Finance Lead', status:'approved' },
  { id:'WO003', ref:'WO-2526-002', date:'2025-12-10', desc:'Obsolete inventory — old components', account:'Stock Write-off',   amount:42000,  approvedBy:'Finance Lead', status:'approved' },
  { id:'WO004', ref:'WO-2526-001', date:'2025-11-30', desc:'Uncollectable advance — vendor exit', account:'Advance Write-off', amount:30000,  approvedBy:'Finance Lead', status:'approved' },
]
export function getWriteOffs() { return Promise.resolve([...WRITE_OFFS]) }
