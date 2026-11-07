/**
 * Tax-authority filing gateways and e-invoicing networks (mock).
 *
 * Filing: a company first authorises a connection to its authority (OAuth-style
 * consent, as with HMRC MTD, IRAS, ATO SBR or a GST Suvidha Provider). Returns are
 * then submitted through that connection and move submitted → processing → accepted
 * (or rejected), like the real asynchronous APIs.
 *
 * E-invoicing: issuing an invoice produces the identifiers each network really uses
 * (IRN + signed QR for India's IRP, ZATCA TLV QR, Brazil's 44-digit access key, CFDI
 * UUID, KSeF number, SdI id, Peppol message id + UBL…), generated locally in the
 * correct formats. No data leaves the browser; swap the adapter for a certified
 * provider (GSP / ASP / Peppol access point / PAC) in production.
 */
import { sha256Hex } from './authServer.js'
import { getTaxCatalog } from './taxCatalog.js'
import { COUNTRY_BY_CODE } from '../../lib/countryTax.js'

/* ── Filing providers ── */
const FILING_PROVIDERS = {
  IN: { name: 'GSTN via GST Suvidha Provider (GSP)', auth: 'GSP API + OTP from the GST portal', scopes: ['returns.file', 'gstr2b.read', 'einvoice.irn'] },
  GB: { name: 'HMRC Making Tax Digital', auth: 'OAuth 2.0 (Government Gateway)', scopes: ['read:vat', 'write:vat'] },
  AE: { name: 'FTA EmaraTax', auth: 'UAE Pass', scopes: ['vat.returns'] },
  US: { name: 'State e-file connectors', auth: 'Per-state credentials', scopes: ['salestax.file'] },
  CA: { name: 'CRA GST/HST NETFILE', auth: 'Access code / My Business Account', scopes: ['gsthst.file'] },
  AU: { name: 'ATO Standard Business Reporting (SBR2)', auth: 'myID + RAM authorisation', scopes: ['bas.lodge'] },
  DE: { name: 'ELSTER (ERiC)', auth: 'ELSTER certificate', scopes: ['ustva.submit'] },
  SG: { name: 'IRAS myTax API', auth: 'Corppass', scopes: ['gst.f5.submit'] },
  FR: { name: 'DGFiP EDI-TVA', auth: 'Partenaire EDI mandate', scopes: ['tva.ca3'] },
  IT: { name: 'Agenzia delle Entrate — Entratel', auth: 'Fisconline / Entratel credentials', scopes: ['lipe.invio'] },
  ES: { name: 'AEAT Sede electrónica', auth: 'Certificado electrónico', scopes: ['modelo303'] },
  NL: { name: 'Belastingdienst Digipoort', auth: 'PKIoverheid certificate', scopes: ['btw.aangifte'] },
  PL: { name: 'KAS bramka JPK / KSeF', auth: 'Profil zaufany / KSeF token', scopes: ['jpk.v7m', 'ksef.send'] },
  SA: { name: 'ZATCA Fatoora + e-services', auth: 'CSID onboarding', scopes: ['vat.return', 'einvoice.clearance'] },
  JP: { name: 'NTA e-Tax', auth: 'Electronic certificate (gBizID)', scopes: ['jct.return'] },
  BR: { name: 'Receita Federal SPED / SEFAZ', auth: 'e-CNPJ A1 certificate', scopes: ['sped.transmit', 'nfe.authorize'] },
  MX: { name: 'SAT via PAC', auth: 'e.firma (FIEL) + CSD', scopes: ['cfdi.stamp', 'declaraciones'] },
}

export function filingProviderFor(country) {
  const catalog = getTaxCatalog(country)
  return FILING_PROVIDERS[country] ?? { name: `${catalog.authority} e-filing`, auth: 'Authority credentials', scopes: ['returns.file'] }
}

/* ── Helpers ── */
function randomDigits(n) {
  const arr = new Uint8Array(n)
  globalThis.crypto.getRandomValues(arr)
  return [...arr].map(b => String(b % 10)).join('')
}
function randomHex(n) {
  const arr = new Uint8Array(n)
  globalThis.crypto.getRandomValues(arr)
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('')
}
function uuid() {
  return globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : `${randomHex(4)}-${randomHex(2)}-4${randomHex(2).slice(1)}-${randomHex(2)}-${randomHex(6)}`
}
function base64(bytes) {
  let s = ''
  bytes.forEach(b => { s += String.fromCharCode(b) })
  return btoa(s)
}
const b64Json = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=+$/, '')

/** ZATCA QR: TLV (tag, length, UTF-8 value) for seller, VAT no, timestamp, total, VAT — base64. */
export function zatcaTlv(fields) {
  const enc = new TextEncoder()
  const parts = []
  fields.forEach((value, i) => {
    const bytes = enc.encode(String(value))
    parts.push(i + 1, bytes.length, ...bytes)
  })
  return base64(Uint8Array.from(parts))
}

/** Brazil NF-e access key: 43 digits + modulo-11 check digit. */
export function nfeAccessKey(cnpj, date, number) {
  const digits = String(cnpj).replace(/\D/g, '').padStart(14, '0').slice(0, 14)
  const yymm = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}`
  const base = `35${yymm}${digits}55001${String(number).padStart(9, '0')}1${randomDigits(8)}`
  let weight = 2
  let sum = 0
  for (let i = base.length - 1; i >= 0; i--) {
    sum += Number(base[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  const rest = sum % 11
  const dv = rest < 2 ? 0 : 11 - rest
  return `${base}${dv}`
}

function ublInvoice({ id, issueDate, currency, seller, buyer, net, tax }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ID>${id}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>${seller}</cbc:Name></cac:PartyName></cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>${buyer}</cbc:Name></cac:PartyName></cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal><cbc:TaxAmount currencyID="${currency}">${tax.toFixed(2)}</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${net.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${(net + tax).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`
}

const PEPPOL = new Set(['AU', 'NZ', 'BE', 'NL', 'GB', 'SG', 'JP', 'DE', 'SE', 'IE', 'FR', 'CA', 'US', 'AE'])

/**
 * Issue an e-invoice on the company's network and return the artifacts.
 * doc: { invoiceNo, date, customer, net, tax, total }
 */
export async function issueEInvoice(country, company, doc) {
  const config = COUNTRY_BY_CODE[country]
  const currency = config?.currency ?? 'USD'
  const seller = company.name || 'UnifiedTree Demo Company'
  const taxId = company.taxId || 'DEMO-TAX-ID'
  const date = new Date(`${doc.date}T00:00:00`)
  const issuedAt = new Date().toISOString()

  switch (country) {
    case 'IN': {
      const fy = date.getMonth() >= 3 ? `${date.getFullYear()}-${String(date.getFullYear() + 1).slice(2)}` : `${date.getFullYear() - 1}-${String(date.getFullYear()).slice(2)}`
      const irn = await sha256Hex(`${taxId}${fy}INV${doc.invoiceNo}`)
      const ackNo = randomDigits(15)
      const header = b64Json({ alg: 'RS256', typ: 'JWT', kid: 'IRP-DEMO' })
      const payload = b64Json({ data: JSON.stringify({ SellerGstin: taxId, BuyerGstin: 'URP', DocNo: doc.invoiceNo, DocTyp: 'INV', DocDt: doc.date, TotInvVal: doc.total, ItemCnt: 1, MainHsnCode: '998313', Irn: irn, IrnDt: issuedAt }), iss: 'NIC' })
      return { network: 'IRP (Invoice Registration Portal)', idLabel: 'IRN', id: irn, ackNo, qrType: 'Signed QR (JWT)', qrPayload: `${header}.${payload}.${randomHex(32)}` }
    }
    case 'SA': {
      const qr = zatcaTlv([seller, taxId, issuedAt, doc.total.toFixed(2), doc.tax.toFixed(2)])
      const invoiceHash = base64(Uint8Array.from((await sha256Hex(`${doc.invoiceNo}|${doc.total}|${issuedAt}`)).match(/../g).map(h => parseInt(h, 16))))
      return { network: 'ZATCA FATOORA (clearance)', idLabel: 'UUID', id: uuid(), qrType: 'ZATCA TLV (base64)', qrPayload: qr, hash: invoiceHash }
    }
    case 'BR': {
      const key = nfeAccessKey(taxId, date, Number(String(doc.invoiceNo).replace(/\D/g, '').slice(-9)) || 1)
      return { network: 'SEFAZ (NF-e)', idLabel: 'Chave de acesso', id: key, protocol: randomDigits(15), qrType: 'NFC-e consulta URL', qrPayload: `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${key}|2|1|1|${randomHex(20)}` }
    }
    case 'MX': {
      const id = uuid().toUpperCase()
      return { network: 'SAT via PAC (CFDI 4.0)', idLabel: 'UUID (folio fiscal)', id, qrType: 'SAT verification URL', qrPayload: `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${id}&re=${taxId}&rr=XAXX010101000&tt=${doc.total.toFixed(6)}&fe=${randomHex(4)}` }
    }
    case 'PL': {
      const nip = String(taxId).replace(/\D/g, '').padStart(10, '0').slice(0, 10)
      const ymd = doc.date.replace(/-/g, '')
      return { network: 'KSeF', idLabel: 'Numer KSeF', id: `${nip}-${ymd}-${randomHex(6).toUpperCase()}-${randomHex(1).toUpperCase()}`, qrType: 'KSeF verification URL', qrPayload: `https://ksef.mf.gov.pl/web/verify/${nip}/${ymd}` }
    }
    case 'IT':
      return { network: 'Sistema di Interscambio (SdI)', idLabel: 'Identificativo SdI', id: randomDigits(10), fileName: `IT${String(taxId).replace(/\D/g, '').slice(0, 11)}_${randomHex(3).toUpperCase()}.xml`, qrType: null }
    case 'KR': {
      const ymd = doc.date.replace(/-/g, '')
      return { network: 'NTS e-Tax invoice', idLabel: 'Approval number', id: `${ymd}-41000000-${randomDigits(8)}`, qrType: null }
    }
    case 'CN':
      return { network: 'STA fully digitalised e-fapiao', idLabel: 'Fapiao number', id: `${String(date.getFullYear()).slice(2)}${randomDigits(18)}`, qrType: 'e-fapiao verification', qrPayload: `01,32,,${randomDigits(20)},${doc.total.toFixed(2)},${doc.date.replace(/-/g, '')},,${randomHex(2)}` }
    default:
      if (PEPPOL.has(country)) {
        return { network: 'Peppol (BIS Billing 3.0)', idLabel: 'Peppol message ID', id: uuid(), participant: `0088:${randomDigits(13)}`, qrType: null, xml: ublInvoice({ id: doc.invoiceNo, issueDate: doc.date, currency, seller, buyer: doc.customer, net: doc.net, tax: doc.tax }) }
      }
      return { network: config?.eInvoicingName || 'Electronic invoice', idLabel: 'Reference', id: uuid(), qrType: null }
  }
}

/* ── Filing connections & submissions ── */
export function ensureFiling(db) {
  db.filing ??= { connections: [], submissions: [] }
  return db.filing
}

export function activeConnection(db) {
  return ensureFiling(db).connections.find(c => c.status === 'active' && new Date(c.expiresAt) > new Date()) ?? null
}

export function recordSubmission(db, ret) {
  const filing = ensureFiling(db)
  const sub = {
    id: `SUB-${randomHex(5).toUpperCase()}`, returnId: ret.id, form: ret.form, period: ret.periodLabel,
    authority: ret.authority, correlationId: uuid(), status: 'processing',
    submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ackRef: ret.ackRef, message: 'Received by the authority — validation in progress',
  }
  filing.submissions.unshift(sub)
  return sub
}

export function registerComplianceRoutes(route, { ok, badRequest, notFound }) {
  route('GET', '/filing/connection', ({ db, company }) => ok({
    provider: filingProviderFor(company.country), connection: activeConnection(db),
  }), { summary: 'Tax authority connection status' })

  route('POST', '/filing/connections', ({ db, body, company, user, save }) => {
    if (!body?.consent) badRequest('Consent is required to authorise filing on your behalf')
    const provider = filingProviderFor(company.country)
    const filing = ensureFiling(db)
    filing.connections.forEach(c => { if (c.status === 'active') c.status = 'replaced' })
    const conn = {
      id: `CON-${randomHex(4).toUpperCase()}`, provider: provider.name, auth: provider.auth, scopes: provider.scopes,
      status: 'active', authorisedBy: user?.name ?? null, connectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 18 * 30 * 86400000).toISOString(),
    }
    filing.connections.unshift(conn)
    save()
    return ok({ ...conn, auditSummary: `Authorised filing with ${provider.name}` }, 201)
  }, { summary: 'Authorise the tax-authority connection (OAuth-style consent)' })

  route('DELETE', '/filing/connections/:id', ({ db, params, save }) => {
    const conn = ensureFiling(db).connections.find(c => c.id === params.id) || notFound('Connection')
    conn.status = 'revoked'
    save()
    return ok({ ...conn, auditSummary: `Revoked filing connection ${conn.id}` })
  }, { summary: 'Revoke the tax-authority connection' })

  route('GET', '/filing/submissions', ({ db }) => ok(ensureFiling(db).submissions), { summary: 'Submissions and their processing status' })

  route('POST', '/filing/submissions/:id/refresh', ({ db, params, save }) => {
    const sub = ensureFiling(db).submissions.find(s => s.id === params.id) || notFound('Submission')
    if (sub.status === 'processing') {
      const ret = (db.returns ?? []).find(r => r.id === sub.returnId)
      const unmatched = (db.reconciliation ?? []).filter(r => r.status === 'mismatch').length
      // Authorities reject refund claims that cannot be supported; everything else is accepted
      if (ret && ret.netPayable < 0 && unmatched > 2) {
        sub.status = 'rejected'
        sub.message = 'Refund claim held — input tax could not be matched to supplier filings'
      } else {
        sub.status = 'accepted'
        sub.message = 'Accepted by the authority'
      }
      sub.updatedAt = new Date().toISOString()
      save()
    }
    return ok({ ...sub, auditSummary: `Submission ${sub.id} ${sub.status}` })
  }, { summary: 'Poll the authority for the submission status' })

  route('POST', '/einvoice/:id/issue', async ({ db, params, company, save }) => {
    const doc = (db.einvoices ?? []).find(e => e.id === params.id) || notFound('Invoice')
    if (doc.artifact) badRequest('This invoice was already issued on the network')
    doc.artifact = { ...(await issueEInvoice(company.country, company, doc)), issuedAt: new Date().toISOString() }
    doc.status = ['voluntary', 'not-required'].includes(getTaxCatalog(company.country).eInvoicing.status) ? 'delivered' : 'accepted'
    doc.networkRef = doc.artifact.id
    doc.error = null
    save()
    return ok({ ...doc, auditSummary: `E-invoice ${doc.invoiceNo} issued (${doc.artifact.idLabel} ${String(doc.artifact.id).slice(0, 16)}…)` }, 201)
  }, { summary: 'Issue an invoice on the e-invoicing network (IRN, ZATCA, KSeF, Peppol…)' })
}
