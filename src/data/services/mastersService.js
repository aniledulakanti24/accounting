/**
 * Masters service — mock data for all Masters tabs.
 * Swap internals for fetch() when API is ready.
 */

/* ── Chart of Accounts ── */
export const ACCOUNT_GROUPS = ['Assets', 'Liabilities', 'Income', 'Expenses', 'Equity']
export const ACCOUNT_TYPES  = ['Bank', 'Cash', 'Debtor', 'Creditor', 'Fixed Asset',
                               'Expense', 'Income', 'Capital', 'Loan', 'Tax', 'Stock']

const ACCOUNTS_SEED = [
  { id:'A001', code:'1001', name:'HDFC Bank – Current A/c',       group:'Assets',      type:'Bank',        openingDr:2850000, openingCr:0,       status:'active' },
  { id:'A002', code:'1002', name:'ICICI Bank – OD A/c',           group:'Assets',      type:'Bank',        openingDr:0,       openingCr:1200000, status:'active' },
  { id:'A003', code:'1003', name:'Petty Cash',                    group:'Assets',      type:'Cash',        openingDr:45000,   openingCr:0,       status:'active' },
  { id:'A004', code:'1101', name:'Debtors Control',               group:'Assets',      type:'Debtor',      openingDr:7890000, openingCr:0,       status:'active' },
  { id:'A005', code:'1201', name:'Stock-in-Trade',                group:'Assets',      type:'Stock',       openingDr:3200000, openingCr:0,       status:'active' },
  { id:'A006', code:'1301', name:'Office Building',               group:'Assets',      type:'Fixed Asset', openingDr:8500000, openingCr:0,       status:'active' },
  { id:'A007', code:'1302', name:'Computer & Peripherals',        group:'Assets',      type:'Fixed Asset', openingDr:620000,  openingCr:0,       status:'active' },
  { id:'A008', code:'1303', name:'Furniture & Fixtures',          group:'Assets',      type:'Fixed Asset', openingDr:380000,  openingCr:0,       status:'active' },
  { id:'A009', code:'2001', name:'Creditors Control',             group:'Liabilities', type:'Creditor',    openingDr:0,       openingCr:3240000, status:'active' },
  { id:'A010', code:'2101', name:'HDFC Term Loan',                group:'Liabilities', type:'Loan',        openingDr:0,       openingCr:5000000, status:'active' },
  { id:'A011', code:'2201', name:'GST Payable (Output)',          group:'Liabilities', type:'Tax',         openingDr:0,       openingCr:890000,  status:'active' },
  { id:'A012', code:'2202', name:'TDS Payable',                   group:'Liabilities', type:'Tax',         openingDr:0,       openingCr:125000,  status:'active' },
  { id:'A013', code:'3001', name:'Share Capital',                 group:'Equity',      type:'Capital',     openingDr:0,       openingCr:10000000,status:'active' },
  { id:'A014', code:'3002', name:'Retained Earnings',             group:'Equity',      type:'Capital',     openingDr:0,       openingCr:5420000, status:'active' },
  { id:'A015', code:'4001', name:'Sales – Domestic',              group:'Income',      type:'Income',      openingDr:0,       openingCr:0,       status:'active' },
  { id:'A016', code:'4002', name:'Sales – Export',                group:'Income',      type:'Income',      openingDr:0,       openingCr:0,       status:'active' },
  { id:'A017', code:'4003', name:'Service Revenue',               group:'Income',      type:'Income',      openingDr:0,       openingCr:0,       status:'active' },
  { id:'A018', code:'4101', name:'Other Income',                  group:'Income',      type:'Income',      openingDr:0,       openingCr:0,       status:'active' },
  { id:'A019', code:'5001', name:'Cost of Goods Sold',            group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'active' },
  { id:'A020', code:'5101', name:'Salaries & Wages',              group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'active' },
  { id:'A021', code:'5102', name:'Rent',                          group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'active' },
  { id:'A022', code:'5103', name:'Electricity & Utilities',       group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'active' },
  { id:'A023', code:'5104', name:'Internet & Telecom',            group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'active' },
  { id:'A024', code:'5105', name:'Professional Fees',             group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'active' },
  { id:'A025', code:'5201', name:'Depreciation',                  group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'active' },
  { id:'A026', code:'5301', name:'Bank Charges',                  group:'Expenses',    type:'Expense',     openingDr:0,       openingCr:0,       status:'inactive' },
  { id:'A027', code:'6001', name:'GST Input Credit (IGST)',       group:'Assets',      type:'Tax',         openingDr:245000,  openingCr:0,       status:'active' },
  { id:'A028', code:'6002', name:'GST Input Credit (CGST)',       group:'Assets',      type:'Tax',         openingDr:132000,  openingCr:0,       status:'active' },
  { id:'A029', code:'6003', name:'GST Input Credit (SGST)',       group:'Assets',      type:'Tax',         openingDr:132000,  openingCr:0,       status:'active' },
]

export function getAccounts() {
  return Promise.resolve([...ACCOUNTS_SEED])
}

/* ── Tax Masters ── */
const TAX_SEED = [
  // GST
  { id:'T001', taxType:'GST', code:'GST-0',    name:'GST 0% (Exempt)',         rate:0,   component:'IGST/CGST+SGST', hsn:'',      applicableOn:'All',           status:'active' },
  { id:'T002', taxType:'GST', code:'GST-5',    name:'GST 5%',                  rate:5,   component:'IGST/CGST+SGST', hsn:'',      applicableOn:'Goods',         status:'active' },
  { id:'T003', taxType:'GST', code:'GST-12',   name:'GST 12%',                 rate:12,  component:'IGST/CGST+SGST', hsn:'',      applicableOn:'Goods & Svcs',  status:'active' },
  { id:'T004', taxType:'GST', code:'GST-18',   name:'GST 18% (Standard)',      rate:18,  component:'IGST/CGST+SGST', hsn:'',      applicableOn:'Goods & Svcs',  status:'active' },
  { id:'T005', taxType:'GST', code:'GST-28',   name:'GST 28% (Luxury)',        rate:28,  component:'IGST/CGST+SGST', hsn:'',      applicableOn:'Goods',         status:'active' },
  // TDS
  { id:'T006', taxType:'TDS', code:'194C',     name:'TDS on Contractor',       rate:1,   component:'—',              hsn:'194C',  applicableOn:'Contractor Pmt',status:'active' },
  { id:'T007', taxType:'TDS', code:'194J',     name:'TDS on Professional Fees',rate:10,  component:'—',              hsn:'194J',  applicableOn:'Prof/Tech Svcs',status:'active' },
  { id:'T008', taxType:'TDS', code:'194I',     name:'TDS on Rent',             rate:10,  component:'—',              hsn:'194I',  applicableOn:'Rent ≥₹2.4L pa', status:'active' },
  { id:'T009', taxType:'TDS', code:'192',      name:'TDS on Salary',           rate:0,   component:'—',              hsn:'192',   applicableOn:'Employee Salary',status:'active' },
  { id:'T010', taxType:'TDS', code:'194Q',     name:'TDS on Purchase of Goods',rate:0.1, component:'—',              hsn:'194Q',  applicableOn:'Purchase >₹50L', status:'active' },
  // TCS
  { id:'T011', taxType:'TCS', code:'206C(1H)', name:'TCS on Goods Sale',       rate:0.1, component:'—',              hsn:'206C',  applicableOn:'Sale >₹50L',    status:'active' },
  { id:'T012', taxType:'TCS', code:'206CCA',   name:'TCS – Non-filer',         rate:1,   component:'—',              hsn:'206CCA',applicableOn:'High-Risk Party',status:'inactive' },
]

export function getTaxMasters() {
  return Promise.resolve([...TAX_SEED])
}

/* ── Cost Centers ── */
const COST_CENTERS_SEED = [
  { id:'CC01', code:'HO',   name:'Head Office',         parent:null,       budget:5000000, utilized:3200000, status:'active' },
  { id:'CC02', code:'MUM',  name:'Mumbai Operations',   parent:'HO',       budget:2000000, utilized:1450000, status:'active' },
  { id:'CC03', code:'BLR',  name:'Bangalore Office',    parent:'HO',       budget:1500000, utilized:980000,  status:'active' },
  { id:'CC04', code:'SALES',name:'Sales & Marketing',   parent:'HO',       budget:1200000, utilized:890000,  status:'active' },
  { id:'CC05', code:'IT',   name:'IT & Infrastructure', parent:'HO',       budget:800000,  utilized:620000,  status:'active' },
  { id:'CC06', code:'HR',   name:'Human Resources',     parent:'HO',       budget:600000,  utilized:410000,  status:'active' },
  { id:'CC07', code:'MFG',  name:'Manufacturing Unit',  parent:'MUM',      budget:3500000, utilized:2800000, status:'active' },
  { id:'CC08', code:'WH',   name:'Warehouse & Logistics',parent:'MUM',     budget:900000,  utilized:670000,  status:'active' },
  { id:'CC09', code:'R&D',  name:'Research & Development',parent:'BLR',    budget:1000000, utilized:450000,  status:'active' },
  { id:'CC10', code:'DEL',  name:'Delhi NCR',           parent:'HO',       budget:1200000, utilized:0,       status:'inactive' },
]

export function getCostCenters() {
  return Promise.resolve([...COST_CENTERS_SEED])
}

/* ── Voucher Types ── */
const VOUCHER_TYPES_SEED = [
  { id:'VT01', name:'Receipt',         abbr:'RCV', nature:'Receipt',  numberSeries:'RCV-{FY}-####', prefix:'RCV', autoNumber:true,  status:'active' },
  { id:'VT02', name:'Payment',         abbr:'PAY', nature:'Payment',  numberSeries:'PAY-{FY}-####', prefix:'PAY', autoNumber:true,  status:'active' },
  { id:'VT03', name:'Journal',         abbr:'JV',  nature:'Journal',  numberSeries:'JV-{FY}-####',  prefix:'JV',  autoNumber:true,  status:'active' },
  { id:'VT04', name:'Contra',          abbr:'CON', nature:'Contra',   numberSeries:'CON-{FY}-####', prefix:'CON', autoNumber:true,  status:'active' },
  { id:'VT05', name:'Credit Note',     abbr:'CN',  nature:'Credit',   numberSeries:'CN-{FY}-####',  prefix:'CN',  autoNumber:true,  status:'active' },
  { id:'VT06', name:'Debit Note',      abbr:'DN',  nature:'Debit',    numberSeries:'DN-{FY}-####',  prefix:'DN',  autoNumber:true,  status:'active' },
  { id:'VT07', name:'Sales Invoice',   abbr:'SI',  nature:'Sales',    numberSeries:'SI-{FY}-####',  prefix:'SI',  autoNumber:true,  status:'active',  synced:true },
  { id:'VT08', name:'Purchase Bill',   abbr:'PB',  nature:'Purchase', numberSeries:'PB-{FY}-####',  prefix:'PB',  autoNumber:true,  status:'active',  synced:true },
  { id:'VT09', name:'Expense Voucher', abbr:'EXP', nature:'Expense',  numberSeries:'EXP-{FY}-####', prefix:'EXP', autoNumber:true,  status:'active' },
  { id:'VT10', name:'Depreciation',    abbr:'DEP', nature:'Journal',  numberSeries:'DEP-{FY}-####', prefix:'DEP', autoNumber:true,  status:'active' },
  { id:'VT11', name:'Write-off',       abbr:'WO',  nature:'Journal',  numberSeries:'WO-{FY}-####',  prefix:'WO',  autoNumber:false, status:'inactive' },
]

export function getVoucherTypes() {
  return Promise.resolve([...VOUCHER_TYPES_SEED])
}

/* ── Opening Balances ── */
const OB_SEED = ACCOUNTS_SEED.filter(a => a.openingDr > 0 || a.openingCr > 0).map(a => ({
  id: 'OB-' + a.id,
  accountCode: a.code,
  accountName: a.name,
  group: a.group,
  dr: a.openingDr,
  cr: a.openingCr,
  finalised: a.status === 'active',
}))

export function getOpeningBalances() {
  return Promise.resolve([...OB_SEED])
}

/* ── Currencies ── */
const CURRENCIES_SEED = [
  { id:'CUR01', code:'INR', name:'Indian Rupee',   symbol:'₹',  exchangeRate:1,        isBase:true,  status:'active' },
  { id:'CUR02', code:'USD', name:'US Dollar',       symbol:'$',  exchangeRate:83.52,    isBase:false, status:'active' },
  { id:'CUR03', code:'EUR', name:'Euro',            symbol:'€',  exchangeRate:90.15,    isBase:false, status:'active' },
  { id:'CUR04', code:'GBP', name:'British Pound',  symbol:'£',  exchangeRate:105.80,   isBase:false, status:'active' },
  { id:'CUR05', code:'AED', name:'UAE Dirham',      symbol:'د.إ',exchangeRate:22.74,    isBase:false, status:'active' },
  { id:'CUR06', code:'SGD', name:'Singapore Dollar',symbol:'S$', exchangeRate:62.40,    isBase:false, status:'inactive' },
  { id:'CUR07', code:'JPY', name:'Japanese Yen',    symbol:'¥',  exchangeRate:0.556,    isBase:false, status:'inactive' },
]

export function getCurrencies() {
  return Promise.resolve([...CURRENCIES_SEED])
}
