/**
 * Jurisdiction catalog served by the mock backend.
 *
 * One entry per supported country describing the tax authority, the periodic
 * return (with its official box/line structure), filing frequency and due-date
 * rule, e-invoicing regime, withholding schemes and regional taxes.
 *
 * Figures reflect publicly documented rules as of 2026 and are used for demo
 * data generation only — they are not tax advice.
 */
import { TAX_CATALOG_DEEP } from './taxCatalogDeep.js'
import { COUNTRY_BY_CODE } from '../../lib/countryTax.js'

export const TAX_CATALOG = {
  IN: {
    authority: 'GSTN / CBIC',
    portal: 'GST Portal',
    returnForm: 'GSTR-3B',
    returnName: 'GSTR-3B Summary Return',
    frequency: 'monthly',
    dueRule: { kind: 'dayOfNextMonth', day: 20, months: 1, text: '20th of the following month' },
    standardRate: 18,
    registrationThreshold: { amount: 4000000, note: '₹40 lakh for goods (₹20 lakh for services)' },
    penaltyNote: 'Late fee ₹50/day (₹20/day for nil returns) plus 18% p.a. interest on unpaid tax.',
    boxes: [
      { box: '3.1(a)', label: 'Outward taxable supplies (value)', kind: 'sales' },
      { box: '3.1(a) tax', label: 'Output tax on outward supplies', kind: 'outputTax' },
      { box: '3.1(b)', label: 'Zero-rated supplies (exports)', kind: 'zeroRated' },
      { box: '3.1(c)', label: 'Nil-rated / exempt supplies', kind: 'exempt' },
      { box: '4(A)', label: 'ITC available', kind: 'inputTax' },
      { box: '6.1', label: 'Net tax payable', kind: 'net' },
    ],
    eInvoicing: {
      name: 'E-Invoice (IRN)', network: 'Invoice Registration Portal (IRP)', status: 'mandatory',
      note: 'Mandatory for businesses with aggregate turnover above ₹5 crore. IRN and signed QR code issued by the IRP.',
      idLabel: 'IRN',
    },
    withholding: [
      { code: '194C', name: 'TDS on contractors', rate: 2, appliesTo: 'Contract payments (1% individuals/HUF)' },
      { code: '194J', name: 'TDS on professional fees', rate: 10, appliesTo: 'Professional / technical services' },
      { code: '194I', name: 'TDS on rent', rate: 10, appliesTo: 'Rent of land, building or furniture' },
    ],
    secondary: { name: 'TCS', items: [
      { code: '206C(1)', name: 'TCS on scrap', rate: 1, appliesTo: 'Sale of scrap' },
    ] },
    regions: { label: 'State', list: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat'] },
  },

  US: {
    authority: 'State revenue departments',
    portal: 'State e-file portals',
    returnForm: 'State Sales & Use Tax Return',
    returnName: 'Sales & Use Tax Return',
    frequency: 'quarterly',
    dueRule: { kind: 'dayOfNextMonth', day: 20, months: 1, text: '20th of the month after the period (varies by state)' },
    standardRate: 7.25,
    registrationThreshold: { amount: 100000, note: 'Economic nexus — commonly $100,000 in sales; CA, NY and TX use $500,000.' },
    penaltyNote: 'Late penalties vary by state (typically 5–10% of tax due plus interest).',
    boxes: [
      { box: 'L1', label: 'Gross sales', kind: 'gross' },
      { box: 'L2', label: 'Exempt sales (resale / exemption certificates)', kind: 'exempt' },
      { box: 'L3', label: 'Taxable sales', kind: 'sales' },
      { box: 'L4', label: 'Sales tax collected', kind: 'outputTax' },
      { box: 'L5', label: 'Use tax on untaxed purchases', kind: 'useTax' },
      { box: 'L6', label: 'Total tax due', kind: 'netNoCredit' },
    ],
    jurisdictions: [
      { code: 'CA', name: 'California', authority: 'CDTFA', rate: 7.25, frequency: 'quarterly', dueRule: { kind: 'monthEnd', months: 1, text: 'Last day of the month after the quarter' } },
      { code: 'NY', name: 'New York', authority: 'NYS Dept. of Taxation & Finance', rate: 8.875, frequency: 'quarterly' },
      { code: 'TX', name: 'Texas', authority: 'Texas Comptroller', rate: 6.25, frequency: 'monthly' },
    ],
    eInvoicing: {
      name: 'Electronic invoices', network: 'No federal mandate', status: 'not-required',
      note: 'The US has no e-invoicing mandate. Invoices are sent as PDF or via the Business Payments Coalition (Peppol-based) network voluntarily.',
      idLabel: 'Delivery ID',
    },
    withholding: [
      { code: '1099-NEC', name: 'Contractor reporting (1099-NEC)', rate: 0, appliesTo: 'Payments ≥ $600 to non-employees — information return due 31 January' },
      { code: 'BWH', name: 'Backup withholding', rate: 24, appliesTo: 'Payees without a valid TIN (Form W-9)' },
    ],
    secondary: { name: 'Exemption certificates', items: [
      { code: 'RESALE', name: 'Resale certificate', rate: 0, appliesTo: 'B2B purchases for resale' },
    ] },
    regions: { label: 'State', list: ['California', 'New York', 'Texas'] },
  },

  GB: {
    authority: 'HM Revenue & Customs (HMRC)',
    portal: 'Making Tax Digital (MTD) API',
    returnForm: 'VAT100',
    returnName: 'VAT Return (MTD)',
    frequency: 'quarterly',
    dueRule: { kind: 'monthsPlusDays', months: 1, days: 7, text: '1 month and 7 days after the period ends' },
    standardRate: 20,
    registrationThreshold: { amount: 90000, note: '£90,000 taxable turnover in any rolling 12 months.' },
    penaltyNote: 'Points-based late submission penalties (£200 at threshold) and late payment penalties from day 16.',
    boxes: [
      { box: 'Box 1', label: 'VAT due on sales and other outputs', kind: 'outputTax' },
      { box: 'Box 2', label: 'VAT due on acquisitions from the EU (NI only)', kind: 'zero' },
      { box: 'Box 3', label: 'Total VAT due (Box 1 + Box 2)', kind: 'outputTax' },
      { box: 'Box 4', label: 'VAT reclaimed on purchases and other inputs', kind: 'inputTax' },
      { box: 'Box 5', label: 'Net VAT to pay or reclaim', kind: 'net' },
      { box: 'Box 6', label: 'Total value of sales excluding VAT', kind: 'sales' },
      { box: 'Box 7', label: 'Total value of purchases excluding VAT', kind: 'purchases' },
      { box: 'Box 8', label: 'Supplies of goods to the EU (NI only)', kind: 'zero' },
      { box: 'Box 9', label: 'Acquisitions of goods from the EU (NI only)', kind: 'zero' },
    ],
    eInvoicing: {
      name: 'E-Invoicing', network: 'Peppol (voluntary)', status: 'voluntary',
      note: 'No B2B mandate yet; the government has announced mandatory e-invoicing from April 2029. Peppol is used for public-sector invoicing.',
      idLabel: 'Peppol message ID',
    },
    withholding: [
      { code: 'CIS-20', name: 'CIS deduction — registered subcontractor', rate: 20, appliesTo: 'Construction Industry Scheme labour payments' },
      { code: 'CIS-30', name: 'CIS deduction — unregistered subcontractor', rate: 30, appliesTo: 'Subcontractors not registered with HMRC' },
    ],
    secondary: { name: 'Domestic reverse charge', items: [
      { code: 'DRC', name: 'Construction services reverse charge', rate: 20, appliesTo: 'CIS-registered construction services' },
    ] },
    regions: { label: 'Nation', list: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
  },

  AE: {
    authority: 'Federal Tax Authority (FTA)',
    portal: 'EmaraTax',
    returnForm: 'VAT 201',
    returnName: 'VAT 201 Return',
    frequency: 'quarterly',
    dueRule: { kind: 'dayOfNextMonth', day: 28, months: 1, text: '28th day after the period ends' },
    standardRate: 5,
    registrationThreshold: { amount: 375000, note: 'Mandatory above AED 375,000; voluntary above AED 187,500.' },
    penaltyNote: 'Late filing AED 1,000 (AED 2,000 repeat within 24 months); late payment penalties accrue monthly.',
    boxes: [
      { box: '1a–1g', label: 'Standard-rated supplies (all Emirates)', kind: 'sales' },
      { box: '1 VAT', label: 'VAT on standard-rated supplies', kind: 'outputTax' },
      { box: '3', label: 'Supplies subject to reverse charge', kind: 'zero' },
      { box: '4', label: 'Zero-rated supplies', kind: 'zeroRated' },
      { box: '5', label: 'Exempt supplies', kind: 'exempt' },
      { box: '9', label: 'Standard-rated expenses', kind: 'purchases' },
      { box: '9 VAT', label: 'Recoverable VAT on expenses', kind: 'inputTax' },
      { box: '14', label: 'Payable tax for the period', kind: 'net' },
    ],
    eInvoicing: {
      name: 'FTA E-Invoicing', network: 'UAE e-invoicing (Peppol 5-corner, Accredited Service Providers)', status: 'phased',
      note: 'Phased roll-out: voluntary pilot from July 2026; mandatory for businesses with revenue ≥ AED 50M from January 2027, others from July 2027.',
      idLabel: 'ASP reference',
    },
    withholding: [],
    secondary: { name: 'Reverse charge', items: [
      { code: 'RCM-IMP', name: 'Reverse charge on imported services', rate: 5, appliesTo: 'Services received from non-resident suppliers' },
      { code: 'RCM-GOLD', name: 'Domestic reverse charge — gold & electronics', rate: 5, appliesTo: 'B2B gold, diamonds and electronic devices' },
    ] },
    regions: { label: 'Emirate', list: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'] },
  },

  CA: {
    authority: 'Canada Revenue Agency (CRA)',
    portal: 'CRA My Business Account / GST/HST NETFILE',
    returnForm: 'GST34',
    returnName: 'GST/HST Return',
    frequency: 'quarterly',
    dueRule: { kind: 'monthEnd', months: 1, text: '1 month after the end of the reporting period' },
    standardRate: 13,
    registrationThreshold: { amount: 30000, note: 'Small supplier threshold — $30,000 over four consecutive quarters.' },
    penaltyNote: 'Late filing penalty of 1% of balance owing plus 25% of that amount × months late (max 12).',
    boxes: [
      { box: 'Line 101', label: 'Sales and other revenue', kind: 'sales' },
      { box: 'Line 103', label: 'GST/HST collected or collectible', kind: 'outputTax' },
      { box: 'Line 106', label: 'Input tax credits (ITCs)', kind: 'inputTax' },
      { box: 'Line 109', label: 'Net tax', kind: 'net' },
      { box: 'Line 111', label: 'Rebates', kind: 'zero' },
      { box: 'Line 113A', label: 'Balance (net tax − rebates)', kind: 'net' },
    ],
    jurisdictions: [
      { code: 'ON', name: 'Ontario', authority: 'CRA (HST 13%)', rate: 13, frequency: 'quarterly' },
      { code: 'BC', name: 'British Columbia', authority: 'CRA GST 5% + BC PST 7%', rate: 12, frequency: 'quarterly' },
      { code: 'QC', name: 'Quebec', authority: 'Revenu Québec (GST 5% + QST 9.975%)', rate: 14.975, frequency: 'quarterly' },
      { code: 'AB', name: 'Alberta', authority: 'CRA (GST 5%)', rate: 5, frequency: 'quarterly' },
    ],
    eInvoicing: {
      name: 'E-Invoices', network: 'No mandate (Peppol voluntary)', status: 'not-required',
      note: 'Canada has no e-invoicing mandate. Federal agencies accept Peppol e-invoices voluntarily.',
      idLabel: 'Delivery ID',
    },
    withholding: [
      { code: 'T4A', name: 'T4A slip — fees for services', rate: 0, appliesTo: 'Information slip for contractor fees above $500, due end of February' },
      { code: 'R105', name: 'Regulation 105 withholding', rate: 15, appliesTo: 'Services rendered in Canada by non-residents' },
    ],
    secondary: { name: 'Provincial sales tax', items: [
      { code: 'BC-PST', name: 'British Columbia PST', rate: 7, appliesTo: 'Filed with BC Ministry of Finance' },
      { code: 'SK-PST', name: 'Saskatchewan PST', rate: 6, appliesTo: 'Filed with Saskatchewan Finance' },
      { code: 'MB-RST', name: 'Manitoba RST', rate: 7, appliesTo: 'Filed with Manitoba Finance' },
      { code: 'QST', name: 'Quebec QST', rate: 9.975, appliesTo: 'Filed with Revenu Québec' },
    ] },
    regions: { label: 'Province', list: ['Ontario', 'British Columbia', 'Quebec', 'Alberta'] },
  },

  AU: {
    authority: 'Australian Taxation Office (ATO)',
    portal: 'ATO Online Services for Business (SBR)',
    returnForm: 'BAS',
    returnName: 'Business Activity Statement',
    frequency: 'quarterly',
    dueRule: { kind: 'dayOfNextMonth', day: 28, months: 1, text: '28th of the month after the quarter (Oct–Dec due 28 Feb)', decemberQuarterMonths: 2 },
    standardRate: 10,
    registrationThreshold: { amount: 75000, note: '$75,000 GST turnover ($150,000 for non-profits).' },
    penaltyNote: 'Failure to lodge penalty of 1 penalty unit per 28 days late (max 5), plus general interest charge.',
    boxes: [
      { box: 'G1', label: 'Total sales (incl. GST)', kind: 'grossInclTax' },
      { box: 'G2', label: 'Export sales', kind: 'zeroRated' },
      { box: 'G3', label: 'Other GST-free sales', kind: 'exempt' },
      { box: 'G11', label: 'Non-capital purchases', kind: 'purchases' },
      { box: '1A', label: 'GST on sales', kind: 'outputTax' },
      { box: '1B', label: 'GST on purchases', kind: 'inputTax' },
      { box: 'W1', label: 'Total salary, wages and other payments', kind: 'wages' },
      { box: 'W2', label: 'Amounts withheld from W1 (PAYG)', kind: 'payg' },
      { box: '8A−8B', label: 'Amount payable to the ATO', kind: 'netWithPayg' },
    ],
    eInvoicing: {
      name: 'Peppol E-Invoices', network: 'Peppol (ATO-accredited access points)', status: 'voluntary',
      note: 'B2B adoption is voluntary; Commonwealth agencies must be able to receive Peppol e-invoices.',
      idLabel: 'Peppol message ID',
    },
    withholding: [
      { code: 'PAYG-W', name: 'PAYG withholding (employees)', rate: 0, appliesTo: 'Per ATO tax tables — reported at W1/W2' },
      { code: 'NO-ABN', name: 'No-ABN withholding', rate: 47, appliesTo: 'Suppliers who do not quote an ABN' },
    ],
    secondary: { name: 'No-ABN withholding', items: [
      { code: 'NO-ABN', name: 'No-ABN withholding', rate: 47, appliesTo: 'Payments to suppliers without an ABN' },
    ] },
    regions: { label: 'State', list: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'] },
  },

  DE: {
    authority: 'Finanzamt / Bundeszentralamt für Steuern (BZSt)',
    portal: 'ELSTER',
    returnForm: 'UStVA',
    returnName: 'Umsatzsteuer-Voranmeldung',
    frequency: 'monthly',
    dueRule: { kind: 'dayOfNextMonth', day: 10, months: 1, text: '10th of the following month (+1 month with Dauerfristverlängerung)' },
    standardRate: 19,
    registrationThreshold: { amount: 25000, note: 'Kleinunternehmer exemption up to €25,000 prior-year turnover (€100,000 current year).' },
    penaltyNote: 'Verspätungszuschlag up to 10% of the tax; Säumniszuschlag of 1% per started month on late payment.',
    boxes: [
      { box: 'Kz 81', label: 'Steuerpflichtige Umsätze 19% (Bemessungsgrundlage)', kind: 'sales' },
      { box: 'Kz 81 USt', label: 'Umsatzsteuer 19%', kind: 'outputTax' },
      { box: 'Kz 41', label: 'Innergemeinschaftliche Lieferungen (steuerfrei)', kind: 'zeroRated' },
      { box: 'Kz 66', label: 'Vorsteuerbeträge aus Rechnungen', kind: 'inputTax' },
      { box: 'Kz 83', label: 'Verbleibende Umsatzsteuer-Vorauszahlung', kind: 'net' },
    ],
    eInvoicing: {
      name: 'XRechnung / ZUGFeRD', network: 'EN 16931 structured invoices', status: 'mandatory',
      note: 'All B2B businesses must be able to receive e-invoices since 1 Jan 2025. Issuing becomes mandatory from 2027 (turnover > €800,000) and for all businesses from 2028.',
      idLabel: 'XRechnung ID',
    },
    withholding: [
      { code: 'BAUABZ', name: 'Bauabzugsteuer', rate: 15, appliesTo: 'Construction services without an exemption certificate (§ 48 EStG)' },
      { code: '50a', name: 'Abzugsteuer § 50a EStG', rate: 15, appliesTo: 'Royalties and licence fees paid to non-residents' },
    ],
    secondary: { name: 'Reverse charge (§ 13b UStG)', items: [
      { code: '13B-EU', name: 'B2B services from EU suppliers', rate: 19, appliesTo: 'Kz 46 / 47' },
      { code: '13B-BAU', name: 'Construction services', rate: 19, appliesTo: 'Kz 84 / 85' },
    ] },
    regions: { label: 'Bundesland', list: ['Bayern', 'Berlin', 'Baden-Württemberg', 'Nordrhein-Westfalen', 'Hessen', 'Hamburg'] },
  },

  SG: {
    authority: 'Inland Revenue Authority of Singapore (IRAS)',
    portal: 'myTax Portal',
    returnForm: 'GST F5',
    returnName: 'GST F5 Return',
    frequency: 'quarterly',
    dueRule: { kind: 'monthEnd', months: 1, text: '1 month after the end of the accounting period' },
    standardRate: 9,
    registrationThreshold: { amount: 1000000, note: 'S$1 million taxable supplies in a calendar year (or expected in the next 12 months).' },
    penaltyNote: 'Late filing penalty of S$200 per month (max S$10,000); 5% late payment penalty plus 2% per month.',
    boxes: [
      { box: 'Box 1', label: 'Total value of standard-rated supplies', kind: 'sales' },
      { box: 'Box 2', label: 'Total value of zero-rated supplies', kind: 'zeroRated' },
      { box: 'Box 3', label: 'Total value of exempt supplies', kind: 'exempt' },
      { box: 'Box 5', label: 'Total value of taxable purchases', kind: 'purchases' },
      { box: 'Box 6', label: 'Output tax due', kind: 'outputTax' },
      { box: 'Box 7', label: 'Input tax and refunds claimed', kind: 'inputTax' },
      { box: 'Box 8', label: 'Net GST to be paid to IRAS', kind: 'net' },
    ],
    eInvoicing: {
      name: 'InvoiceNow', network: 'InvoiceNow (Peppol) via IMDA-accredited providers', status: 'phased',
      note: 'GST InvoiceNow requirement applies to newly incorporated voluntary registrants from Nov 2025 and new voluntary registrants from Apr 2026, with wider phases to follow.',
      idLabel: 'InvoiceNow ID',
    },
    withholding: [
      { code: 'S12-SVC', name: 'Withholding — services by non-residents', rate: 17, appliesTo: 'Services performed in Singapore by non-resident companies' },
      { code: 'S12-ROY', name: 'Withholding — royalties', rate: 10, appliesTo: 'Royalties paid to non-residents' },
      { code: 'S12-INT', name: 'Withholding — interest', rate: 15, appliesTo: 'Interest paid to non-residents' },
    ],
    secondary: { name: 'Reverse charge', items: [
      { code: 'RC-IMP', name: 'Reverse charge on imported services & low-value goods', rate: 9, appliesTo: 'GST-registered businesses that are not entitled to full input tax' },
    ] },
    regions: { label: 'Region', list: ['Central', 'East', 'North', 'North-East', 'West'] },
  },
}


/**
 * Generic catalog for countries with a basic profile: one periodic return with
 * the usual output/input/net boxes, an indicative due date, and the country's
 * own e-invoicing system where one is mandatory. Countries without VAT/GST get
 * no periodic return.
 */
function genericCatalog(config) {
  const name = config.taxShortName || config.taxSystem
  const noTax = config.taxSystem === 'None'
  return {
    generic: true,
    authority: config.authority || 'National tax authority',
    portal: `${config.authority || 'Tax authority'} online services`,
    returnForm: noTax ? null : `${name} return`,
    returnName: noTax ? null : `${name} return`,
    frequency: 'monthly',
    dueRule: { kind: 'dayOfNextMonth', day: 20, months: 1, text: '20th of the following month (indicative — check local rules)' },
    standardRate: config.standardRate ?? 0,
    registrationThreshold: { amount: 0, note: 'Registration threshold not modelled for this country — check local rules.' },
    penaltyNote: 'Penalties and interest vary — check local rules.',
    boxes: noTax ? [] : [
      { box: 'A', label: `Taxable sales (excluding ${name})`, kind: 'sales' },
      { box: 'B', label: `Output ${name}`, kind: 'outputTax' },
      { box: 'C', label: 'Zero-rated / exempt sales', kind: 'zeroRated' },
      { box: 'D', label: 'Taxable purchases', kind: 'purchases' },
      { box: 'E', label: `Input ${name} (deductible)`, kind: 'inputTax' },
      { box: 'F', label: `Net ${name} payable`, kind: 'net' },
    ],
    eInvoicing: config.eInvoicingName
      ? { name: config.eInvoicingName, network: config.eInvoicingName, status: 'mandatory', note: `${config.name} requires e-invoicing / real-time reporting through ${config.eInvoicingName} (scope and dates vary by business size).`, idLabel: 'Reference' }
      : { name: 'E-Invoices', network: 'No national mandate modelled', status: 'not-required', note: `No mandatory e-invoicing system is modelled for ${config.name}.`, idLabel: 'Reference' },
    withholding: [],
    secondary: { name: 'Other schemes', items: [] },
    regions: { label: 'Region', list: config.regions || [] },
  }
}

const catalogCache = new Map()

export function getTaxCatalog(country = 'IN') {
  if (TAX_CATALOG[country]) return TAX_CATALOG[country]
  if (TAX_CATALOG_DEEP[country]) return TAX_CATALOG_DEEP[country]
  const config = COUNTRY_BY_CODE[country]
  if (!config) return TAX_CATALOG.IN
  if (!catalogCache.has(country)) catalogCache.set(country, genericCatalog(config))
  return catalogCache.get(country)
}
