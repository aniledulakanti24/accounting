/**
 * Receivables service — mock data.
 * AR Invoices mirror Sales Invoices (read-only sync).
 */

/* ── AR Invoices (synced from Sales) ── */
export const AR_INVOICES = [
  { id:'AR001', ref:'SI-2526-0108', date:'2025-12-18', customer:'Infosys BPO Ltd',       total:2850000, paid:0,       balance:2850000, status:'unpaid',  dueDate:'2026-01-17' },
  { id:'AR002', ref:'SI-2526-0099', date:'2025-12-10', customer:'Tech Mahindra Limited', total:1920000, paid:1600000, balance:320000,  status:'partial', dueDate:'2026-01-09' },
  { id:'AR003', ref:'SI-2526-0094', date:'2025-12-08', customer:'Wipro Digital Ltd',     total:1540000, paid:650000,  balance:890000,  status:'partial', dueDate:'2026-01-07' },
  { id:'AR004', ref:'SI-2526-0088', date:'2025-12-02', customer:'HCL Technologies',      total:980000,  paid:0,       balance:980000,  status:'overdue', dueDate:'2026-01-01' },
  { id:'AR005', ref:'SI-2526-0079', date:'2025-11-25', customer:'L&T Infotech Ltd',      total:680000,  paid:680000,  balance:0,       status:'paid',    dueDate:'2025-12-25' },
  { id:'AR006', ref:'SI-2526-0065', date:'2025-11-10', customer:'Tata Consultancy Svcs', total:620000,  paid:0,       balance:620000,  status:'overdue', dueDate:'2025-12-10' },
  { id:'AR007', ref:'SI-2526-0058', date:'2025-10-28', customer:'Mindtree Limited',      total:425000,  paid:425000,  balance:0,       status:'paid',    dueDate:'2025-11-27' },
  { id:'AR008', ref:'SI-2526-0042', date:'2025-10-05', customer:'Mphasis Corp India',    total:250000,  paid:250000,  balance:0,       status:'paid',    dueDate:'2025-11-04' },
]

export function getARInvoices() { return Promise.resolve([...AR_INVOICES]) }

export function getARInvoiceById(id) {
  return Promise.resolve(AR_INVOICES.find(invoice => invoice.id === id) ?? null)
}

/* ── Receipts ── */
export const RECEIPTS = [
  { id:'RC001', ref:'REC-2526-0055', date:'2026-01-05', customer:'Tech Mahindra Limited', invoice:'SI-2526-0099', amount:1600000, mode:'NEFT',   status:'cleared', bankRef:'NEFT234567', notes:'' },
  { id:'RC002', ref:'REC-2526-0052', date:'2025-12-28', customer:'Wipro Digital Ltd',     invoice:'SI-2526-0094', amount:650000,  mode:'RTGS',   status:'cleared', bankRef:'RTGS345678', notes:'' },
  { id:'RC003', ref:'REC-2526-0048', date:'2025-12-20', customer:'L&T Infotech Ltd',      invoice:'SI-2526-0079', amount:680000,  mode:'NEFT',   status:'cleared', bankRef:'NEFT445512', notes:'' },
  { id:'RC004', ref:'REC-2526-0045', date:'2025-12-15', customer:'Mindtree Limited',      invoice:'SI-2526-0058', amount:425000,  mode:'Cheque', status:'cleared', bankRef:'CHQ90421',  notes:'' },
  { id:'RC005', ref:'REC-2526-0041', date:'2025-12-08', customer:'Mphasis Corp India',    invoice:'SI-2526-0042', amount:250000,  mode:'UPI',    status:'cleared', bankRef:'UPI99887',   notes:'' },
  { id:'RC006', ref:'REC-2526-0038', date:'2025-12-05', customer:'HCL Technologies',      invoice:'SI-2526-0088', amount:500000,  mode:'Cheque', status:'bounced', bankRef:'CHQ77610',  notes:'Cheque bounced' },
  { id:'RC007', ref:'REC-2526-0030', date:'2025-11-28', customer:'Infosys BPO Ltd',       invoice:'SI-2526-0108', amount:1000000, mode:'NEFT',   status:'pending', bankRef:'NEFT123456', notes:'Awaiting bank clearance' },
]

let receiptsStore = [...RECEIPTS]

function inferReceiptAllocation(receipt) {
  if (receipt.status === 'bounced') return 'Unmatched'
  if (receipt.status === 'pending') return 'Pending Match'
  if (!receipt.invoice) return 'Advance'
  return 'Matched'
}

function inferBankMatch(receipt) {
  if (receipt.status === 'bounced') return 'Failed'
  if (receipt.status === 'pending') return 'Pending bank'
  return receipt.bankRef ? 'Bank matched' : 'Manual entry'
}

function cloneReceipt(receipt) {
  return receipt ? {
    ...receipt,
    allocationStatus: receipt.allocationStatus ?? inferReceiptAllocation(receipt),
    bankMatch: receipt.bankMatch ?? inferBankMatch(receipt),
  } : null
}

function nextReceiptNumber() {
  const max = receiptsStore.reduce((highest, receipt) => {
    const match = receipt.ref.match(/REC-2526-(\d+)/)
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)
  return String(max + 1).padStart(4, '0')
}

function normalizeReceipt(draft) {
  return {
    date: draft.date,
    customer: draft.customer,
    invoice: draft.invoice,
    amount: Number(draft.amount || 0),
    mode: draft.mode,
    status: draft.status,
    bankRef: draft.bankRef ?? '',
    notes: draft.notes ?? '',
    allocationStatus: draft.allocationStatus ?? 'Matched',
    bankMatch: draft.bankMatch ?? (draft.bankRef ? 'Bank matched' : 'Manual entry'),
  }
}

export function getReceipts() { return Promise.resolve(receiptsStore.map(cloneReceipt)) }

export function getReceiptById(id) {
  return Promise.resolve(cloneReceipt(receiptsStore.find(receipt => receipt.id === id)))
}

export function getReceiptsForInvoice(invoiceRef) {
  return Promise.resolve(receiptsStore.filter(receipt => receipt.invoice === invoiceRef).map(cloneReceipt))
}

export function saveReceipt(draft) {
  const record = {
    id: `RC${Date.now()}`,
    ref: `REC-2526-${nextReceiptNumber()}`,
    ...normalizeReceipt(draft),
  }
  receiptsStore = [record, ...receiptsStore]
  return Promise.resolve(cloneReceipt(record))
}

export function updateReceipt(id, draft) {
  const existing = receiptsStore.find(receipt => receipt.id === id)
  if (!existing) return Promise.resolve(null)
  const updated = { ...existing, ...normalizeReceipt(draft) }
  receiptsStore = receiptsStore.map(receipt => receipt.id === id ? updated : receipt)
  return Promise.resolve(cloneReceipt(updated))
}

/* ── Credit Notes ── */
export const CREDIT_NOTES = [
  { id:'CN001', ref:'CN-2526-0012', date:'2026-01-08', customer:'Wipro Digital Ltd',     invoice:'SI-2526-0094', amount:95000,  applied:95000, refunded:0,     available:0,     reason:'Price Correction', status:'adjusted', approval:'approved', gstStatus:'posted',  settlement:'Applied to invoice', taxReversal:14491 },
  { id:'CN002', ref:'CN-2526-0010', date:'2025-12-22', customer:'Tech Mahindra Limited', invoice:'SI-2526-0099', amount:40000,  applied:0,     refunded:0,     available:40000, reason:'Short Delivery',   status:'open',     approval:'pending',  gstStatus:'pending', settlement:'Open credit',        taxReversal:6102  },
  { id:'CN003', ref:'CN-2526-0008', date:'2025-12-15', customer:'HCL Technologies',      invoice:'SI-2526-0088', amount:25000,  applied:0,     refunded:25000, available:0,     reason:'Defective Goods',  status:'refunded', approval:'approved', gstStatus:'posted',  settlement:'Refunded to bank',  taxReversal:3814  },
  { id:'CN004', ref:'CN-2526-0005', date:'2025-12-01', customer:'Mindtree Limited',      invoice:'SI-2526-0058', amount:18000,  applied:18000, refunded:0,     available:0,     reason:'Billing Error',    status:'adjusted', approval:'approved', gstStatus:'posted',  settlement:'Adjusted',          taxReversal:2746  },
  { id:'CN005', ref:'CN-2526-0003', date:'2025-11-20', customer:'L&T Infotech Ltd',      invoice:'SI-2526-0079', amount:52000,  applied:20000, refunded:0,     available:32000, reason:'Goods Returned',   status:'open',     approval:'approved', gstStatus:'pending', settlement:'Part applied',      taxReversal:7932  },
]

export function getCreditNoteNextAction(note) {
  if ((note.available ?? 0) <= 0) return 'Closed'
  if (note.approval !== 'approved') return 'Approve credit note'
  if (note.gstStatus !== 'posted') return 'Review GST reversal'
  return 'Apply or refund credit'
}

export function getCreditNotes() {
  return Promise.resolve(CREDIT_NOTES.map(note => ({ ...note, nextAction: getCreditNoteNextAction(note) })))
}

export function getCreditNoteById(id) {
  const note = CREDIT_NOTES.find(item => item.id === id)
  return Promise.resolve(note ? { ...note, nextAction: getCreditNoteNextAction(note) } : null)
}

/* ── Sales Returns ── */
export const SALES_RETURNS = [
  { id:'SR001', ref:'SR-2526-0008', date:'2026-01-10', customer:'HCL Technologies',      invoice:'SI-2526-0088', items:1, amount:125000, reason:'Defective — DOA',         status:'received' },
  { id:'SR002', ref:'SR-2526-0006', date:'2025-12-28', customer:'Wipro Digital Ltd',     invoice:'SI-2526-0094', items:2, amount:86000,  reason:'Wrong Spec Delivered',    status:'received' },
  { id:'SR003', ref:'SR-2526-0004', date:'2025-12-14', customer:'Tech Mahindra Limited', invoice:'SI-2526-0099', items:1, amount:42000,  reason:'Surplus — Client Change', status:'pending'  },
  { id:'SR004', ref:'SR-2526-0002', date:'2025-11-25', customer:'L&T Infotech Ltd',      invoice:'SI-2526-0079', items:3, amount:55000,  reason:'Quality Mismatch',        status:'rejected' },
]

const SALES_RETURN_WORKFLOW = {
  SR001: { goodsStatus:'Damaged',          outcome:'Refund',      gstStatus:'pending', inventoryImpact:'Quarantine',     approval:'approved' },
  SR002: { goodsStatus:'Restocked',        outcome:'Credit Note', gstStatus:'posted',  inventoryImpact:'Stock increased', approval:'approved' },
  SR003: { goodsStatus:'Awaiting receipt', outcome:'Replacement', gstStatus:'pending', inventoryImpact:'No stock impact', approval:'pending' },
  SR004: { goodsStatus:'Rejected',         outcome:'Reject',      gstStatus:'none',    inventoryImpact:'No stock impact', approval:'rejected' },
}

const SALES_RETURN_CONTROL_DETAILS = {
  SR001: { invoiceDate:'2025-12-02', taxableValue:105932, taxRate:18, taxReversal:19068, statutoryReason:'01-Sales Return', gstReturnPeriod:'Jan 2026', creditNoteRef:'Draft CN', approvalStage:'Finance approved', ewayBillRequired:true,  ewayBillStatus:'Pending transporter details', disposition:'Quarantine bin',      warehouse:'Bengaluru WH', inspectionOwner:'Kavya R', refundMode:'Bank transfer',      refundStatus:'Ready for payout',   documentStatus:'Photos attached' },
  SR002: { invoiceDate:'2025-12-08', taxableValue:72881,  taxRate:18, taxReversal:13119, statutoryReason:'01-Sales Return', gstReturnPeriod:'Dec 2025', creditNoteRef:'CN-2526-0012', approvalStage:'Closed by AR lead', ewayBillRequired:false, ewayBillStatus:'Not required',                 disposition:'Restocked saleable', warehouse:'Pune WH',      inspectionOwner:'Meera S', refundMode:'Credit adjustment', refundStatus:'Applied to invoice', documentStatus:'Inspection note attached' },
  SR003: { invoiceDate:'2025-12-10', taxableValue:35593,  taxRate:18, taxReversal:6407,  statutoryReason:'02-Post Sale Discount', gstReturnPeriod:'Dec 2025', creditNoteRef:'Not required', approvalStage:'Awaiting warehouse receipt', ewayBillRequired:true, ewayBillStatus:'Customer return EWB needed', disposition:'Awaiting pickup',    warehouse:'Mumbai WH',    inspectionOwner:'Rohit M', refundMode:'Replacement order', refundStatus:'Hold until receipt', documentStatus:'Pickup proof pending' },
  SR004: { invoiceDate:'2025-11-25', taxableValue:46610,  taxRate:18, taxReversal:8390,  statutoryReason:'01-Sales Return', gstReturnPeriod:'Nov 2025', creditNoteRef:'Rejected', approvalStage:'Rejected by QA', ewayBillRequired:false, ewayBillStatus:'Not required',                 disposition:'Rejected at gate',   warehouse:'Chennai WH',   inspectionOwner:'Asha N',  refundMode:'None',              refundStatus:'Closed',             documentStatus:'Reason recorded' },
}

export function getSalesReturnNextAction(row) {
  if (row.status === 'rejected') return 'Closed'
  if (row.goodsStatus === 'Awaiting receipt') return 'Receive returned goods'
  if (row.goodsStatus === 'Inspection') return 'Inspect returned items'
  if (row.ewayBillRequired && row.ewayBillStatus !== 'Generated') return 'Prepare return e-way bill'
  if (row.gstStatus === 'pending' && row.outcome !== 'Reject') return 'Review GST reversal'
  if (row.outcome === 'Credit Note') return 'Create credit note'
  if (row.outcome === 'Refund') return 'Issue refund'
  if (row.outcome === 'Replacement') return 'Arrange replacement'
  return 'Review return'
}

function enrichSalesReturn(row) {
  const enriched = {
    ...row,
    ...(SALES_RETURN_WORKFLOW[row.id] ?? {}),
    ...(SALES_RETURN_CONTROL_DETAILS[row.id] ?? {}),
  }
  return { ...enriched, nextAction: getSalesReturnNextAction(enriched) }
}

export function getSalesReturns() {
  return Promise.resolve(SALES_RETURNS.map(enrichSalesReturn))
}

export function getSalesReturnById(id) {
  const row = SALES_RETURNS.find(item => item.id === id)
  return Promise.resolve(row ? enrichSalesReturn(row) : null)
}

/* ── AR Ageing ── */
export const AR_AGEING = [
  { id:'AG001', customer:'Infosys BPO Ltd',       total:2850000, current:0,      d31_60:0,      d61_90:0,     d90plus:2850000 },
  { id:'AG002', customer:'Tech Mahindra Limited', total:320000,  current:320000, d31_60:0,      d61_90:0,     d90plus:0       },
  { id:'AG003', customer:'Wipro Digital Ltd',     total:890000,  current:890000, d31_60:0,      d61_90:0,     d90plus:0       },
  { id:'AG004', customer:'HCL Technologies',      total:980000,  current:0,      d31_60:980000, d61_90:0,     d90plus:0       },
  { id:'AG005', customer:'Tata Consultancy Svcs', total:620000,  current:0,      d31_60:0,      d61_90:620000,d90plus:0       },
]

export function getARAgeing() { return Promise.resolve([...AR_AGEING]) }

/* ── Collections ── */
export const COLLECTIONS = [
  { id:'COL001', customer:'Infosys BPO Ltd',       invoice:'SI-2526-0108', amount:2850000, dueDate:'2026-01-17', daysOverdue:0,  lastContact:'2026-01-05', nextAction:'Send reminder', assignee:'Priya S',  status:'contacted', risk:'watch',    promiseDate:null,         promiseAmount:0,      reminderCount:2, lastReminder:'2026-01-05', channel:'WhatsApp', statementStatus:'Viewed',   note:'High-value account, polite pre-due reminder recommended.' },
  { id:'COL002', customer:'Tech Mahindra Limited', invoice:'SI-2526-0099', amount:320000,  dueDate:'2026-01-09', daysOverdue:0,  lastContact:'2026-01-06', nextAction:'Confirm ETA',   assignee:'Rahul M',  status:'promised',  risk:'medium',   promiseDate:'2026-01-09', promiseAmount:320000, reminderCount:1, lastReminder:'2026-01-06', channel:'Phone',    statementStatus:'Promised', note:'Customer promised same-day balance transfer.' },
  { id:'COL003', customer:'Wipro Digital Ltd',     invoice:'SI-2526-0094', amount:890000,  dueDate:'2026-01-07', daysOverdue:2,  lastContact:'2026-01-04', nextAction:'Escalate',      assignee:'Priya S',  status:'open',      risk:'high',     promiseDate:null,         promiseAmount:0,      reminderCount:3, lastReminder:'2026-01-04', channel:'Email',    statementStatus:'No response', note:'Escalate to finance manager if no reply today.' },
  { id:'COL004', customer:'HCL Technologies',      invoice:'SI-2526-0088', amount:980000,  dueDate:'2026-01-01', daysOverdue:8,  lastContact:'2025-12-30', nextAction:'Legal notice',  assignee:'Ankit R',  status:'open',      risk:'critical', promiseDate:null,         promiseAmount:0,      reminderCount:4, lastReminder:'2025-12-30', channel:'WhatsApp', statementStatus:'Not viewed', note:'Compliance block reported; attach invoice and call before notice.' },
  { id:'COL005', customer:'Tata Consultancy Svcs', invoice:'SI-2526-0065', amount:620000,  dueDate:'2025-12-10', daysOverdue:30, lastContact:'2025-12-28', nextAction:'Final demand',  assignee:'Ankit R',  status:'contacted', risk:'critical', promiseDate:'2026-01-03', promiseAmount:620000, reminderCount:5, lastReminder:'2025-12-28', channel:'Email',    statementStatus:'Disputed', note:'Promise date missed. Move to final demand and dispute review.' },
]

function getCollectionDeliveryStatus(collection) {
  if (collection.status === 'promised') return 'Replied'
  if (collection.statementStatus === 'Viewed') return 'Viewed'
  if (collection.statementStatus === 'Disputed') return 'Replied'
  if (collection.statementStatus === 'Not viewed') return 'Sent'
  if (collection.statementStatus === 'No response') return 'Sent'
  return 'Draft'
}

function enrichCollection(collection) {
  const deliveryStatus = collection.deliveryStatus ?? getCollectionDeliveryStatus(collection)
  const nextFollowUp = collection.promiseDate ?? collection.dueDate
  return { ...collection, deliveryStatus, nextFollowUp }
}

export function getCollections() { return Promise.resolve(COLLECTIONS.map(enrichCollection)) }

export function getCollectionById(id) {
  const collection = COLLECTIONS.find(row => row.id === id)
  return Promise.resolve(collection ? enrichCollection(collection) : null)
}

function collectionNeedsReminder(collection) {
  return collection.status === 'open'
    || collection.nextAction.toLowerCase().includes('reminder')
    || collection.nextAction.toLowerCase().includes('demand')
    || collection.nextAction.toLowerCase().includes('legal')
    || collection.statementStatus === 'No response'
    || collection.statementStatus === 'Not viewed'
}

export function getReminderCandidates() {
  return Promise.resolve(COLLECTIONS.filter(collectionNeedsReminder).map(enrichCollection))
}
