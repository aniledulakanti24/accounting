/**
 * Sales Operations service — mock data.
 * Sales Invoices are synced read-only mirrors (origin = Sales module).
 */

/* ── Sales Invoices (synced) ── */
export const SALES_INVOICES = [
  { id:'SI001', ref:'SI-2526-0108', date:'2025-12-18', customer:'Infosys BPO Ltd',       items:3, subtotal:2415254, gst:434746, total:2850000, paid:0,       status:'unpaid',  dueDate:'2026-01-17', synced:true,  sourceOrder:'SO-2526-0061', irnStatus:'generated', ewayStatus:'active',  paymentLink:true,  qrReady:true,  risk:'high',   avgDelay:22, creditLimit:5000000, lastReminder:'2026-01-05', viewed:'Yes', paymentSignal:'No response', nextAction:'Send WhatsApp reminder' },
  { id:'SI002', ref:'SI-2526-0099', date:'2025-12-10', customer:'Tech Mahindra Limited', items:2, subtotal:1627119, gst:292881, total:1920000, paid:1600000, status:'partial', dueDate:'2026-01-09', synced:true,  sourceOrder:'SO-2526-0058', irnStatus:'generated', ewayStatus:'expired', paymentLink:true,  qrReady:true,  risk:'medium', avgDelay:9,  creditLimit:3500000, lastReminder:'2026-01-06', viewed:'Yes', paymentSignal:'Promised today', nextAction:'Collect balance payment' },
  { id:'SI003', ref:'SI-2526-0094', date:'2025-12-08', customer:'Wipro Digital Ltd',     items:5, subtotal:1305085, gst:234915, total:1540000, paid:650000,  status:'partial', dueDate:'2026-01-07', synced:true,  sourceOrder:'SO-2526-0055', irnStatus:'generated', ewayStatus:'expired', paymentLink:true,  qrReady:true,  risk:'medium', avgDelay:14, creditLimit:2500000, lastReminder:'2026-01-04', viewed:'No',  paymentSignal:'Needs ETA', nextAction:'Confirm payment ETA' },
  { id:'SI004', ref:'SI-2526-0088', date:'2025-12-02', customer:'HCL Technologies',      items:1, subtotal:830508,  gst:149492, total:980000,  paid:0,       status:'overdue', dueDate:'2026-01-01', synced:true,  sourceOrder:'SO-2526-0050', irnStatus:'pending',   ewayStatus:'pending', paymentLink:false, qrReady:false, risk:'high',   avgDelay:31, creditLimit:1200000, lastReminder:'2025-12-30', viewed:'No',  paymentSignal:'Compliance blocked', nextAction:'Generate IRN and escalate' },
  { id:'SI005', ref:'SI-2526-0079', date:'2025-11-25', customer:'L&T Infotech Ltd',      items:4, subtotal:576271,  gst:103729, total:680000,  paid:680000,  status:'paid',    dueDate:'2025-12-25', synced:true,  sourceOrder:'SO-2526-0044', irnStatus:'generated', ewayStatus:'closed',  paymentLink:true,  qrReady:true,  risk:'low',    avgDelay:2,  creditLimit:2000000, lastReminder:'2025-12-20', viewed:'Yes', paymentSignal:'Paid', nextAction:'Send receipt' },
  { id:'SI006', ref:'SI-2526-0065', date:'2025-11-10', customer:'Tata Consultancy Svcs', items:2, subtotal:525424,  gst:94576,  total:620000,  paid:0,       status:'overdue', dueDate:'2025-12-10', synced:true,  sourceOrder:'SO-2526-0037', irnStatus:'cancelled', ewayStatus:'expired', paymentLink:true,  qrReady:true,  risk:'high',   avgDelay:45, creditLimit:1000000, lastReminder:'2025-12-28', viewed:'Yes', paymentSignal:'Disputed', nextAction:'Final demand notice' },
  { id:'SI007', ref:'SI-2526-0058', date:'2025-10-28', customer:'Mindtree Limited',      items:3, subtotal:360169,  gst:64831,  total:425000,  paid:425000,  status:'paid',    dueDate:'2025-11-27', synced:true,  sourceOrder:'SO-2526-0029', irnStatus:'generated', ewayStatus:'closed',  paymentLink:true,  qrReady:true,  risk:'low',    avgDelay:0,  creditLimit:1500000, lastReminder:'-',          viewed:'Yes', paymentSignal:'Paid', nextAction:'Archive' },
  { id:'SI008', ref:'SI-2526-0042', date:'2025-10-05', customer:'Mphasis Corp India',    items:1, subtotal:211864,  gst:38136,  total:250000,  paid:250000,  status:'paid',    dueDate:'2025-11-04', synced:true,  sourceOrder:null,           irnStatus:'generated', ewayStatus:'none',    paymentLink:true,  qrReady:true,  risk:'low',    avgDelay:4,  creditLimit:800000,  lastReminder:'-',          viewed:'Yes', paymentSignal:'Paid', nextAction:'Archive' },
]

export function getSalesInvoices() { return Promise.resolve([...SALES_INVOICES]) }

/* ── Sales Orders ── */
export const SALES_ORDERS = [
  { id:'SO001', ref:'SO-2526-0064', date:'2026-01-06', customer:'Bajaj Electricals',     quote:'QT-2526-0041', items:4, amount:520000,  advance:100000, expectedShip:'2026-01-10', invoice:null,           status:'confirmed', fulfilment:'ready',      nextAction:'Create delivery challan' },
  { id:'SO002', ref:'SO-2526-0061', date:'2025-12-18', customer:'Infosys BPO Ltd',       quote:null,           items:3, amount:2850000, advance:0,      expectedShip:'2025-12-19', invoice:'SI-2526-0108', status:'invoiced',  fulfilment:'dispatched', nextAction:'Collect payment' },
  { id:'SO003', ref:'SO-2526-0058', date:'2025-12-10', customer:'Tech Mahindra Limited', quote:null,           items:2, amount:1920000, advance:320000, expectedShip:'2025-12-13', invoice:'SI-2526-0099', status:'partial',   fulfilment:'delivered',  nextAction:'Invoice balance' },
  { id:'SO004', ref:'SO-2526-0055', date:'2025-12-08', customer:'Wipro Digital Ltd',     quote:null,           items:5, amount:1540000, advance:650000, expectedShip:'2025-12-12', invoice:'SI-2526-0094', status:'partial',   fulfilment:'delivered',  nextAction:'Follow up balance' },
  { id:'SO005', ref:'SO-2526-0052', date:'2025-12-05', customer:'Crompton Greaves',      quote:'QT-2526-0038', items:2, amount:185000,  advance:0,      expectedShip:'2026-01-08', invoice:null,           status:'confirmed', fulfilment:'pending',    nextAction:'Reserve stock' },
  { id:'SO006', ref:'SO-2526-0048', date:'2025-11-30', customer:'Havells India Ltd',     quote:'QT-2526-0035', items:6, amount:890000,  advance:0,      expectedShip:'2026-01-05', invoice:null,           status:'on-hold',   fulfilment:'blocked',    nextAction:'Approve credit limit' },
]

export function getSalesOrders() { return Promise.resolve([...SALES_ORDERS]) }

/* ── Recurring Invoices / Subscriptions ── */
export const RECURRING_INVOICES = [
  { id:'RI001', profile:'Monthly AMC', customer:'Bajaj Electricals', amount:85000, frequency:'Monthly', nextRun:'2026-02-01', autoSend:'WhatsApp + Email', payment:'UPI link', status:'active', lastInvoice:'SI-2526-0114' },
  { id:'RI002', profile:'Cloud retainer', customer:'Tech Mahindra Limited', amount:240000, frequency:'Monthly', nextRun:'2026-02-05', autoSend:'Email', payment:'Bank transfer', status:'active', lastInvoice:'SI-2526-0109' },
  { id:'RI003', profile:'Office rent recovery', customer:'Wipro Digital Ltd', amount:125000, frequency:'Monthly', nextRun:'2026-02-10', autoSend:'WhatsApp', payment:'QR + link', status:'paused', lastInvoice:'SI-2526-0097' },
  { id:'RI004', profile:'Annual support', customer:'Havells India Ltd', amount:780000, frequency:'Yearly', nextRun:'2026-04-01', autoSend:'Email', payment:'Payment link', status:'active', lastInvoice:'SI-2525-0875' },
]

export function getRecurringInvoices() { return Promise.resolve([...RECURRING_INVOICES]) }

/* ── Quotations & Proforma ── */
export const QUOTATIONS = [
  { id:'Q001', ref:'QT-2526-0041', date:'2025-12-15', customer:'Bajaj Electricals',     validTill:'2026-01-14', items:4, amount:520000,  type:'Quotation', status:'sent'     },
  { id:'Q002', ref:'QT-2526-0038', date:'2025-12-10', customer:'Crompton Greaves',      validTill:'2026-01-09', items:2, amount:185000,  type:'Quotation', status:'accepted' },
  { id:'Q003', ref:'QT-2526-0035', date:'2025-12-05', customer:'Havells India Ltd',     validTill:'2026-01-04', items:6, amount:890000,  type:'Quotation', status:'draft'    },
  { id:'Q004', ref:'QT-2526-0030', date:'2025-11-28', customer:'Schneider Electric',    validTill:'2025-12-28', items:3, amount:340000,  type:'Quotation', status:'expired'  },
  { id:'Q005', ref:'QT-2526-0025', date:'2025-11-20', customer:'Siemens India Ltd',     validTill:'2025-12-20', items:5, amount:1250000, type:'Quotation', status:'rejected' },
  { id:'Q006', ref:'QT-2526-0018', date:'2025-11-10', customer:'L&T Switchgear',        validTill:'2025-12-10', items:2, amount:420000,  type:'Quotation', status:'accepted' },
]

export const PROFORMA = [
  { id:'PF001', ref:'PF-2526-0021', date:'2025-12-12', customer:'NTPC Limited',          validTill:'2026-01-11', items:5, amount:2800000, type:'Proforma', status:'sent'     },
  { id:'PF002', ref:'PF-2526-0018', date:'2025-12-01', customer:'Power Grid Corp India', validTill:'2025-12-31', items:3, amount:1450000, type:'Proforma', status:'sent'     },
  { id:'PF003', ref:'PF-2526-0014', date:'2025-11-22', customer:'BPCL Refinery',         validTill:'2025-12-22', items:8, amount:3200000, type:'Proforma', status:'accepted' },
  { id:'PF004', ref:'PF-2526-0009', date:'2025-11-10', customer:'HPCL Terminal',         validTill:'2025-12-10', items:4, amount:980000,  type:'Proforma', status:'expired'  },
]

export function getQuotations() { return Promise.resolve([...QUOTATIONS]) }
export function getProforma()   { return Promise.resolve([...PROFORMA]) }

/* ── Delivery Challans ── */
export const CHALLANS = [
  { id:'DC001', ref:'DC-2526-0088', date:'2025-12-18', customer:'Infosys BPO Ltd',       invoice:'SI-2526-0108', items:3, qty:12,  dispatchMode:'Road', status:'dispatched' },
  { id:'DC002', ref:'DC-2526-0085', date:'2025-12-16', customer:'Tech Mahindra Limited', invoice:'SI-2526-0099', items:2, qty:30,  dispatchMode:'Road', status:'delivered'  },
  { id:'DC003', ref:'DC-2526-0082', date:'2025-12-14', customer:'Wipro Digital Ltd',     invoice:'SI-2526-0094', items:5, qty:80,  dispatchMode:'Rail', status:'delivered'  },
  { id:'DC004', ref:'DC-2526-0079', date:'2025-12-12', customer:'HCL Technologies',      invoice:'SI-2526-0088', items:1, qty:8,   dispatchMode:'Road', status:'pending'    },
  { id:'DC005', ref:'DC-2526-0074', date:'2025-12-05', customer:'Bajaj Electricals',     invoice:null,           items:4, qty:50,  dispatchMode:'Road', status:'pending'    },
  { id:'DC006', ref:'DC-2526-0068', date:'2025-11-28', customer:'L&T Infotech Ltd',      invoice:'SI-2526-0079', items:4, qty:25,  dispatchMode:'Air',  status:'delivered'  },
  { id:'DC007', ref:'DC-2526-0060', date:'2025-11-20', customer:'NTPC Limited',           invoice:'PF-2526-0021', items:5, qty:120, dispatchMode:'Road', status:'returned'   },
]

export function getChallans() { return Promise.resolve([...CHALLANS]) }

/* ── Sales Receipts ── */
export const SALES_RECEIPTS = [
  { id:'SRP001', ref:'REC-2526-0055', date:'2026-01-05', customer:'Tech Mahindra Limited', invoice:'SI-2526-0099', amount:1600000, mode:'NEFT',   bank:'HDFC Current', txnRef:'N013420552991', status:'cleared', allocation:'partial', receiptPdf:true,  matched:true,  collectedBy:'Riya S' },
  { id:'SRP002', ref:'REC-2526-0052', date:'2025-12-28', customer:'Wipro Digital Ltd',     invoice:'SI-2526-0094', amount:650000,  mode:'RTGS',   bank:'ICICI Current', txnRef:'R552180009431', status:'cleared', allocation:'partial', receiptPdf:true,  matched:true,  collectedBy:'Aman K' },
  { id:'SRP003', ref:'REC-2526-0048', date:'2025-12-20', customer:'L&T Infotech Ltd',      invoice:'SI-2526-0079', amount:680000,  mode:'NEFT',   bank:'HDFC Current', txnRef:'N554211008822', status:'cleared', allocation:'full',    receiptPdf:true,  matched:true,  collectedBy:'Riya S' },
  { id:'SRP004', ref:'REC-2526-0045', date:'2025-12-15', customer:'Mindtree Limited',      invoice:'SI-2526-0058', amount:425000,  mode:'Cheque', bank:'Axis Collection', txnRef:'CHQ-918244',    status:'cleared', allocation:'full',    receiptPdf:true,  matched:false, collectedBy:'Aman K' },
  { id:'SRP005', ref:'REC-2526-0041', date:'2025-12-08', customer:'Mphasis Corp India',    invoice:'SI-2526-0042', amount:250000,  mode:'UPI',    bank:'Razorpay UPI',    txnRef:'UPI6021883192', status:'cleared', allocation:'full',    receiptPdf:true,  matched:true,  collectedBy:'Riya S' },
  { id:'SRP006', ref:'REC-2526-0038', date:'2025-12-05', customer:'HCL Technologies',      invoice:'SI-2526-0088', amount:500000,  mode:'Cheque', bank:'Axis Collection', txnRef:'CHQ-917840',    status:'bounced', allocation:'failed',  receiptPdf:false, matched:false, collectedBy:'Aman K' },
  { id:'SRP007', ref:'REC-2526-0030', date:'2025-11-28', customer:'Infosys BPO Ltd',       invoice:'SI-2526-0108', amount:1000000, mode:'NEFT',   bank:'HDFC Current',   txnRef:'N884390912284', status:'pending', allocation:'advance', receiptPdf:false, matched:false, collectedBy:'Riya S' },
]

export function getSalesReceipts() { return Promise.resolve([...SALES_RECEIPTS]) }

/* ── POS Billing ── */
export const POS_BILLS = [
  { id:'PB001', ref:'POS-2526-1142', time:'09:14', counter:'Counter 1', customer:'Walk-in', items:3, amount:4500,  tax:810,   total:5310,  mode:'UPI',  status:'paid', stockAlert:null,        settlement:'settled' },
  { id:'PB002', ref:'POS-2526-1143', time:'09:52', counter:'Counter 2', customer:'Walk-in', items:1, amount:1800,  tax:324,   total:2124,  mode:'Cash', status:'paid', stockAlert:'Low stock', settlement:'open' },
  { id:'PB003', ref:'POS-2526-1144', time:'10:23', counter:'Counter 1', customer:'Ramesh Traders', items:5, amount:18000, tax:3240, total:21240, mode:'Card', status:'paid', stockAlert:null, settlement:'settled' },
  { id:'PB004', ref:'POS-2526-1145', time:'11:05', counter:'Counter 3', customer:'Walk-in', items:2, amount:3600,  tax:648,   total:4248,  mode:'UPI',  status:'paid', stockAlert:null,        settlement:'settled' },
  { id:'PB005', ref:'POS-2526-1146', time:'11:48', counter:'Counter 2', customer:'Walk-in', items:4, amount:7200,  tax:1296,  total:8496,  mode:'Cash', status:'paid', stockAlert:'Reorder',   settlement:'open' },
  { id:'PB006', ref:'POS-2526-1147', time:'12:30', counter:'Counter 1', customer:'Gupta Electricals', items:8, amount:42000, tax:7560, total:49560, mode:'Card', status:'paid', stockAlert:null, settlement:'settled' },
  { id:'PB007', ref:'POS-2526-1148', time:'13:15', counter:'Counter 3', customer:'Walk-in', items:1, amount:480,   tax:86,    total:566,   mode:'Cash', status:'paid', stockAlert:null,        settlement:'open' },
  { id:'PB008', ref:'POS-2526-1149', time:'14:02', counter:'Counter 2', customer:'Walk-in', items:3, amount:9000,  tax:1620,  total:10620, mode:'UPI',  status:'paid', stockAlert:null,        settlement:'settled' },
  { id:'PB009', ref:'POS-2526-1150', time:'14:45', counter:'Counter 1', customer:'Patel & Sons', items:6, amount:28000, tax:5040, total:33040, mode:'Card', status:'paid', stockAlert:'Low stock', settlement:'settled' },
  { id:'PB010', ref:'POS-2526-1151', time:'15:30', counter:'Counter 3', customer:'Walk-in', items:2, amount:1200,  tax:216,   total:1416,  mode:'Cash', status:'void', stockAlert:null,        settlement:'void' },
  { id:'PB011', ref:'POS-2526-1152', time:'16:20', counter:'Counter 2', customer:'Gupta Electricals', items:1, amount:-4200, tax:-756, total:-4956, mode:'UPI', status:'return', stockAlert:null, settlement:'refund due' },
]

export function getPOSBills() { return Promise.resolve([...POS_BILLS]) }
