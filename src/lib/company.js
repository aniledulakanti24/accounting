import { getCountryTaxConfig, validateCountryTaxId } from './countryTax.js'

export function validateCompanyDraft(draft) {
  const errors = {}
  const name = draft.name?.trim()
  const branch = draft.branch?.trim()
  const country = draft.country || 'IN'
  const taxId = (draft.taxId || draft.gstin)?.trim()
  const config = getCountryTaxConfig(country)

  if (!name) errors.name = 'Company name is required'
  if (!branch) errors.branch = 'Branch is required'

  if (taxId) {
    if (country === 'IN' && taxId.length !== 15) {
      errors.taxId = 'GSTIN must be 15 characters'
      errors.gstin = errors.taxId
    } else {
      const valResult = validateCountryTaxId(taxId, country)
      if (!valResult.valid) {
        errors.taxId = valResult.message || `Invalid ${config.taxIdLabel}`
        errors.gstin = errors.taxId
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function buildCompanyRecord(draft, sequence = Date.now()) {
  const country = draft.country || 'IN'
  const config = getCountryTaxConfig(country)
  const taxId = (draft.taxId || draft.gstin)?.trim().toUpperCase() ?? ''

  return {
    id: `c${sequence}`,
    name: draft.name?.trim() ?? '',
    country,
    countryName: config.name,
    countryFlag: config.flag,
    currency: config.currency,
    currencySymbol: config.currencySymbol,
    taxSystem: config.taxSystem,
    taxIdLabel: config.taxIdLabel,
    taxId,
    gstin: taxId, // backward-compatibility with existing views
    branch: draft.branch?.trim() ?? '',
    legalType: draft.legalType || config.legalTypes[0],
    departments: draft.departments
      ? draft.departments.split(',').map(item => item.trim()).filter(Boolean)
      : ['Accounts'],
    zones: draft.zones
      ? draft.zones.split(',').map(item => item.trim()).filter(Boolean)
      : config.regions.slice(0, 5),
  }
}
