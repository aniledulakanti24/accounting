import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getPayrollFundingRequests,
  getPayrollFundingSummary,
} from './payrollAccountingService.js'

test('payroll requests expose HR funding amounts for accounting approval', async () => {
  const requests = await getPayrollFundingRequests()

  assert.equal(requests.length, 3)
  assert.equal(requests[0].sourceModule, 'HR Payroll')
  assert.ok(requests.every((request) => request.amount > 0))
  assert.ok(requests.some((request) => request.status === 'pending'))
})

test('payroll summary totals requested, approved, paid, and pending payroll amount', async () => {
  const summary = await getPayrollFundingSummary()

  assert.equal(summary.totalRequested, 8425000)
  assert.equal(summary.pendingAmount, 2780000)
  assert.equal(summary.approvedAmount, 3825000)
  assert.equal(summary.paidAmount, 1820000)
})
