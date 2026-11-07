import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCompanyRecord, validateCompanyDraft } from './company.js'

test('company draft validation requires a company name and branch', () => {
  const result = validateCompanyDraft({ name: ' ', branch: '', gstin: '' })

  assert.equal(result.valid, false)
  assert.equal(result.errors.name, 'Company name is required')
  assert.equal(result.errors.branch, 'Branch is required')
})

test('company draft validation accepts empty GSTIN but validates supplied GSTIN format', () => {
  assert.equal(validateCompanyDraft({ name: 'Apex', branch: 'HO', gstin: '' }).valid, true)

  const result = validateCompanyDraft({ name: 'Apex', branch: 'HO', gstin: '123' })

  assert.equal(result.valid, false)
  assert.equal(result.errors.gstin, 'GSTIN must be 15 characters')
})

test('company record trims input, uppercases GSTIN, and generates a stable id prefix', () => {
  const company = buildCompanyRecord({
    name: '  Northwind Books LLP  ',
    branch: '  Pune  ',
    gstin: '27aabcu9603r1zx',
    legalType: 'LLP',
  }, 42)

  assert.equal(company.id, 'c42')
  assert.equal(company.name, 'Northwind Books LLP')
  assert.equal(company.branch, 'Pune')
  assert.equal(company.gstin, '27AABCU9603R1ZX')
  assert.equal(company.legalType, 'LLP')
  assert.equal(company.country, 'IN')
  assert.equal(company.currency, 'INR')
})

test('company validation and record creation supports US, UK, and UAE entities', () => {
  // US Company
  const usDraft = {
    name: 'UnifiedTree Inc',
    branch: 'San Francisco',
    country: 'US',
    taxId: '12-3456789',
    legalType: 'C-Corporation',
  }
  const usValidation = validateCompanyDraft(usDraft)
  assert.equal(usValidation.valid, true)
  const usCompany = buildCompanyRecord(usDraft, 101)
  assert.equal(usCompany.country, 'US')
  assert.equal(usCompany.currency, 'USD')
  assert.equal(usCompany.taxSystem, 'SalesTax')

  // UK Company
  const ukDraft = {
    name: 'UnifiedTree UK Ltd',
    branch: 'London',
    country: 'GB',
    taxId: 'GB 123 4567 89',
    legalType: 'Private Limited (Ltd)',
  }
  const ukValidation = validateCompanyDraft(ukDraft)
  assert.equal(ukValidation.valid, true)
  const ukCompany = buildCompanyRecord(ukDraft, 102)
  assert.equal(ukCompany.country, 'GB')
  assert.equal(ukCompany.currency, 'GBP')
  assert.equal(ukCompany.taxSystem, 'VAT')

  // UAE Company
  const uaeDraft = {
    name: 'UnifiedTree Middle East FZ-LLC',
    branch: 'Dubai Silicon Oasis',
    country: 'AE',
    taxId: '100234567800003',
  }
  const uaeValidation = validateCompanyDraft(uaeDraft)
  assert.equal(uaeValidation.valid, true)
  const uaeCompany = buildCompanyRecord(uaeDraft, 103)
  assert.equal(uaeCompany.country, 'AE')
  assert.equal(uaeCompany.currency, 'AED')
  assert.equal(uaeCompany.taxSystem, 'VAT')
})
