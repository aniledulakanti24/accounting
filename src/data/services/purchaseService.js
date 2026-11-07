/* ── Purchase Operations service — mock data ── */

export const PURCHASE_INVOICES = [
  { id:'PI001', ref:'PI-2526-0042', date:'2026-01-05', supplier:'Reliance Industries Ltd',   po:'PO-2526-0018', grn:'GRN-2526-0021', items:4, subtotal:1271186, gst:228814, total:1500000, paid:1500000, status:'paid',    dueDate:'2026-02-04', approval:'approved', itc:'matched',   tds:'not applicable', risk:'low',    nextAction:'Archive' },
  { id:'PI002', ref:'PI-2526-0039', date:'2025-12-28', supplier:'Adani Enterprises Ltd',     po:'PO-2526-0010', grn:'GRN-2526-0018', items:2, subtotal:847458,  gst:152542, total:1000000, paid:500000,  status:'partial', dueDate:'2026-01-27', approval:'approved', itc:'mismatch',  tds:'pending',        risk:'medium', nextAction:'Resolve ITC mismatch' },
  { id:'PI003', ref:'PI-2526-0036', date:'2025-12-20', supplier:'Tata Steel Ltd',            po:'PO-2526-0016', grn:'GRN-2526-0015', items:5, subtotal:635593,  gst:114407, total:750000,  paid:0,       status:'unpaid',  dueDate:'2026-01-19', approval:'pending',  itc:'matched',   tds:'not applicable', risk:'medium', nextAction:'Approve bill' },
  { id:'PI004', ref:'PI-2526-0031', date:'2025-12-12', supplier:'L&T Ltd',                   po:'PO-2526-0012', grn:'GRN-2526-0011', items:3, subtotal:508475,  gst:91525,  total:600000,  paid:0,       status:'overdue', dueDate:'2026-01-11', approval:'approved', itc:'missing 2B', tds:'pending',        risk:'high',   nextAction:'Hold payment until 2B match' },
  { id:'PI005', ref:'PI-2526-0027', date:'2025-12-05', supplier:'BHEL',                      po:'PO-2526-0014', grn:'GRN-2526-0010', items:6, subtotal:423729,  gst:76271,  total:500000,  paid:500000,  status:'paid',    dueDate:'2026-01-04', approval:'approved', itc:'matched',   tds:'not applicable', risk:'low',    nextAction:'Archive' },
  { id:'PI006', ref:'PI-2526-0022', date:'2025-11-28', supplier:'Maruti Suzuki India Ltd',   po:null,           grn:null,            items:1, subtotal:254237,  gst:45763,  total:300000,  paid:0,       status:'overdue', dueDate:'2025-12-28', approval:'pending',  itc:'missing 2B', tds:'not applicable', risk:'high',   nextAction:'Create GRN and approve' },
  { id:'PI007', ref:'PI-2526-0018', date:'2025-11-15', supplier:'Asian Paints Ltd',          po:'PO-2526-0008', grn:'GRN-2526-0007', items:3, subtotal:169492,  gst:30508,  total:200000,  paid:200000,  status:'paid',    dueDate:'2025-12-15', approval:'approved', itc:'matched',   tds:'not applicable', risk:'low',    nextAction:'Archive' },
  { id:'PI008', ref:'PI-2526-0014', date:'2025-11-05', supplier:'Ultratech Cement Ltd',      po:null,           grn:'GRN-2526-0004', items:2, subtotal:127119,  gst:22881,  total:150000,  paid:150000,  status:'paid',    dueDate:'2025-12-05', approval:'approved', itc:'matched',   tds:'not applicable', risk:'low',    nextAction:'Archive' },
]
export function getPurchaseInvoices() { return Promise.resolve([...PURCHASE_INVOICES]) }

export const PAYMENT_OUT = [
  { id:'PO001', ref:'PAY-2526-0031', date:'2026-01-06', supplier:'Reliance Industries Ltd',  invoice:'PI-2526-0042', amount:1500000, mode:'RTGS',   status:'cleared', approval:'released', bankStatus:'settled', maker:'Priya S' },
  { id:'PO002', ref:'PAY-2526-0028', date:'2025-12-30', supplier:'Adani Enterprises Ltd',    invoice:'PI-2526-0039', amount:500000,  mode:'NEFT',   status:'cleared', approval:'released', bankStatus:'settled', maker:'Rahul M' },
  { id:'PO003', ref:'PAY-2526-0025', date:'2025-12-18', supplier:'BHEL',                     invoice:'PI-2526-0027', amount:500000,  mode:'NEFT',   status:'cleared', approval:'released', bankStatus:'settled', maker:'Priya S' },
  { id:'PO004', ref:'PAY-2526-0020', date:'2025-12-16', supplier:'Asian Paints Ltd',         invoice:'PI-2526-0018', amount:200000,  mode:'Cheque', status:'cleared', approval:'released', bankStatus:'reconciled', maker:'Ankit R' },
  { id:'PO005', ref:'PAY-2526-0017', date:'2025-12-06', supplier:'Ultratech Cement Ltd',     invoice:'PI-2526-0014', amount:150000,  mode:'NEFT',   status:'cleared', approval:'released', bankStatus:'settled', maker:'Rahul M' },
  { id:'PO006', ref:'PAY-2526-0012', date:'2025-11-30', supplier:'L&T Ltd',                  invoice:'PI-2526-0031', amount:300000,  mode:'Cheque', status:'bounced', approval:'blocked',  bankStatus:'failed', maker:'Ankit R' },
]
export function getPaymentOut() { return Promise.resolve([...PAYMENT_OUT]) }

export const PURCHASE_RETURNS = [
  { id:'PR001', ref:'PR-2526-0005', date:'2026-01-08', supplier:'Tata Steel Ltd',      invoice:'PI-2526-0036', items:1, amount:95000,  reason:'Defective Material',       status:'approved' },
  { id:'PR002', ref:'PR-2526-0003', date:'2025-12-22', supplier:'Adani Enterprises',   invoice:'PI-2526-0039', items:1, amount:42000,  reason:'Wrong Specification',       status:'pending'  },
  { id:'PR003', ref:'PR-2526-0001', date:'2025-12-10', supplier:'Asian Paints Ltd',    invoice:'PI-2526-0018', items:2, amount:18000,  reason:'Excess Quantity',            status:'approved' },
]
export function getPurchaseReturns() { return Promise.resolve([...PURCHASE_RETURNS]) }

export const DEBIT_NOTES = [
  { id:'DN001', ref:'DN-2526-0006', date:'2026-01-09', supplier:'Tata Steel Ltd',      invoice:'PI-2526-0036', amount:95000,  reason:'Return — Defective',      status:'open'     },
  { id:'DN002', ref:'DN-2526-0004', date:'2025-12-25', supplier:'L&T Ltd',             invoice:'PI-2526-0031', amount:28000,  reason:'Price Correction',        status:'adjusted' },
  { id:'DN003', ref:'DN-2526-0002', date:'2025-12-12', supplier:'Asian Paints Ltd',    invoice:'PI-2526-0018', amount:18000,  reason:'Return — Excess Qty',     status:'adjusted' },
]
export function getDebitNotes() { return Promise.resolve([...DEBIT_NOTES]) }

export const PURCHASE_ORDERS = [
  { id:'PO001', ref:'PO-2526-0018', date:'2026-01-08', supplier:'Reliance Industries', items:3, amount:800000,  deliveryDate:'2026-01-25', status:'open',      approval:'approved', receivedQty:0,  orderedQty:30, stockAlert:'Reorder raw material', nextAction:'Receive goods' },
  { id:'PO002', ref:'PO-2526-0016', date:'2026-01-03', supplier:'Tata Steel Ltd',      items:5, amount:650000,  deliveryDate:'2026-01-20', status:'partial',   approval:'approved', receivedQty:18, orderedQty:50, stockAlert:'Production hold risk', nextAction:'Create balance GRN' },
  { id:'PO003', ref:'PO-2526-0014', date:'2025-12-28', supplier:'BHEL',                items:2, amount:500000,  deliveryDate:'2026-01-15', status:'received',  approval:'approved', receivedQty:20, orderedQty:20, stockAlert:null, nextAction:'Convert to bill' },
  { id:'PO004', ref:'PO-2526-0012', date:'2025-12-20', supplier:'L&T Ltd',             items:4, amount:420000,  deliveryDate:'2026-01-10', status:'received',  approval:'approved', receivedQty:40, orderedQty:40, stockAlert:null, nextAction:'Match invoice' },
  { id:'PO005', ref:'PO-2526-0010', date:'2025-12-15', supplier:'Adani Enterprises',   items:1, amount:1200000, deliveryDate:'2026-01-05', status:'cancelled', approval:'rejected', receivedQty:0,  orderedQty:10, stockAlert:null, nextAction:'Archive' },
  { id:'PO006', ref:'PO-2526-0008', date:'2025-12-05', supplier:'Asian Paints Ltd',    items:3, amount:180000,  deliveryDate:'2025-12-30', status:'received',  approval:'approved', receivedQty:30, orderedQty:30, stockAlert:null, nextAction:'Close PO' },
]
export function getPurchaseOrders() { return Promise.resolve([...PURCHASE_ORDERS]) }

export const GOODS_RECEIPTS = [
  { id:'GRN001', ref:'GRN-2526-0021', date:'2026-01-09', supplier:'Reliance Industries', po:'PO-2526-0018', warehouse:'Raw Ingredient Store', items:3, receivedQty:30, rejectedQty:0, landedCost:24000, match:'matched', bill:'PI-2526-0042', status:'accepted', nextAction:'Close receiving' },
  { id:'GRN002', ref:'GRN-2526-0018', date:'2026-01-02', supplier:'Adani Enterprises', po:'PO-2526-0010', warehouse:'Bulk Finished Store', items:2, receivedQty:10, rejectedQty:1, landedCost:18000, match:'price variance', bill:'PI-2526-0039', status:'hold', nextAction:'Resolve variance' },
  { id:'GRN003', ref:'GRN-2526-0015', date:'2025-12-22', supplier:'Tata Steel Ltd', po:'PO-2526-0016', warehouse:'Raw Ingredient Store', items:5, receivedQty:18, rejectedQty:2, landedCost:12500, match:'qty short', bill:'PI-2526-0036', status:'partial', nextAction:'Create balance GRN' },
  { id:'GRN004', ref:'GRN-2526-0011', date:'2025-12-14', supplier:'L&T Ltd', po:'PO-2526-0012', warehouse:'Finished Goods Store', items:3, receivedQty:40, rejectedQty:0, landedCost:9000, match:'matched', bill:'PI-2526-0031', status:'accepted', nextAction:'Match invoice' },
  { id:'GRN005', ref:'GRN-2526-0010', date:'2025-12-06', supplier:'BHEL', po:'PO-2526-0014', warehouse:'Packaging Store', items:6, receivedQty:20, rejectedQty:0, landedCost:7500, match:'matched', bill:'PI-2526-0027', status:'accepted', nextAction:'Convert to bill' },
  { id:'GRN006', ref:'GRN-2526-0004', date:'2025-11-08', supplier:'Ultratech Cement Ltd', po:null, warehouse:'Raw Ingredient Store', items:2, receivedQty:12, rejectedQty:0, landedCost:3000, match:'no po', bill:'PI-2526-0014', status:'review', nextAction:'Attach PO exception' },
]
export function getGoodsReceipts() { return Promise.resolve([...GOODS_RECEIPTS]) }

export const SUPPLIER_BILLS = [
  { id:'SB001', ref:'BILL-2526-0012', date:'2026-01-06', supplier:'AWS India Pvt Ltd',        category:'Cloud Services',  amount:85000,  dueDate:'2026-01-21', status:'unpaid',  recurring:'Monthly', approval:'pending',  upload:'OCR matched' },
  { id:'SB002', ref:'BILL-2526-0011', date:'2026-01-05', supplier:'Office Space Landlord',    category:'Rent',            amount:180000, dueDate:'2026-01-10', status:'paid',    recurring:'Monthly', approval:'approved', upload:'Auto-created' },
  { id:'SB003', ref:'BILL-2526-0010', date:'2025-12-31', supplier:'BSES Rajdhani Power',      category:'Electricity',     amount:42000,  dueDate:'2026-01-15', status:'paid',    recurring:'Monthly', approval:'approved', upload:'OCR matched' },
  { id:'SB004', ref:'BILL-2526-0009', date:'2025-12-30', supplier:'Airtel Business',          category:'Telecom',         amount:28000,  dueDate:'2026-01-14', status:'unpaid',  recurring:'Monthly', approval:'pending',  upload:'Email import' },
  { id:'SB005', ref:'BILL-2526-0008', date:'2025-12-28', supplier:'Sodexo India Pvt Ltd',     category:'Cafeteria',       amount:65000,  dueDate:'2026-01-12', status:'paid',    recurring:'No',      approval:'approved', upload:'Manual' },
  { id:'SB006', ref:'BILL-2526-0007', date:'2025-12-20', supplier:'Zomato Business',          category:'Office Supplies', amount:12000,  dueDate:'2026-01-04', status:'overdue', recurring:'No',      approval:'blocked',  upload:'Needs review' },
]
export function getSupplierBills() { return Promise.resolve([...SUPPLIER_BILLS]) }


/* Payables ageing buckets — derived from open purchase invoices + supplier bills */
export function getPayablesAgeing() {
  const today = new Date('2026-06-01')
  const buckets = { current: 0, b30: 0, b60: 0, b90: 0, older: 0 }
  const open = [
    ...PURCHASE_INVOICES.filter(i => i.status !== 'paid').map(i => ({ due: i.dueDate, amount: i.total - i.paid })),
    ...SUPPLIER_BILLS.filter(b => b.status !== 'paid').map(b => ({ due: b.dueDate, amount: b.amount })),
  ]
  open.forEach(({ due, amount }) => {
    const days = Math.floor((today - new Date(due)) / 86400000)
    if (days <= 0) buckets.current += amount
    else if (days <= 30) buckets.b30 += amount
    else if (days <= 60) buckets.b60 += amount
    else if (days <= 90) buckets.b90 += amount
    else buckets.older += amount
  })
  return Promise.resolve(buckets)
}

export const PURCHASE_ALERTS = [
  { id:'PA001', type:'approval', title:'3 purchase documents need approval', detail:'Tata Steel invoice, AWS bill, Airtel bill', severity:'warn' },
  { id:'PA002', type:'itc', title:'2 ITC issues before payment', detail:'Adani mismatch and L&T missing in 2B', severity:'risk' },
  { id:'PA003', type:'stock', title:'2 POs affect inventory availability', detail:'Reliance reorder and Tata Steel production hold risk', severity:'warn' },
  { id:'PA004', type:'payment', title:'1 payment blocked', detail:'L&T cheque bounced; retry via NEFT after approval', severity:'risk' },
]
export function getPurchaseAlerts() { return Promise.resolve([...PURCHASE_ALERTS]) }
