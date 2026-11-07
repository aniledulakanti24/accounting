import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDate } from './date.js'

test('formatDate returns day month year in Indian English format', () => {
  assert.equal(formatDate('2026-05-26'), '26 May 2026')
})
