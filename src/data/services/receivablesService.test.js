import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getCollectionById,
  getCreditNoteById,
  getCreditNoteNextAction,
  getSalesReturnById,
  getSalesReturnNextAction,
  getReminderCandidates,
  getARInvoiceById,
  getReceiptById,
  getReceiptsForInvoice,
  saveReceipt,
  updateReceipt,
} from './receivablesService.js'

test('receivables invoice lookup returns the invoice selected from the AR list', async () => {
  const invoice = await getARInvoiceById('AR002')

  assert.equal(invoice.ref, 'SI-2526-0099')
  assert.equal(invoice.customer, 'Tech Mahindra Limited')
})

test('invoice payment history returns only receipts linked to that invoice', async () => {
  const receipts = await getReceiptsForInvoice('SI-2526-0099')

  assert.equal(receipts.length, 1)
  assert.equal(receipts[0].ref, 'REC-2526-0055')
  assert.ok(receipts.every(receipt => receipt.invoice === 'SI-2526-0099'))
})

test('new customer payment is added to receipt history', async () => {
  const receipt = await saveReceipt({
    date: '2026-01-11',
    customer: 'HCL Technologies',
    invoice: 'SI-2526-0088',
    amount: 125000,
    mode: 'UPI',
    status: 'cleared',
    bankRef: 'UPI12345',
    notes: 'Part payment',
  })

  const history = await getReceiptsForInvoice('SI-2526-0088')

  assert.match(receipt.ref, /^REC-2526-/)
  assert.ok(history.some(row => row.id === receipt.id && row.amount === 125000))
})

test('existing customer payment can be edited', async () => {
  const updated = await updateReceipt('RC007', {
    date: '2026-01-06',
    customer: 'Infosys BPO Ltd',
    invoice: 'SI-2526-0108',
    amount: 1100000,
    mode: 'NEFT',
    status: 'cleared',
    bankRef: 'NEFT-UPDATED',
    allocationStatus: 'Matched',
    bankMatch: 'Bank matched',
    notes: 'Cleared by bank',
  })
  const fetched = await getReceiptById('RC007')

  assert.equal(updated.amount, 1100000)
  assert.equal(updated.status, 'cleared')
  assert.equal(fetched.bankRef, 'NEFT-UPDATED')
  assert.equal(fetched.allocationStatus, 'Matched')
  assert.equal(fetched.bankMatch, 'Bank matched')
})

test('receipt records expose allocation and bank match context', async () => {
  const bounced = await getReceiptById('RC006')
  const pending = await getReceiptById('RC007')

  assert.equal(bounced.allocationStatus, 'Unmatched')
  assert.equal(bounced.bankMatch, 'Failed')
  assert.equal(pending.allocationStatus, 'Matched')
  assert.equal(pending.bankMatch, 'Bank matched')
})

test('collection record lookup returns reminder workflow context', async () => {
  const collection = await getCollectionById('COL004')

  assert.equal(collection.customer, 'HCL Technologies')
  assert.equal(collection.invoice, 'SI-2526-0088')
  assert.equal(collection.risk, 'critical')
  assert.equal(collection.channel, 'WhatsApp')
  assert.equal(collection.deliveryStatus, 'Sent')
  assert.equal(collection.nextFollowUp, '2026-01-01')
})

test('reminder candidates include records that need follow up', async () => {
  const candidates = await getReminderCandidates()

  assert.ok(candidates.length > 0)
  assert.ok(candidates.some(row => row.id === 'COL004'))
  assert.ok(candidates.every(row =>
    row.status === 'open'
    || row.nextAction.toLowerCase().includes('reminder')
    || row.nextAction.toLowerCase().includes('demand')
    || row.nextAction.toLowerCase().includes('legal')
    || ['No response', 'Not viewed'].includes(row.statementStatus)
  ))
})

test('credit note lookup returns settlement workflow details', async () => {
  const note = await getCreditNoteById('CN002')

  assert.equal(note.ref, 'CN-2526-0010')
  assert.equal(note.customer, 'Tech Mahindra Limited')
  assert.equal(note.available, 40000)
})

test('credit note next action points users to the right settlement flow', () => {
  assert.equal(getCreditNoteNextAction({ available: 40000, approval: 'pending', gstStatus: 'pending' }), 'Approve credit note')
  assert.equal(getCreditNoteNextAction({ available: 40000, approval: 'approved', gstStatus: 'pending' }), 'Review GST reversal')
  assert.equal(getCreditNoteNextAction({ available: 40000, approval: 'approved', gstStatus: 'posted' }), 'Apply or refund credit')
  assert.equal(getCreditNoteNextAction({ available: 0, approval: 'approved', gstStatus: 'posted' }), 'Closed')
})

test('sales return lookup returns workflow details', async () => {
  const salesReturn = await getSalesReturnById('SR003')

  assert.equal(salesReturn.ref, 'SR-2526-0004')
  assert.equal(salesReturn.customer, 'Tech Mahindra Limited')
  assert.equal(salesReturn.outcome, 'Replacement')
  assert.equal(salesReturn.statutoryReason, '02-Post Sale Discount')
  assert.equal(salesReturn.ewayBillStatus, 'Customer return EWB needed')
})

test('sales return next action guides the return outcome', () => {
  assert.equal(getSalesReturnNextAction({ status: 'pending', goodsStatus: 'Awaiting receipt', outcome: 'Credit Note' }), 'Receive returned goods')
  assert.equal(getSalesReturnNextAction({ status: 'received', goodsStatus: 'Inspection', outcome: 'Credit Note' }), 'Inspect returned items')
  assert.equal(getSalesReturnNextAction({ status: 'received', goodsStatus: 'Damaged', outcome: 'Refund', ewayBillRequired: true, ewayBillStatus: 'Pending transporter details', gstStatus: 'pending' }), 'Prepare return e-way bill')
  assert.equal(getSalesReturnNextAction({ status: 'received', goodsStatus: 'Damaged', outcome: 'Refund', ewayBillRequired: false, gstStatus: 'pending' }), 'Review GST reversal')
  assert.equal(getSalesReturnNextAction({ status: 'received', goodsStatus: 'Restocked', outcome: 'Credit Note' }), 'Create credit note')
  assert.equal(getSalesReturnNextAction({ status: 'received', goodsStatus: 'Damaged', outcome: 'Refund', gstStatus: 'posted' }), 'Issue refund')
  assert.equal(getSalesReturnNextAction({ status: 'rejected', goodsStatus: 'Rejected', outcome: 'Reject' }), 'Closed')
})
