import test from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from './mockServer.js'
import { trialBalance, ensureLedger } from './ledgerServer.js'
import { ensureBooks } from './booksServer.js'
import { parseTallyXml, importTally, importInvoiceCsv, SAMPLE_TALLY_XML } from './migrationServer.js'

const company = { id: 'mig-unit-IN', country: 'IN', name: 'Migration Test Ltd', taxId: '27AABCU9603R1ZX' }
const fresh = () => { const db = { returns: [] }; ensureBooks(db, company); return { db, company } }

test('Tally XML: ledgers keep their group, Tally signs (negative = debit) are respected', () => {
  const { ledgers, vouchers } = parseTallyXml(SAMPLE_TALLY_XML)
  assert.equal(ledgers.length, 8)
  assert.equal(ledgers.find(l => l.name === 'Output CGST').group, 'Duties & Taxes', 'XML entities decoded')
  assert.equal(ledgers.find(l => l.name === 'Sharma Traders').mapped.party, 'customer')
  assert.equal(vouchers[0].date, '2026-10-20')
  assert.equal(vouchers[0].entries[0].amount, -59000)
  assert.throws(() => parseTallyXml('<xml/>'), /Tally XML/)
})

test('a Tally import previews first, then posts balanced journals and creates parties', () => {
  const ctx = fresh()
  const before = ensureLedger(ctx.db).journals.length
  const preview = importTally(ctx, SAMPLE_TALLY_XML)
  assert.equal(preview.dryRun, true)
  assert.equal(ensureLedger(ctx.db).journals.length, before, 'a preview writes nothing')
  assert.equal(preview.vouchers, 2)
  assert.equal(preview.parties, 2)
  const done = importTally(ctx, SAMPLE_TALLY_XML, { dryRun: false })
  assert.equal(done.posted.length, 3, 'opening balances + 2 vouchers')
  assert.ok(ctx.db.books.parties.some(p => p.name === 'Sharma Traders' && p.gstin === '27AAPFS1234Q1Z5'))
  const sale = ensureLedger(ctx.db).journals.find(j => j.memo.includes('S-101'))
  assert.equal(sale.lines.find(l => l.accountName === 'Accounts Receivable').debit, 59000)
  assert.equal(sale.lines.filter(l => l.accountName === 'Output Tax Payable').reduce((s, l) => s + l.credit, 0), 9000, 'CGST + SGST')
  assert.ok(trialBalance(ctx.db).balanced)
})

test('an unbalanced Tally voucher is reported and skipped, not posted', () => {
  const ctx = fresh()
  const bad = SAMPLE_TALLY_XML.replace('<AMOUNT>45000</AMOUNT>', '<AMOUNT>44000</AMOUNT>')
  const r = importTally(ctx, bad)
  assert.equal(r.vouchers, 1)
  assert.ok(r.issues.some(i => i.level === 'error' && /does not balance/.test(i.message)))
})

test('Zoho / QuickBooks invoice CSV groups lines by invoice and adds new customers', () => {
  const ctx = fresh()
  const csv = 'Invoice Number,Invoice Date,Customer Name,Item Name,Quantity,Item Price,Tax %\nINV-9,03/10/2026,Acme Corp,Design,2,5000,18%\nINV-9,03/10/2026,Acme Corp,Hosting,1,1000,18%\nINV-10,05/10/2026,Beta LLP,Audit,1,20000,18'
  const p = importInvoiceCsv(ctx, csv)
  assert.deepEqual([p.invoices, p.newCustomers, p.total], [2, 2, 36580])
  const r = importInvoiceCsv(ctx, csv, { dryRun: false })
  assert.equal(r.created.length, 2)
  assert.ok(trialBalance(ctx.db).balanced)
})

test('accountant invites, support response targets and help search', async () => {
  const co = { id: 'mig-api-IN', country: 'IN', name: 'Mig API Ltd', taxId: '27AABCU9603R1ZX' }
  const token = (await handleRequest({ method: 'POST', url: '/auth/login', body: { email: 'priya@unifiedtree.demo', password: 'Demo@2026' } })).data.token
  const call = (method, url, body) => handleRequest({ method, url, body, token, company: co })
  const inv = await call('POST', '/accountants', { email: 'ca@mehtarao.example', firm: 'Mehta & Rao' })
  assert.equal(inv.data.role, 'CA / Auditor')
  assert.equal((await call('POST', '/accountants', { email: 'ca@mehtarao.example' })).status, 422, 'no duplicate invites')
  const t = (await call('POST', '/support/tickets', { subject: 'GSTR-2B credit held back', message: 'Why?', priority: 'high' })).data
  const hours = (new Date(t.respondBy) - new Date(t.openedAt)) / 3600000
  assert.ok(Math.abs(hours - 4) < 0.01, 'high priority = 4-hour response target')
  assert.ok(t.suggested.length >= 1, 'related help is suggested')
  const help = (await call('GET', '/help/articles?q=tally')).data
  assert.match(help[0].title, /Tally/)
  const partners = (await call('GET', '/partners')).data
  assert.equal(partners[0].country, 'IN', 'your country first')
})
