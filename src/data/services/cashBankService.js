/* ── Cash & Bank service — mock data ── */

export const BANK_ACCOUNTS = [
  { id:'BA001', name:'ICICI Current Account', bank:'ICICI Bank Ltd',    branch:'Andheri East, Mumbai', accountNo:'XXXX4821', ifsc:'ICIC0000195', type:'Current',  balance:4850000,  lastSync:'2026-01-06 09:00', status:'active'   },
  { id:'BA002', name:'HDFC OD Account',       bank:'HDFC Bank Ltd',     branch:'BKC, Mumbai',          accountNo:'XXXX2244', ifsc:'HDFC0000021', type:'Overdraft', balance:-820000, lastSync:'2026-01-06 08:45', status:'active'   },
  { id:'BA003', name:'SBI Fixed Deposit',     bank:'State Bank of India',branch:'Fort, Mumbai',         accountNo:'XXXX9910', ifsc:'SBIN0000300', type:'FD',       balance:2000000,  lastSync:'2026-01-01 00:00', status:'active'   },
  { id:'BA004', name:'Petty Cash — HO',       bank:'Cash',              branch:'Head Office',           accountNo:'—',        ifsc:'—',           type:'Cash',     balance:25000,   lastSync:null,               status:'active'   },
  { id:'BA005', name:'Petty Cash — Branch',   bank:'Cash',              branch:'Pune Branch',           accountNo:'—',        ifsc:'—',           type:'Cash',     balance:8500,    lastSync:null,               status:'active'   },
]
export function getBankAccounts() { return Promise.resolve([...BANK_ACCOUNTS]) }

export const BANK_TRANSACTIONS = [
  { id:'BT001', date:'2026-01-06', desc:'NEFT — Infosys BPO Ltd (SI-2526-0108)',     ref:'NEFT123456', credit:1000000, debit:0,       balance:4850000, account:'ICICI Current Account', reconciled:true  },
  { id:'BT002', date:'2026-01-05', desc:'RTGS — Reliance Industries (PI-2526-0042)', ref:'RTGS789012', credit:0,       debit:1500000, balance:3850000, account:'ICICI Current Account', reconciled:true  },
  { id:'BT003', date:'2026-01-04', desc:'NEFT — Tech Mahindra (REC-2526-0055)',      ref:'NEFT234567', credit:1600000, debit:0,       balance:5350000, account:'ICICI Current Account', reconciled:true  },
  { id:'BT004', date:'2026-01-04', desc:'Bank Charges — Q4 2025-26',                ref:'CHRG-001',   credit:0,       debit:2500,    balance:3747500, account:'ICICI Current Account', reconciled:false },
  { id:'BT005', date:'2026-01-03', desc:'UPI — POS Counter 1',                       ref:'UPI99887',   credit:5310,    debit:0,       balance:3752810, account:'ICICI Current Account', reconciled:false },
  { id:'BT006', date:'2026-01-02', desc:'NEFT — Wipro Digital (REC-2526-0052)',      ref:'NEFT345678', credit:650000,  debit:0,       balance:3747500, account:'ICICI Current Account', reconciled:true  },
  { id:'BT007', date:'2026-01-01', desc:'Opening Balance Jan 2026',                  ref:'OPBAL',      credit:2347500, debit:0,       balance:3097500, account:'ICICI Current Account', reconciled:true  },
]
export function getBankTransactions(accountId) { return Promise.resolve([...BANK_TRANSACTIONS]) }

export const PETTY_CASH = [
  { id:'PC001', date:'2026-01-06', desc:'Office stationery purchase',   category:'Office Supplies', debit:1200,  credit:0,    balance:25000, by:'Rahul M' },
  { id:'PC002', date:'2026-01-05', desc:'Auto fare — client visit',     category:'Travel',          debit:450,   credit:0,    balance:26200, by:'Priya S' },
  { id:'PC003', date:'2026-01-04', desc:'Petty cash replenishment',     category:'—',               debit:0,     credit:5000, balance:26650, by:'Finance' },
  { id:'PC004', date:'2026-01-03', desc:'Tea/coffee — office',          category:'Refreshments',    debit:800,   credit:0,    balance:21650, by:'Ankit R' },
  { id:'PC005', date:'2026-01-02', desc:'Courier charges',              category:'Courier',         debit:350,   credit:0,    balance:22450, by:'Rahul M' },
  { id:'PC006', date:'2025-12-31', desc:'Year-end petty cash count',    category:'—',               debit:0,     credit:0,    balance:22800, by:'Finance' },
]
export function getPettyCash() { return Promise.resolve([...PETTY_CASH]) }

export const CONTRA_ENTRIES = [
  { id:'CE001', ref:'CNTR-2526-0012', date:'2026-01-04', from:'ICICI Current Account', to:'Petty Cash — HO',    amount:5000,  purpose:'Petty cash replenishment', status:'posted' },
  { id:'CE002', ref:'CNTR-2526-0010', date:'2025-12-30', from:'ICICI Current Account', to:'SBI Fixed Deposit',  amount:500000,purpose:'FD renewal',               status:'posted' },
  { id:'CE003', ref:'CNTR-2526-0008', date:'2025-12-15', from:'HDFC OD Account',       to:'ICICI Current Account',amount:1000000,purpose:'OD repayment',           status:'posted' },
  { id:'CE004', ref:'CNTR-2526-0006', date:'2025-12-05', from:'ICICI Current Account', to:'Petty Cash — Branch',amount:10000, purpose:'Branch petty cash',        status:'posted' },
  { id:'CE005', ref:'CNTR-2526-0004', date:'2025-11-28', from:'ICICI Current Account', to:'HDFC OD Account',    amount:2000000,purpose:'Working capital transfer',status:'posted' },
]
export function getContraEntries() { return Promise.resolve([...CONTRA_ENTRIES]) }

export const CHEQUE_REGISTER = [
  { id:'CHQ001', chequeNo:'001245', date:'2026-01-04', payee:'Asian Paints Ltd',    bank:'ICICI',amount:200000, type:'Payment', clearDate:'2026-01-06', status:'cleared'     },
  { id:'CHQ002', chequeNo:'001244', date:'2025-12-30', payee:'L&T Ltd',             bank:'ICICI',amount:300000, type:'Payment', clearDate:null,         status:'bounced'     },
  { id:'CHQ003', chequeNo:'001243', date:'2025-12-20', payee:'Mindtree Limited',    bank:'ICICI',amount:100000, type:'Receipt', clearDate:'2025-12-22', status:'cleared'     },
  { id:'CHQ004', chequeNo:'001242', date:'2025-12-15', payee:'Office Supplies Co',  bank:'ICICI',amount:35000,  type:'Payment', clearDate:'2025-12-18', status:'cleared'     },
  { id:'CHQ005', chequeNo:'001241', date:'2026-01-10', payee:'Ultratech Cement',    bank:'ICICI',amount:150000, type:'Payment', clearDate:null,         status:'outstanding' },
]
export function getChequeRegister() { return Promise.resolve([...CHEQUE_REGISTER]) }
