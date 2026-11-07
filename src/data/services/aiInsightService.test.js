import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAiDashboardInsights,
  getAccountantAlerts,
  getTemporaryCaAccess,
  createTemporaryCaAccess,
  revokeTemporaryCaAccess,
} from './aiInsightService.js'

test('AI dashboard insights include prioritized suggestions and alert summary', async () => {
  const result = await getAiDashboardInsights()

  assert.equal(result.summary.openAlerts, 9)
  assert.equal(result.suggestions[0].severity, 'critical')
  assert.match(result.suggestions[0].title, /collections/i)
  assert.ok(result.suggestions.every((item) => item.action))
})

test('accountant alerts can be filtered by alert type', async () => {
  const compliance = await getAccountantAlerts({ type: 'compliance' })

  assert.ok(compliance.length > 0)
  assert.ok(compliance.every((alert) => alert.type === 'compliance'))
  assert.ok(compliance.some((alert) => alert.owner === 'Accountant'))
})

test('temporary CA access can be created and revoked without changing the base list', async () => {
  const initial = await getTemporaryCaAccess()
  const created = await createTemporaryCaAccess({
    caName: 'Mehta & Co',
    scope: ['GST Returns', 'Audit Logs'],
    expiresInDays: 7,
  })

  assert.equal(created.status, 'active')
  assert.equal(created.scope.length, 2)
  assert.equal(initial.some((access) => access.id === created.id), false)

  const revoked = await revokeTemporaryCaAccess(created.id)
  assert.equal(revoked.status, 'revoked')
})
