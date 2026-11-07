/**
 * Country-Based Multi-Tax Architecture & Localization Engine
 * Single Source of Truth for international tax regimes, IDs, rules, and currencies.
 */

import { WORLD_COUNTRY_ROWS } from './countries/worldCountries.js'
import { DEEP_COUNTRIES, DEEP_RATES } from './countries/deepCountries.js'

/* The original eight hand-built profiles */
const CORE_COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    taxSystem: 'GST',
    taxSystemName: 'Goods and Services Tax',
    taxIdLabel: 'GSTIN',
    secondaryIdLabel: 'PAN',
    taxIdPlaceholder: '27AABCU9603R1ZX',
    taxIdRegex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    secondaryIdPlaceholder: 'AABCU9603R',
    codeLabel: 'HSN / SAC Code',
    invoiceTitle: 'Tax Invoice',
    fiscalYearStartMonth: 4, // April
    regions: [
      'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana',
      'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Haryana', 'Rajasthan',
      'Kerala', 'Madhya Pradesh', 'Punjab', 'Andhra Pradesh', 'Bihar',
    ],
    legalTypes: ['Private Limited', 'Public Limited', 'LLP', 'Partnership', 'Proprietorship', 'One Person Company'],
    hasEInvoice: true,
    hasEWayBill: true,
    hasWithholding: true,
    withholdingName: 'TDS / TCS',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    taxSystem: 'SalesTax',
    taxSystemName: 'State & Local Sales Tax',
    taxIdLabel: 'EIN / SSN',
    secondaryIdLabel: 'State Tax ID',
    taxIdPlaceholder: '12-3456789',
    taxIdRegex: /^\d{2}-?\d{7}$|^\d{3}-?\d{2}-?\d{4}$/,
    secondaryIdPlaceholder: 'CA-9876543',
    codeLabel: 'Tax Category / UNSPSC',
    invoiceTitle: 'Sales Invoice',
    fiscalYearStartMonth: 1, // January
    regions: [
      'California', 'New York', 'Texas', 'Florida', 'Illinois',
      'Washington', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina',
      'Massachusetts', 'Virginia', 'New Jersey', 'Colorado', 'Arizona',
    ],
    legalTypes: ['C-Corporation', 'S-Corporation', 'LLC', 'Sole Proprietorship', 'General Partnership'],
    hasEInvoice: false,
    hasEWayBill: false,
    hasWithholding: true,
    withholdingName: 'Form 1099 Withholding',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    taxSystem: 'VAT',
    taxSystemName: 'Value Added Tax (HMRC MTD)',
    taxIdLabel: 'VAT Reg No',
    secondaryIdLabel: 'Company Reg (CRN)',
    taxIdPlaceholder: 'GB 123 4567 89',
    taxIdRegex: /^(GB)?\s?([0-9]{9}|[0-9]{12}|(GD|HA)[0-9]{3})$/i,
    secondaryIdPlaceholder: '12345678',
    codeLabel: 'Commodity Code',
    invoiceTitle: 'VAT Invoice',
    fiscalYearStartMonth: 4, // April
    regions: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Greater London', 'West Midlands'],
    legalTypes: ['Private Limited (Ltd)', 'Public Limited Company (PLC)', 'Limited Liability Partnership (LLP)', 'Sole Trader'],
    hasEInvoice: true,
    hasEWayBill: false,
    hasWithholding: false,
    withholdingName: 'CIS Withholding',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED',
    locale: 'en-AE',
    taxSystem: 'VAT',
    taxSystemName: 'Federal Tax Authority (FTA) VAT',
    taxIdLabel: 'TRN',
    secondaryIdLabel: 'Trade License No',
    taxIdPlaceholder: '100234567800003',
    taxIdRegex: /^100\d{12}$/,
    secondaryIdPlaceholder: 'TL-564738',
    codeLabel: 'Harmonized System Code',
    invoiceTitle: 'Tax Invoice',
    fiscalYearStartMonth: 1, // January
    regions: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    legalTypes: ['Free Zone LLC (FZ-LLC)', 'Mainland LLC', 'Branch of Foreign Company', 'Sole Establishment'],
    hasEInvoice: true,
    hasEWayBill: false,
    hasWithholding: false,
    withholdingName: 'None',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: '$',
    locale: 'en-CA',
    taxSystem: 'GST_HST',
    taxSystemName: 'GST / HST / PST',
    taxIdLabel: 'Business Number (BN)',
    secondaryIdLabel: 'PST Number',
    taxIdPlaceholder: '123456789 RT0001',
    taxIdRegex: /^\d{9}(\s?RT\d{4})?$/i,
    secondaryIdPlaceholder: 'PST-1234-5678',
    codeLabel: 'Product Tax Classification',
    invoiceTitle: 'Invoice',
    fiscalYearStartMonth: 1,
    regions: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Nova Scotia', 'Saskatchewan'],
    legalTypes: ['Federal Corporation', 'Provincial Corporation', 'Partnership', 'Sole Proprietorship'],
    hasEInvoice: false,
    hasEWayBill: false,
    hasWithholding: false,
    withholdingName: 'T4A Withholding',
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: '$',
    locale: 'en-AU',
    taxSystem: 'GST',
    taxSystemName: 'Goods and Services Tax (ATO)',
    taxIdLabel: 'ABN',
    secondaryIdLabel: 'ACN',
    taxIdPlaceholder: '12 345 678 901',
    taxIdRegex: /^(\d\s?){11}$/,
    secondaryIdPlaceholder: '123 456 789',
    codeLabel: 'ATO Tax Category',
    invoiceTitle: 'Tax Invoice',
    fiscalYearStartMonth: 7, // July
    regions: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania'],
    legalTypes: ['Proprietary Limited (Pty Ltd)', 'Public Company (Ltd)', 'Partnership', 'Sole Trader'],
    hasEInvoice: true,
    hasEWayBill: false,
    hasWithholding: true,
    withholdingName: 'PAYG Withholding',
  },
  {
    code: 'DE',
    name: 'Germany (EU)',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    taxSystem: 'VAT',
    taxSystemName: 'Umsatzsteuer (USt / VAT)',
    taxIdLabel: 'USt-IdNr',
    secondaryIdLabel: 'Steuernummer',
    taxIdPlaceholder: 'DE 123456789',
    taxIdRegex: /^DE\s?[0-9]{9}$/i,
    secondaryIdPlaceholder: '12/345/67890',
    codeLabel: 'Warennummer (Commodity Code)',
    invoiceTitle: 'Rechnung (VAT Invoice)',
    fiscalYearStartMonth: 1,
    regions: ['Bavaria', 'Berlin', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Hamburg'],
    legalTypes: ['GmbH', 'AG', 'UG (haftungsbeschränkt)', 'GmbH & Co. KG', 'Einzelunternehmen'],
    hasEInvoice: true,
    hasEWayBill: false,
    hasWithholding: false,
    withholdingName: 'Bauabzugsteuer',
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    currencySymbol: '$',
    locale: 'en-SG',
    taxSystem: 'GST',
    taxSystemName: 'Goods & Services Tax (IRAS)',
    taxIdLabel: 'UEN / GST Reg No',
    secondaryIdLabel: 'ACRA Reg',
    taxIdPlaceholder: '201912345A',
    taxIdRegex: /^[0-9]{8,9}[A-Z]$|^T[0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]$/i,
    secondaryIdPlaceholder: '201912345A',
    codeLabel: 'Product Tax Code',
    invoiceTitle: 'Tax Invoice',
    fiscalYearStartMonth: 1,
    regions: ['Central', 'East', 'North', 'North-East', 'West'],
    legalTypes: ['Private Limited (Pte Ltd)', 'Public Company', 'LLP', 'Sole Proprietorship'],
    hasEInvoice: true,
    hasEWayBill: false,
    hasWithholding: true,
    withholdingName: 'IRAS Withholding',
  },
]

/** Emoji flag from an ISO 3166-1 alpha-2 code. */
export function flagFor(code) {
  return String(code).toUpperCase().replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

/** Narrow currency symbol for any ISO 4217 code (e.g. KES → Ksh, BRL → R$). */
export function symbolFor(currency, locale = 'en') {
  try {
    const part = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find(p => p.type === 'currency')
    return part?.value || currency
  } catch {
    return currency
  }
}

const SYSTEM_NAMES = {
  VAT: 'Value Added Tax', GST: 'Goods and Services Tax', SalesTax: 'Sales Tax',
  SST: 'Sales and Service Tax', Other: 'Indirect tax', None: 'No VAT / GST',
}

/** Build a basic profile from a WORLD_COUNTRY_ROWS row. */
function basicCountry([code, name, currency, system, localName, standard, reduced, fyStart, taxIdLabel, authority, eInvoicing, verify]) {
  const shortName = system === 'None' ? 'No VAT' : localName
  return {
    code, name, flag: flagFor(code), currency, currencySymbol: symbolFor(currency),
    locale: `en-${code}`,
    taxSystem: system, taxShortName: shortName,
    taxSystemName: system === 'None' ? 'No VAT / GST' : (localName && localName !== system ? `${SYSTEM_NAMES[system]} (${localName})` : SYSTEM_NAMES[system]),
    taxIdLabel, secondaryIdLabel: 'Company registration No',
    taxIdPlaceholder: '', taxIdRegex: null, secondaryIdPlaceholder: '',
    codeLabel: 'HS code', invoiceTitle: system === 'None' ? 'Invoice' : 'Tax Invoice',
    fiscalYearStartMonth: fyStart,
    regions: ['Head Office'],
    legalTypes: ['Limited company', 'Branch of foreign company', 'Partnership', 'Sole proprietorship'],
    hasEInvoice: !!eInvoicing, eInvoicingName: eInvoicing || null,
    hasEWayBill: false, hasWithholding: false, withholdingName: 'Withholding tax',
    authority, standardRate: standard, reducedRates: reduced,
    tier: 'basic', verify: !!verify,
  }
}

const DEEP_CODES = new Set([...CORE_COUNTRIES, ...DEEP_COUNTRIES].map(c => c.code))

/**
 * Every country: 25 full profiles (filing, e-invoicing, withholding) and a
 * basic profile (currency, tax name, rates, tax ID, fiscal year) for the rest.
 */
export const SUPPORTED_COUNTRIES = [
  ...CORE_COUNTRIES.map(c => ({ ...c, taxShortName: c.taxShortName ?? c.taxSystem, tier: 'full' })),
  ...DEEP_COUNTRIES.map(c => ({ ...c, flag: flagFor(c.code), currencySymbol: symbolFor(c.currency), tier: 'full' })),
  ...WORLD_COUNTRY_ROWS.filter(r => !DEEP_CODES.has(r[0])).map(basicCountry),
].sort((a, b) => a.name.localeCompare(b.name))

export const COUNTRY_BY_CODE = Object.fromEntries(
  SUPPORTED_COUNTRIES.map(c => [c.code, c])
)

export function getCountryTaxConfig(code = 'IN') {
  return COUNTRY_BY_CODE[code] || COUNTRY_BY_CODE.IN
}

/* ── Country-Specific Seed Tax Rates ── */
const CORE_TAX_RATES = {
  IN: [
    { id: 'IN-T01', taxType: 'GST', code: 'GST-0', name: 'GST 0% (Exempt)', rate: 0, component: 'IGST or CGST+SGST', applicableOn: 'Exempt Items', status: 'active' },
    { id: 'IN-T02', taxType: 'GST', code: 'GST-5', name: 'GST 5%', rate: 5, component: 'IGST or 2.5% CGST + 2.5% SGST', applicableOn: 'Essential Goods', status: 'active' },
    { id: 'IN-T03', taxType: 'GST', code: 'GST-40', name: 'GST 40% (Demerit / luxury)', rate: 40, component: 'IGST or 20% CGST + 20% SGST', applicableOn: 'Sin and luxury goods (GST 2.0, from 22 Sep 2025)', status: 'active' },
    { id: 'IN-T04', taxType: 'GST', code: 'GST-18', name: 'GST 18% (Standard)', rate: 18, component: 'IGST or 9% CGST + 9% SGST', applicableOn: 'Goods & Services', status: 'active' },
    { id: 'IN-T05', taxType: 'GST', code: 'GST-28', name: 'GST 28% (tobacco, transitional)', rate: 28, component: 'IGST or 14% CGST + 14% SGST', applicableOn: 'Tobacco products until compensation cess ends', status: 'active' },
    { id: 'IN-T06', taxType: 'TDS', code: '194C', name: 'TDS on Contractor', rate: 1, component: 'Withholding', applicableOn: 'Contractor Payment', status: 'active' },
    { id: 'IN-T07', taxType: 'TDS', code: '194J', name: 'TDS on Professional Fees', rate: 10, component: 'Withholding', applicableOn: 'Professional Services', status: 'active' },
    { id: 'IN-T08', taxType: 'TCS', code: '206C(1H)', name: 'TCS on Goods Sale (omitted from 1 Apr 2025)', rate: 0.1, component: 'Collection', applicableOn: 'Historic only — section omitted by Finance Act 2025', status: 'inactive' },
  ],
  US: [
    { id: 'US-T01', taxType: 'SalesTax', code: 'CA-STATE', name: 'California State Sales Tax', rate: 7.25, component: 'State 6.00% + Mandatory Local 1.25%', applicableOn: 'Tangible Personal Property', status: 'active' },
    { id: 'US-T02', taxType: 'SalesTax', code: 'NY-COMB', name: 'New York Combined Sales Tax', rate: 8.875, component: 'State 4.00% + City 4.50% + MCTD 0.375%', applicableOn: 'Retail Goods & Software', status: 'active' },
    { id: 'US-T03', taxType: 'SalesTax', code: 'TX-STATE', name: 'Texas State Sales Tax', rate: 6.25, component: 'State Sales Tax (Local up to 2%)', applicableOn: 'Taxable Goods & Services', status: 'active' },
    { id: 'US-T04', taxType: 'SalesTax', code: 'EXEMPT', name: 'Reseller / Wholesale (Exempt)', rate: 0, component: '0% Exemption Certificate Required', applicableOn: 'B2B Wholesale / Resale', status: 'active' },
    { id: 'US-T05', taxType: 'Withholding', code: '1099-NEC', name: 'Backup Withholding (1099-NEC)', rate: 24, component: 'Federal IRS Withholding', applicableOn: 'Non-compliant Contractors', status: 'active' },
  ],
  GB: [
    { id: 'GB-T01', taxType: 'VAT', code: 'VAT-STD', name: 'UK Standard VAT', rate: 20, component: 'Standard Rate (HMRC MTD)', applicableOn: 'Standard Goods & Services', status: 'active' },
    { id: 'GB-T02', taxType: 'VAT', code: 'VAT-RED', name: 'UK Reduced VAT', rate: 5, component: 'Reduced Rate', applicableOn: 'Energy, Child Seats', status: 'active' },
    { id: 'GB-T03', taxType: 'VAT', code: 'VAT-ZERO', name: 'UK Zero-Rated VAT', rate: 0, component: '0% Output Tax', applicableOn: 'Books, Food, Children Wear', status: 'active' },
    { id: 'GB-T04', taxType: 'VAT', code: 'VAT-REV', name: 'Domestic Reverse Charge', rate: 20, component: 'Customer Accounts for VAT', applicableOn: 'Construction Services', status: 'active' },
  ],
  AE: [
    { id: 'AE-T01', taxType: 'VAT', code: 'UAE-STD', name: 'UAE Standard VAT', rate: 5, component: '5% Standard Tax (FTA)', applicableOn: 'Commercial Goods & Services', status: 'active' },
    { id: 'AE-T02', taxType: 'VAT', code: 'UAE-ZERO', name: 'Zero-Rated Supplies', rate: 0, component: '0% Taxable Export', applicableOn: 'Export of Goods & Healthcare', status: 'active' },
    { id: 'AE-T03', taxType: 'VAT', code: 'UAE-EXEMPT', name: 'Exempt Supplies', rate: 0, component: 'Exempt from VAT', applicableOn: 'Local Passenger Transport & Residential', status: 'active' },
  ],
  CA: [
    { id: 'CA-T01', taxType: 'HST', code: 'ON-HST', name: 'Ontario Harmonized Sales Tax (HST)', rate: 13, component: 'Federal 5% + Provincial 8%', applicableOn: 'Goods & Services', status: 'active' },
    { id: 'CA-T02', taxType: 'GST', code: 'FED-GST', name: 'Federal GST', rate: 5, component: 'Federal Tax Only', applicableOn: 'Alberta, Territories', status: 'active' },
    { id: 'CA-T03', taxType: 'GST_PST', code: 'BC-COMB', name: 'British Columbia (GST + PST)', rate: 12, component: 'GST 5% + PST 7%', applicableOn: 'Taxable Goods', status: 'active' },
  ],
  AU: [
    { id: 'AU-T01', taxType: 'GST', code: 'AU-GST', name: 'Australian GST', rate: 10, component: '10% Standard Rate (ATO)', applicableOn: 'Most Goods & Services', status: 'active' },
    { id: 'AU-T02', taxType: 'GST', code: 'AU-FREE', name: 'GST-Free Supplies', rate: 0, component: '0% Output Tax', applicableOn: 'Basic Food, Medical Services', status: 'active' },
  ],
  DE: [
    { id: 'DE-T01', taxType: 'VAT', code: 'DE-STD', name: 'Regelsteuersatz (Standard VAT)', rate: 19, component: 'Standard USt', applicableOn: 'All Standard Deliveries', status: 'active' },
    { id: 'DE-T02', taxType: 'VAT', code: 'DE-RED', name: 'Ermäßigter Steuersatz (Reduced VAT)', rate: 7, component: 'Reduced USt', applicableOn: 'Food, Books, Cultural Events', status: 'active' },
    { id: 'DE-T03', taxType: 'VAT', code: 'DE-REV', name: 'Steuerschuldnerschaft (Reverse Charge)', rate: 19, component: '§ 13b UStG Reverse Charge', applicableOn: 'B2B Intra-EU Services', status: 'active' },
  ],
  SG: [
    { id: 'SG-T01', taxType: 'GST', code: 'SG-GST', name: 'Singapore Standard GST', rate: 9, component: '9% Standard Rate (IRAS)', applicableOn: 'Standard-Rated Supplies', status: 'active' },
    { id: 'SG-T02', taxType: 'GST', code: 'SG-ZERO', name: 'Zero-Rated Supplies', rate: 0, component: '0% International Services', applicableOn: 'Exports & International Services', status: 'active' },
  ],
}

/** Rate table from a standard rate + reduced rates (used for every non-core country). */
function generatedRates(country, standard, reduced = []) {
  const type = country.taxSystem
  const label = country.taxShortName || type
  if (type === 'None') {
    return [{ id: `${country.code}-T00`, taxType: 'None', code: 'NO-TAX', name: 'No VAT / GST', rate: 0, component: 'No indirect tax on supplies', applicableOn: 'All supplies', status: 'active' }]
  }
  const rows = [
    { id: `${country.code}-T01`, taxType: type, code: `${label}-${standard}`, name: `${label} ${standard}% (standard)`, rate: standard, component: 'Standard rate', applicableOn: 'Most goods and services', status: 'active' },
    ...[...reduced].sort((a, b) => b - a).map((rate, i) => ({
      id: `${country.code}-T${String(i + 2).padStart(2, '0')}`, taxType: type, code: `${label}-${rate}`,
      name: `${label} ${rate}% (reduced)`, rate, component: 'Reduced rate', applicableOn: 'Specific goods and services (see local law)', status: 'active',
    })),
    { id: `${country.code}-T90`, taxType: type, code: `${label}-0`, name: `${label} 0% (zero-rated / exempt)`, rate: 0, component: 'Zero rate', applicableOn: 'Exports and exempt supplies', status: 'active' },
  ]
  return rows
}

export const COUNTRY_TAX_RATES = Object.fromEntries(
  SUPPORTED_COUNTRIES.map(c => {
    if (CORE_TAX_RATES[c.code]) return [c.code, CORE_TAX_RATES[c.code]]
    const deep = DEEP_RATES[c.code]
    return [c.code, generatedRates(c, deep?.standard ?? c.standardRate ?? 0, deep?.reduced ?? c.reducedRates ?? [])]
  })
)

const WITHHOLDING_TYPES = new Set(['TDS', 'TCS', 'Withholding'])

/** Distinct sales-tax rates a user can pick on an invoice (ascending, always incl. 0). */
export function invoiceRatesFor(code) {
  const rows = (COUNTRY_TAX_RATES[code] || []).filter(r => r.status === 'active' && !WITHHOLDING_TYPES.has(r.taxType))
  return [...new Set([0, ...rows.map(r => Number(r.rate))])].sort((a, b) => a - b)
}

/** Standard rate for a country (first active standard row). */
export function standardRateFor(code) {
  const rows = COUNTRY_TAX_RATES[code] || []
  return rows.find(r => /standard/i.test(r.name) || /standard/i.test(r.component))?.rate ?? rows[0]?.rate ?? 0
}

/**
 * Format any currency dynamically by country or explicit currency code
 */
export function formatMoneyByCountry(amount, countryCode = 'IN') {
  if (amount == null || isNaN(amount)) return '—'
  const config = getCountryTaxConfig(countryCode)
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${config.currencySymbol}${Number(amount).toFixed(2)}`
  }
}

/**
 * Validates a tax registration ID based on the country rules
 */
export function validateCountryTaxId(taxId, countryCode = 'IN') {
  if (!taxId) return { valid: false, message: 'Tax ID is required' }
  const config = getCountryTaxConfig(countryCode)
  const cleaned = String(taxId).trim().toUpperCase()
  const noSpaces = cleaned.replace(/\s+/g, '')

  if (!config.taxIdRegex) {
    return { valid: cleaned.length >= 4, message: cleaned.length >= 4 ? '' : 'Invalid Tax ID format' }
  }

  const isValid = config.taxIdRegex.test(cleaned) || config.taxIdRegex.test(noSpaces)
  return {
    valid: isValid,
    message: isValid ? '' : `Invalid ${config.taxIdLabel} format (expected format like ${config.taxIdPlaceholder})`,
  }
}

/**
 * Calculate dynamic tax breakdown for document items
 */
export function calculateDocumentTax({
  subtotal = 0,
  taxRate = 18,
  companyCountry = 'IN',
  companyRegion = 'Maharashtra',
  partyRegion = 'Maharashtra',
}) {
  const config = getCountryTaxConfig(companyCountry)
  const taxAmount = (subtotal * taxRate) / 100
  const total = subtotal + taxAmount

  if (companyCountry === 'IN') {
    const isIntraState = companyRegion?.toLowerCase() === partyRegion?.toLowerCase()
    if (isIntraState) {
      const halfRate = taxRate / 2
      const halfAmount = taxAmount / 2
      return {
        subtotal,
        taxRate,
        taxAmount,
        total,
        lines: [
          { name: `CGST (${halfRate}%)`, amount: halfAmount },
          { name: `SGST (${halfRate}%)`, amount: halfAmount },
        ],
        taxSummaryText: `CGST ${halfRate}% + SGST ${halfRate}%`,
      }
    } else {
      return {
        subtotal,
        taxRate,
        taxAmount,
        total,
        lines: [
          { name: `IGST (${taxRate}%)`, amount: taxAmount },
        ],
        taxSummaryText: `IGST ${taxRate}%`,
      }
    }
  }

  if (companyCountry === 'US') {
    // US Sales Tax breakdown
    const statePortion = taxRate * 0.7
    const localPortion = taxRate * 0.3
    return {
      subtotal,
      taxRate,
      taxAmount,
      total,
      lines: [
        { name: `State Sales Tax (${statePortion.toFixed(2)}%)`, amount: (subtotal * statePortion) / 100 },
        { name: `County & District Tax (${localPortion.toFixed(2)}%)`, amount: (subtotal * localPortion) / 100 },
      ],
      taxSummaryText: `Sales Tax ${taxRate}% (${partyRegion || companyRegion})`,
    }
  }

  if (companyCountry === 'CA') {
    // HST provinces charge one harmonized rate; others charge 5% federal GST + provincial PST/QST
    const isHst = [13, 15].includes(Number(taxRate))
    if (isHst || Number(taxRate) <= 5) {
      const label = isHst ? 'HST' : 'GST'
      return {
        subtotal, taxRate, taxAmount, total,
        lines: [{ name: `${label} (${taxRate}%)`, amount: taxAmount }],
        taxSummaryText: `${label} ${taxRate}%`,
      }
    }
    const provincial = Math.round((taxRate - 5) * 1000) / 1000
    return {
      subtotal, taxRate, taxAmount, total,
      lines: [
        { name: 'GST (5%)', amount: (subtotal * 5) / 100 },
        { name: `PST/QST (${provincial}%)`, amount: (subtotal * provincial) / 100 },
      ],
      taxSummaryText: `GST 5% + PST/QST ${provincial}%`,
    }
  }

  // VAT (UK, UAE, EU) or single GST (AU, SG)
  return {
    subtotal,
    taxRate,
    taxAmount,
    total,
    lines: [
      { name: `${config.taxShortName || config.taxSystem} (${taxRate}%)`, amount: taxAmount },
    ],
    taxSummaryText: `${config.taxShortName || config.taxSystem} ${taxRate}%`,
  }
}
