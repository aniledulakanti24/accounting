/* ── Integrations service — provider catalog (mock) ──
 * Connection status is NOT here — it lives in the app store (persisted),
 * keyed by integration id. This file is the static catalog of what CAN be
 * connected. Default `seedStatus` is the demo starting state.
 */

export const INTEGRATION_CATALOG = [
  // ── Payment Gateways ──
  { id:'pg_razorpay', name:'Razorpay',  category:'Payment Gateways', desc:'Collect online payments, UPI, payment links, auto-reconcile receipts', seedStatus:'connected' },
  { id:'pg_payu',     name:'PayU',      category:'Payment Gateways', desc:'Cards, netbanking, EMI checkout with settlement import',              seedStatus:'disconnected' },
  { id:'pg_cashfree', name:'Cashfree',  category:'Payment Gateways', desc:'Payment gateway + payouts, instant settlement webhooks',               seedStatus:'disconnected' },
  { id:'pg_stripe',   name:'Stripe',    category:'Payment Gateways', desc:'International cards and subscriptions, multi-currency capture',          seedStatus:'disconnected' },

  // ── Banking ──
  { id:'bank_icici',  name:'ICICI Corporate Banking', category:'Banking', desc:'Statement import, NEFT/RTGS payment file handoff',          seedStatus:'connected' },
  { id:'bank_hdfc',   name:'HDFC SmartHub',           category:'Banking', desc:'Bank feed and auto-reconciliation for HDFC current accounts', seedStatus:'disconnected' },
  { id:'bank_sbi',    name:'SBI Yono Business',       category:'Banking', desc:'Account statement sync and bulk payment uploads',             seedStatus:'disconnected' },
  { id:'bank_kotak',  name:'Kotak ActivMoney',        category:'Banking', desc:'Sweep account balance feed and reconciliation',               seedStatus:'disconnected' },

  // ── E-commerce ──
  { id:'ec_amazon',   name:'Amazon Seller Central', category:'E-commerce', desc:'Import orders, fees, settlements; auto-create sales invoices', seedStatus:'disconnected' },
  { id:'ec_flipkart', name:'Flipkart Seller Hub',   category:'E-commerce', desc:'Order and commission sync with GST-ready invoicing',           seedStatus:'disconnected' },
  { id:'ec_shopify',  name:'Shopify',               category:'E-commerce', desc:'Storefront orders, payouts, refunds into receivables',         seedStatus:'connected' },

  // ── Tax & Compliance ──
  { id:'tax_gstn',    name:'GST Portal (NIC/GSTN)', category:'Tax & Compliance', desc:'GSTR filing, ITC reconciliation, IRN generation', seedStatus:'connected' },
  { id:'tax_traces',  name:'TRACES (TDS)',          category:'Tax & Compliance', desc:'TDS certificate download, 26AS fetch, challan verify', seedStatus:'connected' },
  { id:'tax_ewb',     name:'E-Way Bill Portal',     category:'Tax & Compliance', desc:'Auto-generate e-way bills on invoice posting',     seedStatus:'connected' },

  // ── Communication ──
  { id:'comm_whatsapp', name:'WhatsApp Business API', category:'Communication', desc:'Invoice delivery and payment reminders via WhatsApp', seedStatus:'disconnected' },
  { id:'comm_email',    name:'Email SMTP (Postmark)', category:'Communication', desc:'Transactional emails — reminders, reports, CA links', seedStatus:'connected' },
]

export function getIntegrations() {
  return Promise.resolve([...INTEGRATION_CATALOG])
}

/** Stable category order for grouped rendering. */
export const INTEGRATION_CATEGORIES = [
  'Payment Gateways',
  'Banking',
  'E-commerce',
  'Tax & Compliance',
  'Communication',
]
