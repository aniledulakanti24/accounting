/* ── Payables service — mock data ── */

export const AP_BILLS = [
  { id:'AP001', ref:'PI-2526-0042', date:'2026-01-05', supplier:'Reliance Industries Ltd', total:1500000, paid:1500000, balance:0,       status:'paid',    dueDate:'2026-02-04', paymentMode:'RTGS', approval:'approved', itcRisk:'low',    gstStatus:'Active',   bankVerified:true,  tdsSection:'194Q', tdsRate:0.1, tdsAmount:1500, netPayable:0,      advanceAvailable:0,      debitAvailable:0,     returnAvailable:0,     holdReason:null,                    nextAction:'Closed and reconciled',       portalStatus:'Viewed payment advice', safeToPay:99, cashAfterPayment:7280000, utr:'HDFC2601049012', bankStatus:'Matched', paymentAdvice:'sent' },
  { id:'AP002', ref:'PI-2526-0039', date:'2025-12-28', supplier:'Adani Enterprises Ltd',   total:1000000, paid:500000,  balance:500000,  status:'partial', dueDate:'2026-01-27', paymentMode:'NEFT', approval:'approved', itcRisk:'medium', gstStatus:'Active',   bankVerified:true,  tdsSection:'194Q', tdsRate:0.1, tdsAmount:500,  netPayable:499500, advanceAvailable:300000, debitAvailable:0,     returnAvailable:42000, holdReason:null,                    nextAction:'Release net payment after adjustment', portalStatus:'Supplier awaiting UTR', safeToPay:86, cashAfterPayment:6780500, utr:null, bankStatus:'Ready', paymentAdvice:'draft' },
  { id:'AP003', ref:'PI-2526-0036', date:'2025-12-20', supplier:'Tata Steel Ltd',          total:750000,  paid:0,       balance:750000,  status:'unpaid',  dueDate:'2026-01-19', paymentMode:'RTGS', approval:'pending',  itcRisk:'high',   gstStatus:'Active',   bankVerified:true,  tdsSection:'194Q', tdsRate:0.1, tdsAmount:750,  netPayable:654250, advanceAvailable:200000, debitAvailable:95000, returnAvailable:95000, holdReason:'ITC mismatch and approval pending', nextAction:'Resolve ITC mismatch before release', portalStatus:'Bill uploaded by vendor', safeToPay:42, cashAfterPayment:6125750, utr:null, bankStatus:'Blocked', paymentAdvice:'blocked' },
  { id:'AP004', ref:'PI-2526-0031', date:'2025-12-12', supplier:'L&T Ltd',                 total:600000,  paid:0,       balance:600000,  status:'overdue', dueDate:'2026-01-11', paymentMode:'Cheque', approval:'approved', itcRisk:'medium', gstStatus:'Active',   bankVerified:false, tdsSection:'194C', tdsRate:1,   tdsAmount:6000, netPayable:594000, advanceAvailable:0,      debitAvailable:28000, returnAvailable:0,     holdReason:'Bank account verification pending', nextAction:'Verify bank or print cheque', portalStatus:'Supplier asked for status', safeToPay:63, cashAfterPayment:6186000, utr:null, bankStatus:'Bank KYC needed', paymentAdvice:'pending' },
  { id:'AP005', ref:'PI-2526-0022', date:'2025-11-28', supplier:'Maruti Suzuki India Ltd', total:300000,  paid:0,       balance:300000,  status:'overdue', dueDate:'2025-12-28', paymentMode:'UPI',  approval:'approved', itcRisk:'low',    gstStatus:'Inactive', bankVerified:true,  tdsSection:'None', tdsRate:0,   tdsAmount:0,    netPayable:300000, advanceAvailable:0,      debitAvailable:0,     returnAvailable:0,     holdReason:'GSTIN inactive - review supplier master', nextAction:'Confirm GSTIN before payment', portalStatus:'Payment status visible', safeToPay:58, cashAfterPayment:6480000, utr:null, bankStatus:'Hold', paymentAdvice:'blocked' },
]
export function getAPBills() { return Promise.resolve([...AP_BILLS]) }

export const AP_PAYMENTS = [
  { id:'APP001', ref:'PAY-2526-0031', date:'2026-01-06', supplier:'Reliance Industries Ltd', invoice:'PI-2526-0042', amount:1500000, mode:'RTGS',   status:'cleared', approval:'released', bankStatus:'Matched',       maker:'Ankit', checker:'Meera', utr:'HDFC2601068831', tdsAmount:1500, advice:'sent',    reconciliation:'matched',   retryReason:null },
  { id:'APP002', ref:'PAY-2526-0028', date:'2025-12-30', supplier:'Adani Enterprises Ltd',   invoice:'PI-2526-0039', amount:500000,  mode:'NEFT',   status:'cleared', approval:'released', bankStatus:'Matched',       maker:'Ankit', checker:'Meera', utr:'ICIC2512305542', tdsAmount:500,  advice:'sent',    reconciliation:'matched',   retryReason:null },
  { id:'APP003', ref:'PAY-2526-0025', date:'2025-12-18', supplier:'BHEL',                    invoice:'PI-2526-0027', amount:500000,  mode:'NEFT',   status:'cleared', approval:'released', bankStatus:'Matched',       maker:'Sneha', checker:'Meera', utr:'SBIN2512188810', tdsAmount:500,  advice:'sent',    reconciliation:'matched',   retryReason:null },
  { id:'APP004', ref:'PAY-2526-0020', date:'2025-12-16', supplier:'Asian Paints Ltd',        invoice:'PI-2526-0018', amount:200000,  mode:'Cheque', status:'pending', approval:'released', bankStatus:'PDC - 07 Jun', maker:'Ankit', checker:'Meera', utr:'CHQ-884512',     tdsAmount:0,    advice:'scheduled', reconciliation:'unmatched', retryReason:null },
  { id:'APP005', ref:'PAY-2526-0012', date:'2025-11-30', supplier:'L&T Ltd',                 invoice:'PI-2526-0031', amount:300000,  mode:'Cheque', status:'bounced', approval:'blocked',  bankStatus:'Cheque bounced', maker:'Ankit', checker:'Meera', utr:'CHQ-884488',     tdsAmount:3000, advice:'blocked', reconciliation:'exception', retryReason:'Signature mismatch' },
]
export function getAPPayments() { return Promise.resolve([...AP_PAYMENTS]) }

export const AP_AGEING = [
  { id:'APA001', supplier:'Adani Enterprises Ltd',   total:500000,  current:500000, d31_60:0,      d61_90:0,      d90plus:0       },
  { id:'APA002', supplier:'Tata Steel Ltd',          total:750000,  current:750000, d31_60:0,      d61_90:0,      d90plus:0       },
  { id:'APA003', supplier:'L&T Ltd',                 total:600000,  current:0,      d31_60:600000, d61_90:0,      d90plus:0       },
  { id:'APA004', supplier:'Maruti Suzuki India Ltd', total:300000,  current:0,      d31_60:0,      d61_90:300000, d90plus:0       },
]
export function getAPAgeing() { return Promise.resolve([...AP_AGEING]) }

export const SUPPLIER_ADVANCES = [
  { id:'SA001', ref:'ADV-2526-0008', date:'2026-01-04', supplier:'Reliance Industries Ltd', amount:500000,  purpose:'PO-2526-0018 advance',     status:'open'      },
  { id:'SA002', ref:'ADV-2526-0006', date:'2025-12-25', supplier:'Tata Steel Ltd',          amount:200000,  purpose:'Material advance',          status:'adjusted'  },
  { id:'SA003', ref:'ADV-2526-0004', date:'2025-12-10', supplier:'BHEL',                    amount:150000,  purpose:'Contract mobilization',     status:'adjusted'  },
  { id:'SA004', ref:'ADV-2526-0002', date:'2025-11-20', supplier:'Adani Enterprises',       amount:300000,  purpose:'Import LC margin',          status:'open'      },
]
export function getSupplierAdvances() { return Promise.resolve([...SUPPLIER_ADVANCES]) }

export const AP_DEBIT_NOTES = [
  { id:'ADN001', ref:'DN-2526-0006', date:'2026-01-09', supplier:'Tata Steel Ltd',      invoice:'PI-2526-0036', amount:95000,  reason:'Defective Material Return', status:'open'     },
  { id:'ADN002', ref:'DN-2526-0004', date:'2025-12-25', supplier:'L&T Ltd',             invoice:'PI-2526-0031', amount:28000,  reason:'Price Correction',          status:'adjusted' },
]
export function getAPDebitNotes() { return Promise.resolve([...AP_DEBIT_NOTES]) }

export const AP_PURCHASE_RETURNS = [
  { id:'APR001', ref:'PR-2526-0005', date:'2026-01-08', supplier:'Tata Steel Ltd',    invoice:'PI-2526-0036', items:1, amount:95000,  reason:'Defective Material', status:'approved' },
  { id:'APR002', ref:'PR-2526-0003', date:'2025-12-22', supplier:'Adani Enterprises', invoice:'PI-2526-0039', items:1, amount:42000,  reason:'Wrong Specification', status:'pending'  },
]
export function getAPPurchaseReturns() { return Promise.resolve([...AP_PURCHASE_RETURNS]) }
