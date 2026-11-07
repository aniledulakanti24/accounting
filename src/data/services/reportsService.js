/* ── Reports & Analytics service — mock data ── */

/* Trial Balance */
export const TRIAL_BALANCE = [
  { id:'TB001', group:'Assets',      account:'Trade Receivables',           code:'1100', dr:5260000, cr:0        },
  { id:'TB002', group:'Assets',      account:'ICICI Bank — Current',        code:'1200', dr:4850000, cr:0        },
  { id:'TB003', group:'Assets',      account:'HDFC OD Account',             code:'1201', dr:0,       cr:820000   },
  { id:'TB004', group:'Assets',      account:'SBI Fixed Deposit',           code:'1210', dr:2000000, cr:0        },
  { id:'TB005', group:'Assets',      account:'Petty Cash',                  code:'1300', dr:33500,   cr:0        },
  { id:'TB006', group:'Assets',      account:'Closing Stock',               code:'1400', dr:3820000, cr:0        },
  { id:'TB007', group:'Assets',      account:'Prepaid Expenses',            code:'1500', dr:85000,   cr:0        },
  { id:'TB008', group:'Assets',      account:'Interest Receivable',         code:'1510', dr:45000,   cr:0        },
  { id:'TB009', group:'Assets',      account:'Fixed Assets (Net)',          code:'1600', dr:8200000, cr:0        },
  { id:'TB010', group:'Liabilities', account:'Trade Payables',              code:'2100', dr:0,       cr:2150000  },
  { id:'TB011', group:'Liabilities', account:'GST Payable',                 code:'2200', dr:0,       cr:1708744  },
  { id:'TB012', group:'Liabilities', account:'TDS Payable',                 code:'2210', dr:0,       cr:11700    },
  { id:'TB013', group:'Liabilities', account:'Salary Payable',              code:'2300', dr:0,       cr:2800000  },
  { id:'TB014', group:'Liabilities', account:'Bank OD Liability',           code:'2400', dr:0,       cr:820000   },
  { id:'TB015', group:'Equity',      account:'Share Capital',               code:'3100', dr:0,       cr:5000000  },
  { id:'TB016', group:'Equity',      account:'Retained Earnings',           code:'3200', dr:0,       cr:4820000  },
  { id:'TB017', group:'Income',      account:'Sales Revenue',               code:'4100', dr:0,       cr:11330000 },
  { id:'TB018', group:'Income',      account:'Interest Income',             code:'4200', dr:0,       cr:45000    },
  { id:'TB019', group:'Income',      account:'Other Income',                code:'4300', dr:0,       cr:85000    },
  { id:'TB020', group:'Expenses',    account:'Cost of Goods Sold',          code:'5100', dr:6200000, cr:0        },
  { id:'TB021', group:'Expenses',    account:'Salaries & Wages',            code:'5200', dr:2800000, cr:0        },
  { id:'TB022', group:'Expenses',    account:'Travel & Conveyance',         code:'5300', dr:145000,  cr:0        },
  { id:'TB023', group:'Expenses',    account:'Office Expenses',             code:'5400', dr:38000,   cr:0        },
  { id:'TB024', group:'Expenses',    account:'Marketing Expenses',          code:'5500', dr:420000,  cr:0        },
  { id:'TB025', group:'Expenses',    account:'Professional Fees',           code:'5600', dr:180000,  cr:0        },
  { id:'TB026', group:'Expenses',    account:'Depreciation',                code:'5700', dr:125000,  cr:0        },
  { id:'TB027', group:'Expenses',    account:'Utilities',                   code:'5800', dr:88000,   cr:0        },
  { id:'TB028', group:'Expenses',    account:'Repairs & Maintenance',       code:'5900', dr:42000,   cr:0        },
]
export function getTrialBalance() { return Promise.resolve([...TRIAL_BALANCE]) }

/* P&L */
export const PL_DATA = {
  revenue: [
    { label:'Sales Revenue',    amount:11330000 },
    { label:'Interest Income',  amount:45000    },
    { label:'Other Income',     amount:85000    },
  ],
  cogs: [
    { label:'Opening Stock',     amount:3200000  },
    { label:'Purchases',         amount:6820000  },
    { label:'Less: Closing Stock',amount:-3820000 },
  ],
  opex: [
    { label:'Salaries & Wages',  amount:2800000 },
    { label:'Marketing',         amount:420000  },
    { label:'Professional Fees', amount:180000  },
    { label:'Travel',            amount:145000  },
    { label:'Utilities',         amount:88000   },
    { label:'Office Expenses',   amount:38000   },
    { label:'Repairs',           amount:42000   },
    { label:'Depreciation',      amount:125000  },
  ],
}
export function getPLData(period) { return Promise.resolve({...PL_DATA}) }

/* Balance Sheet */
export const BALANCE_SHEET = {
  assets: {
    current:    [
      { label:'Trade Receivables', amount:5260000 },
      { label:'Bank & Cash',       amount:4883500 },
      { label:'Closing Stock',     amount:3820000 },
      { label:'Prepaid & Others',  amount:130000  },
    ],
    noncurrent: [
      { label:'Fixed Assets (Net)',amount:8200000 },
      { label:'SBI Fixed Deposit', amount:2000000 },
    ],
  },
  liabilities: {
    current:    [
      { label:'Trade Payables',    amount:2150000 },
      { label:'GST Payable',       amount:1708744 },
      { label:'Salary Payable',    amount:2800000 },
      { label:'TDS Payable',       amount:11700   },
    ],
    noncurrent: [
      { label:'Bank OD Liability', amount:820000  },
    ],
    equity:     [
      { label:'Share Capital',     amount:5000000 },
      { label:'Retained Earnings', amount:4820000 },
      { label:'Net Profit (YTD)',  amount:7025056 },
    ],
  },
}
export function getBalanceSheet(period) { return Promise.resolve({...BALANCE_SHEET}) }

/* Day Book */
export const DAY_BOOK = [
  { id:'DB001', time:'09:14', ref:'POS-2526-1142', type:'Sales',    party:'Walk-in',             narration:'POS sale — Counter 1',       dr:0,       cr:5310   },
  { id:'DB002', time:'09:52', ref:'POS-2526-1143', type:'Sales',    party:'Walk-in',             narration:'POS sale — Counter 2',       dr:0,       cr:2124   },
  { id:'DB003', time:'10:23', ref:'POS-2526-1144', type:'Sales',    party:'Ramesh Traders',      narration:'POS sale — Counter 1',       dr:0,       cr:21240  },
  { id:'DB004', time:'11:05', ref:'REC-2526-0055', type:'Receipt',  party:'Tech Mahindra',       narration:'Receipt against SI-0099',    dr:0,       cr:1600000},
  { id:'DB005', time:'14:30', ref:'PAY-2526-0031', type:'Payment',  party:'Reliance Industries', narration:'Payment against PI-0042',    dr:1500000, cr:0      },
  { id:'DB006', time:'16:00', ref:'JV-2026-048',   type:'Journal',  party:'—',                   narration:'Depreciation — Jan 2026',    dr:125000,  cr:125000 },
]
export function getDayBook(date) { return Promise.resolve([...DAY_BOOK]) }

/* Sales Register */
export const SALES_REGISTER = [
  { id:'SR001', date:'2025-12-18', ref:'SI-2526-0108', party:'Infosys BPO Ltd',       taxable:2415254, cgst:217373, sgst:217373, igst:0, cess:0, total:2850000 },
  { id:'SR002', date:'2025-12-10', ref:'SI-2526-0099', party:'Tech Mahindra Limited', taxable:1627119, cgst:146441, sgst:146441, igst:0, cess:0, total:1920000 },
  { id:'SR003', date:'2025-12-08', ref:'SI-2526-0094', party:'Wipro Digital Ltd',     taxable:1305085, cgst:117458, sgst:117458, igst:0, cess:0, total:1540000 },
  { id:'SR004', date:'2025-12-02', ref:'SI-2526-0088', party:'HCL Technologies',      taxable:830508,  cgst:74746,  sgst:74746,  igst:0, cess:0, total:980000  },
  { id:'SR005', date:'2025-11-25', ref:'SI-2526-0079', party:'L&T Infotech Ltd',      taxable:576271,  cgst:51864,  sgst:51864,  igst:0, cess:0, total:680000  },
  { id:'SR006', date:'2025-11-10', ref:'SI-2526-0065', party:'Tata Consultancy Svcs', taxable:525424,  cgst:47288,  sgst:47288,  igst:0, cess:0, total:620000  },
]
export function getSalesRegister(period) { return Promise.resolve([...SALES_REGISTER]) }

/* Purchase Register */
export const PURCHASE_REGISTER = [
  { id:'PR001', date:'2026-01-05', ref:'PI-2526-0042', party:'Reliance Industries Ltd', taxable:1271186, cgst:114407, sgst:114407, igst:0, cess:0, total:1500000 },
  { id:'PR002', date:'2025-12-28', ref:'PI-2526-0039', party:'Adani Enterprises Ltd',   taxable:847458,  cgst:76271,  sgst:76271,  igst:0, cess:0, total:1000000 },
  { id:'PR003', date:'2025-12-20', ref:'PI-2526-0036', party:'Tata Steel Ltd',          taxable:635593,  cgst:57203,  sgst:57203,  igst:0, cess:0, total:750000  },
  { id:'PR004', date:'2025-12-12', ref:'PI-2526-0031', party:'L&T Ltd',                 taxable:508475,  cgst:45763,  sgst:45763,  igst:0, cess:0, total:600000  },
]
export function getPurchaseRegister(period) { return Promise.resolve([...PURCHASE_REGISTER]) }

/* Profitability */
export const PROFITABILITY = [
  { id:'PF001', costCenter:'Mumbai HO',      revenue:8500000, cogs:4800000, grossProfit:3700000, opex:2100000, netProfit:1600000 },
  { id:'PF002', costCenter:'Pune Branch',    revenue:1850000, cogs:980000,  grossProfit:870000,  opex:520000,  netProfit:350000  },
  { id:'PF003', costCenter:'Bangalore',      revenue:980000,  cogs:520000,  grossProfit:460000,  opex:280000,  netProfit:180000  },
  { id:'PF004', costCenter:'Online Channel', revenue:420000,  cogs:180000,  grossProfit:240000,  opex:85000,   netProfit:155000  },
]
export function getProfitability() { return Promise.resolve([...PROFITABILITY]) }

/* Cash Flow Projection */
export const CASHFLOW_PROJECTION = [
  { month:'Jan 2026', openingBalance:4850000, inflows:4200000,  outflows:3800000, closingBalance:5250000, projected:true  },
  { month:'Feb 2026', openingBalance:5250000, inflows:3800000,  outflows:3500000, closingBalance:5550000, projected:true  },
  { month:'Mar 2026', openingBalance:5550000, inflows:5200000,  outflows:6800000, closingBalance:3950000, projected:true  },
]
export function getCashFlowProjection() { return Promise.resolve([...CASHFLOW_PROJECTION]) }
