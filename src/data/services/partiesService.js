/**
 * Parties & Ledgers service — mock data.
 */

export const PARTY_TYPES = ['Customer', 'Supplier', 'Both']

/* ── Master party list ── */
const PARTIES_SEED = [
  // Customers
  { id:'P001', name:'Infosys BPO Ltd',          gstin:'29AAACI1681G1ZK', type:'Customer', phone:'080-41500000', city:'Bengaluru', creditLimit:5000000,  outstanding:2850000, overdue:0,       advance:0,       lastTxn:'2024-12-18', status:'active' },
  { id:'P002', name:'Tech Mahindra Limited',     gstin:'27AABCT3517H1ZS', type:'Customer', phone:'020-66601234', city:'Pune',      creditLimit:3000000,  outstanding:1920000, overdue:320000,  advance:0,       lastTxn:'2024-12-10', status:'active' },
  { id:'P003', name:'Wipro Digital Ltd',         gstin:'29AAACW0530G1ZK', type:'Customer', phone:'080-28440011', city:'Bengaluru', creditLimit:2000000,  outstanding:1540000, overdue:890000,  advance:0,       lastTxn:'2024-12-15', status:'active' },
  { id:'P004', name:'HCL Technologies',          gstin:'09AAACH1927J1Z9', type:'Customer', phone:'0120-4251000', city:'Noida',     creditLimit:2500000,  outstanding:980000,  overdue:0,       advance:0,       lastTxn:'2024-11-28', status:'active' },
  { id:'P005', name:'Tata Consultancy Svcs',     gstin:'27AAACT3517H1Z1', type:'Customer', phone:'022-67789999', city:'Mumbai',    creditLimit:4000000,  outstanding:620000,  overdue:620000,  advance:0,       lastTxn:'2024-10-05', status:'active' },
  { id:'P006', name:'Mindtree Limited',          gstin:'29AABCM2150E1Z7', type:'Customer', phone:'080-67064000', city:'Bengaluru', creditLimit:1500000,  outstanding:0,       overdue:0,       advance:0,       lastTxn:'2024-09-30', status:'active' },
  { id:'P007', name:'Mphasis Corp India',        gstin:'29AABCM2150E1Z8', type:'Customer', phone:'080-42296000', city:'Bengaluru', creditLimit:1000000,  outstanding:425000,  overdue:0,       advance:0,       lastTxn:'2024-12-01', status:'inactive' },
  // Suppliers
  { id:'P008', name:'Reliance Industries',       gstin:'27AAACR5055K1ZZ', type:'Supplier', phone:'022-44770000', city:'Mumbai',    creditLimit:0,        outstanding:1200000, overdue:0,       advance:50000,   lastTxn:'2024-12-17', status:'active' },
  { id:'P009', name:'Amazon Web Services India', gstin:'29AAECS1044G1ZD', type:'Supplier', phone:'1800-572-0473',city:'Bengaluru', creditLimit:0,        outstanding:78500,   overdue:0,       advance:0,       lastTxn:'2024-12-14', status:'active' },
  { id:'P010', name:'Microsoft India Pvt Ltd',   gstin:'27AABCM5860M1Z2', type:'Supplier', phone:'1800-102-1100',city:'Mumbai',    creditLimit:0,        outstanding:245000,  overdue:245000,  advance:0,       lastTxn:'2024-11-15', status:'active' },
  { id:'P011', name:'Tata Power Company',        gstin:'27AAACT0761P1ZB', type:'Supplier', phone:'022-66655300', city:'Mumbai',    creditLimit:0,        outstanding:32000,   overdue:0,       advance:0,       lastTxn:'2024-12-05', status:'active' },
  { id:'P012', name:'BSNL Telecom Services',     gstin:'07AABCB7783M1ZE', type:'Supplier', phone:'1500',         city:'New Delhi', creditLimit:0,        outstanding:18900,   overdue:18900,   advance:0,       lastTxn:'2024-10-20', status:'active' },
  { id:'P013', name:'Airtel Business Solutions', gstin:'27AABCA8719R1Z4', type:'Supplier', phone:'022-40039400', city:'Mumbai',    creditLimit:0,        outstanding:42000,   overdue:0,       advance:0,       lastTxn:'2024-12-12', status:'active' },
  // Both (Customer + Supplier)
  { id:'P014', name:'L&T Infotech Ltd',          gstin:'27AAACL0752H1ZF', type:'Both',     phone:'022-67522222', city:'Mumbai',    creditLimit:2000000,  outstanding:680000,  overdue:0,       advance:120000,  lastTxn:'2024-12-08', status:'active' },
  { id:'P015', name:'Infosys Ltd (Supply Div)',  gstin:'29AAACI1681G2ZK', type:'Both',     phone:'080-28520000', city:'Bengaluru', creditLimit:500000,   outstanding:320000,  overdue:0,       advance:80000,   lastTxn:'2024-12-03', status:'active' },
]

const PARTY_WORKFLOW_EXTRAS = {
  P001: { owner:'Riya S', branch:'Bengaluru - South', tags:['Enterprise', 'Portal'], creditPolicy:'Soft block', statementAutoSend:'Monthly', lastStatement:'2026-01-01', deliveryStatus:'Viewed', portal:'Invited' },
  P002: { owner:'Aman K', branch:'Pune', tags:['Promise-to-pay', 'Priority'], creditPolicy:'Warn only', statementAutoSend:'Weekly', lastStatement:'2026-01-06', deliveryStatus:'Promised', portal:'Enabled' },
  P003: { owner:'Riya S', branch:'Bengaluru - East', tags:['High risk', 'WhatsApp'], creditPolicy:'Hard block', statementAutoSend:'Weekly', lastStatement:'2026-01-05', deliveryStatus:'No response', portal:'Enabled' },
  P005: { owner:'Aman K', branch:'Mumbai', tags:['Dispute', 'Final demand'], creditPolicy:'Hard block', statementAutoSend:'Weekly', lastStatement:'2025-12-28', deliveryStatus:'Disputed', portal:'Not invited' },
  P008: { owner:'Aman K', branch:'Mumbai - HQ', tags:['Vendor', 'Bank verified'], creditPolicy:'Pay run approval', statementAutoSend:'Monthly', lastStatement:'2026-01-03', deliveryStatus:'Sent', portal:'Not invited' },
  P010: { owner:'Aman K', branch:'Mumbai', tags:['Vendor overdue'], creditPolicy:'Pay run approval', statementAutoSend:'Monthly', lastStatement:'2026-01-02', deliveryStatus:'Queued', portal:'Not invited' },
  P014: { owner:'Riya S', branch:'Mumbai - Powai', tags:['Both', 'Portal'], creditPolicy:'Soft block', statementAutoSend:'Monthly', lastStatement:'2026-01-04', deliveryStatus:'Accepted', portal:'Enabled' },
}

function workflowFor(party) {
  return {
    owner: 'Finance Team',
    branch: party.city,
    tags: party.overdue > 0 ? ['Overdue'] : ['Regular'],
    creditPolicy: party.overdue > 0 ? 'Warn only' : 'Standard',
    statementAutoSend: 'Monthly',
    lastStatement: '-',
    deliveryStatus: '-',
    portal: 'Not invited',
    ...(PARTY_WORKFLOW_EXTRAS[party.id] ?? {}),
  }
}

function enrichParty(party) {
  return { ...party, ...workflowFor(party) }
}

export function getParties()          { return Promise.resolve(PARTIES_SEED.map(enrichParty)) }
export function getCustomers()        { return Promise.resolve(PARTIES_SEED.filter(p => p.type === 'Customer' || p.type === 'Both').map(enrichParty)) }
export function getSuppliers()        { return Promise.resolve(PARTIES_SEED.filter(p => p.type === 'Supplier' || p.type === 'Both').map(enrichParty)) }
export function getSharedParties()    { return Promise.resolve(PARTIES_SEED.filter(p => p.type === 'Both').map(enrichParty)) }

export function getPartyById(id)      {
  const party = PARTIES_SEED.find(p => p.id === id)
  return Promise.resolve(party ? enrichParty(party) : null)
}

const PROFILE_EXTRAS = {
  P001: { email:'accounts@infosysbpo.example', contactPerson:'Meera Rao', pan:'AAACI1681G', registrationType:'Regular', state:'Karnataka', country:'India', billingAddress:'Electronics City Phase 1, Bengaluru', shippingAddress:'Electronics City Phase 1, Bengaluru', creditPeriod:30, preferredMode:'NEFT', currency:'INR', language:'English', portal:'Invited', lastPortalActivity:'Invoice viewed 2 days ago', owner:'Riya S' },
  P002: { email:'ap@techmahindra.example', contactPerson:'Rahul Joshi', pan:'AABCT3517H', registrationType:'Regular', state:'Maharashtra', country:'India', billingAddress:'Hinjewadi Phase 3, Pune', shippingAddress:'Hinjewadi Phase 3, Pune', creditPeriod:21, preferredMode:'RTGS', currency:'INR', language:'English', portal:'Enabled', lastPortalActivity:'Payment promise added', owner:'Aman K' },
  P003: { email:'finance@wiprodigital.example', contactPerson:'Neha Iyer', pan:'AAACW0530G', registrationType:'Regular', state:'Karnataka', country:'India', billingAddress:'Sarjapur Road, Bengaluru', shippingAddress:'Whitefield, Bengaluru', creditPeriod:15, preferredMode:'NEFT', currency:'INR', language:'English', portal:'Enabled', lastPortalActivity:'Statement downloaded', owner:'Riya S' },
  P008: { email:'vendor.payments@ril.example', contactPerson:'Vikram Shah', pan:'AAACR5055K', registrationType:'Regular', state:'Maharashtra', country:'India', billingAddress:'Nariman Point, Mumbai', shippingAddress:'BKC, Mumbai', creditPeriod:30, preferredMode:'NEFT', currency:'INR', language:'English', portal:'Not invited', lastPortalActivity:'-', owner:'Aman K', bank:'HDFC Bank', accountNo:'50200012345678', ifsc:'HDFC0001234', upi:'reliance@hdfcbank', beneficiary:'Reliance Industries' },
  P014: { email:'accounts@lti.example', contactPerson:'Sonal Mehta', pan:'AAACL0752H', registrationType:'Regular', state:'Maharashtra', country:'India', billingAddress:'Powai, Mumbai', shippingAddress:'Powai, Mumbai', creditPeriod:30, preferredMode:'NEFT', currency:'INR', language:'English', portal:'Enabled', lastPortalActivity:'Quote accepted', owner:'Riya S', bank:'ICICI Bank', accountNo:'003405001234', ifsc:'ICIC0000034', upi:'lti@icici', beneficiary:'L&T Infotech Ltd' },
}

function profileFor(party) {
  const fallback = {
    email: `accounts@${party.name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18)}.example`,
    contactPerson: 'Accounts Manager',
    pan: party.gstin?.slice(2, 12) ?? '',
    registrationType: 'Regular',
    state: party.gstin?.slice(0, 2) === '27' ? 'Maharashtra' : party.gstin?.slice(0, 2) === '29' ? 'Karnataka' : party.city,
    country: 'India',
    billingAddress: `${party.city} business address`,
    shippingAddress: `${party.city} delivery address`,
    creditPeriod: party.type === 'Supplier' ? 30 : 21,
    preferredMode: 'NEFT',
    currency: 'INR',
    language: 'English',
    portal: 'Not invited',
    lastPortalActivity: '-',
    owner: 'Finance Team',
    bank: 'Not captured',
    accountNo: '-',
    ifsc: '-',
    upi: '-',
    beneficiary: party.name,
  }
  return { ...fallback, ...workflowFor(party), ...(PROFILE_EXTRAS[party.id] ?? {}) }
}

export function getPartyProfile(id) {
  const party = PARTIES_SEED.find(p => p.id === id)
  return Promise.resolve(party ? { ...party, ...profileFor(party) } : null)
}

export function validatePartyGstin(party) {
  const stateCode = party.gstin?.slice(0, 2)
  const profile = profileFor(party)
  const expected = stateCode === '27' ? 'Maharashtra'
    : stateCode === '29' ? 'Karnataka'
      : stateCode === '09' ? 'Uttar Pradesh'
        : stateCode === '07' ? 'Delhi'
          : profile.state
  return {
    valid: Boolean(party.gstin && party.gstin.length === 15),
    legalName: party.name,
    stateMatched: expected === profile.state,
    expectedState: expected,
  }
}

export function findDuplicateParties(party) {
  const normalized = party.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return Promise.resolve(PARTIES_SEED.filter(item => {
    if (item.id === party.id) return false
    const sameGstin = item.gstin && item.gstin === party.gstin
    const samePhone = item.phone && item.phone === party.phone
    const similarName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalized.slice(0, 8))
    return sameGstin || samePhone || similarName
  }))
}

const BILL_WISE = {
  P001: [
    { id:'BW-001', ref:'SI-2526-0108', type:'Invoice', dueDate:'2026-01-17', total:2850000, paid:0, balance:2850000, bucket:'Current', status:'Open' },
  ],
  P002: [
    { id:'BW-002', ref:'SI-2526-0099', type:'Invoice', dueDate:'2026-01-09', total:1920000, paid:1600000, balance:320000, bucket:'1-30', status:'Part paid' },
  ],
  P003: [
    { id:'BW-003', ref:'SI-2526-0094', type:'Invoice', dueDate:'2026-01-07', total:1540000, paid:650000, balance:890000, bucket:'31-60', status:'Overdue' },
  ],
  P008: [
    { id:'BW-004', ref:'PB-2526-0198', type:'Bill', dueDate:'2026-01-16', total:1200000, paid:0, balance:1200000, bucket:'Current', status:'Open' },
    { id:'BW-005', ref:'ADV-2526-0021', type:'Advance', dueDate:'2025-12-17', total:50000, paid:50000, balance:-50000, bucket:'Advance', status:'Adjustable' },
  ],
  P014: [
    { id:'BW-006', ref:'SI-2526-0079', type:'Invoice', dueDate:'2025-12-25', total:680000, paid:0, balance:680000, bucket:'Current', status:'Open' },
    { id:'BW-007', ref:'ADV-2526-0014', type:'Supplier Advance', dueDate:'2025-12-08', total:120000, paid:120000, balance:-120000, bucket:'Advance', status:'Adjustable' },
  ],
}

export function getPartyBillWise(id) {
  const party = PARTIES_SEED.find(p => p.id === id)
  if (!party) return Promise.resolve([])
  return Promise.resolve(BILL_WISE[id] ?? [
    { id:`BW-${id}`, ref: party.type === 'Supplier' ? 'PB-2526-0001' : 'SI-2526-0001', type: party.type === 'Supplier' ? 'Bill' : 'Invoice', dueDate: party.lastTxn, total: party.outstanding, paid: 0, balance: party.outstanding, bucket: party.overdue > 0 ? '31-60' : 'Current', status: party.overdue > 0 ? 'Overdue' : 'Open' },
  ].filter(row => row.total > 0 || row.balance !== 0))
}

export function getPartyTimeline(id) {
  const party = PARTIES_SEED.find(p => p.id === id)
  if (!party) return Promise.resolve([])
  const workflow = workflowFor(party)
  return Promise.resolve([
    { id:'TL-1', date: party.lastTxn, type:'Transaction', note:`Last transaction recorded for ${party.name}` },
    { id:'TL-2', date:'2026-01-05', type:'Reminder', note: party.overdue > 0 ? 'Payment reminder sent on WhatsApp and email' : 'Monthly statement prepared' },
    { id:'TL-3', date:'2026-01-07', type:'Note', note: party.overdue > 0 ? 'Owner to follow up on promised payment date' : 'No dispute currently open' },
    { id:'TL-4', date: workflow.lastStatement, type:'Statement', note:`Statement delivery status: ${workflow.deliveryStatus}` },
  ])
}

export function getPartyDocuments(id) {
  const party = PARTIES_SEED.find(p => p.id === id)
  if (!party) return Promise.resolve([])
  return Promise.resolve([
    { id:'DOC-1', name:'GST Certificate', type:'Tax', status:'Verified' },
    { id:'DOC-2', name:'PAN Copy', type:'KYC', status:'Pending review' },
    { id:'DOC-3', name:'Signed Statement', type:'Ledger', status: party.overdue > 0 ? 'Required' : 'Available' },
  ])
}

export const PARTY_REMINDERS = [
  { id:'REM-001', party:'Wipro Digital Ltd', type:'Customer', channel:'WhatsApp + Email', dueDate:'2026-01-07', amount:890000, template:'Overdue 31-60 days', owner:'Riya S', promiseDate:'2026-01-12', status:'scheduled' },
  { id:'REM-002', party:'Tata Consultancy Svcs', type:'Customer', channel:'SMS + Email', dueDate:'2025-12-10', amount:620000, template:'Final demand', owner:'Aman K', promiseDate:'-', status:'sent' },
  { id:'REM-003', party:'Tech Mahindra Limited', type:'Customer', channel:'WhatsApp', dueDate:'2026-01-09', amount:320000, template:'Part payment follow-up', owner:'Riya S', promiseDate:'2026-01-15', status:'promised' },
  { id:'REM-004', party:'Microsoft India Pvt Ltd', type:'Supplier', channel:'Email', dueDate:'2025-11-15', amount:245000, template:'Vendor payment update', owner:'Aman K', promiseDate:'2026-01-18', status:'scheduled' },
]

export const PARTY_PORTAL_ACCESS = [
  { id:'PORT-001', party:'Infosys BPO Ltd', type:'Customer', contact:'Meera Rao', email:'accounts@infosysbpo.example', status:'Invited', lastActivity:'Invoice viewed 2 days ago', quotes:'1 pending', invoices:'2 unpaid', documents:'3 shared' },
  { id:'PORT-002', party:'Tech Mahindra Limited', type:'Customer', contact:'Rahul Joshi', email:'ap@techmahindra.example', status:'Enabled', lastActivity:'Payment promise added', quotes:'0 pending', invoices:'1 partial', documents:'2 shared' },
  { id:'PORT-003', party:'L&T Infotech Ltd', type:'Both', contact:'Sonal Mehta', email:'accounts@lti.example', status:'Enabled', lastActivity:'Quote accepted', quotes:'Accepted', invoices:'1 unpaid', documents:'4 shared' },
  { id:'PORT-004', party:'Reliance Industries', type:'Supplier', contact:'Vikram Shah', email:'vendor.payments@ril.example', status:'Not invited', lastActivity:'-', quotes:'-', invoices:'1 bill due', documents:'1 uploaded' },
]

export const PARTY_DOCUMENT_CENTER = [
  { id:'PDOC-001', party:'Infosys BPO Ltd', document:'GST Certificate', category:'Tax', expiry:'-', required:true, status:'verified', owner:'Riya S' },
  { id:'PDOC-002', party:'Tech Mahindra Limited', document:'PAN Copy', category:'KYC', expiry:'-', required:true, status:'pending-review', owner:'Aman K' },
  { id:'PDOC-003', party:'Wipro Digital Ltd', document:'Signed Statement', category:'Ledger', expiry:'2026-03-31', required:false, status:'required', owner:'Riya S' },
  { id:'PDOC-004', party:'Reliance Industries', document:'Bank Proof', category:'Payout', expiry:'-', required:true, status:'verified', owner:'Aman K' },
  { id:'PDOC-005', party:'L&T Infotech Ltd', document:'MSA Contract', category:'Contract', expiry:'2026-09-30', required:false, status:'available', owner:'Riya S' },
]

export const PARTY_IMPORT_PREVIEW = [
  { id:'IMP-001', source:'Tally Ledger Export', file:'sundry_debtors.xlsx', rows:128, valid:113, duplicates:9, rejected:6, status:'validated', lastRun:'2026-01-08 10:30' },
  { id:'IMP-002', source:'Excel Template', file:'supplier_master.csv', rows:54, valid:49, duplicates:3, rejected:2, status:'needs-review', lastRun:'2026-01-07 16:15' },
  { id:'IMP-003', source:'Vyapar Export', file:'party_contacts.xlsx', rows:87, valid:80, duplicates:7, rejected:0, status:'ready', lastRun:'2026-01-06 11:45' },
]

export function getPartyReminders() { return Promise.resolve([...PARTY_REMINDERS]) }
export function getPartyPortalAccess() { return Promise.resolve([...PARTY_PORTAL_ACCESS]) }
export function getPartyDocumentCenter() { return Promise.resolve([...PARTY_DOCUMENT_CENTER]) }
export function getPartyImportPreview() { return Promise.resolve([...PARTY_IMPORT_PREVIEW]) }

/* ── Ledger transactions for a party (statement) ── */
const TXNS_BY_PARTY = {
  P001: [
    { id:'T1', date:'2025-04-10', ref:'SI-2526-0012', desc:'Sales Invoice – IT Services Q1',       dr:1200000, cr:0,       balance:1200000 },
    { id:'T2', date:'2025-05-15', ref:'RCV-2526-0101',desc:'Receipt – Cheque',                     dr:0,       cr:600000,  balance:600000  },
    { id:'T3', date:'2025-06-20', ref:'SI-2526-0058', desc:'Sales Invoice – Maintenance Contract', dr:850000,  cr:0,       balance:1450000 },
    { id:'T4', date:'2025-07-08', ref:'RCV-2526-0189',desc:'Receipt – NEFT',                       dr:0,       cr:800000,  balance:650000  },
    { id:'T5', date:'2025-08-22', ref:'CN-2526-0014', desc:'Credit Note – Service Discount',       dr:0,       cr:50000,   balance:600000  },
    { id:'T6', date:'2025-09-18', ref:'SI-2526-0142', desc:'Sales Invoice – Project Alpha',        dr:1500000, cr:0,       balance:2100000 },
    { id:'T7', date:'2025-10-30', ref:'RCV-2526-0312',desc:'Receipt – RTGS',                       dr:0,       cr:1200000, balance:900000  },
    { id:'T8', date:'2025-12-18', ref:'RCV-2526-0498',desc:'Receipt – Advance',                   dr:0,       cr:900000,  balance:0       },
    { id:'T9', date:'2025-12-18', ref:'SI-2526-0290', desc:'Sales Invoice – Dec Services',         dr:2850000, cr:0,       balance:2850000 },
  ],
  P008: [
    { id:'T1', date:'2025-05-01', ref:'PB-2526-0023', desc:'Purchase Bill – Raw Material',        dr:0,       cr:800000,  balance:800000  },
    { id:'T2', date:'2025-05-20', ref:'PAY-2526-0045',desc:'Payment – NEFT',                      dr:800000,  cr:0,       balance:0       },
    { id:'T3', date:'2025-08-10', ref:'PB-2526-0089', desc:'Purchase Bill – Q2 Stock',            dr:0,       cr:1200000, balance:1200000 },
    { id:'T4', date:'2025-12-17', ref:'PAY-2526-0210',desc:'Advance Payment',                     dr:50000,   cr:0,       balance:1150000 },
    { id:'T5', date:'2025-12-17', ref:'PB-2526-0198', desc:'Purchase Bill – Dec Supply',          dr:0,       cr:1200000, balance:1200000 },
  ],
}

export function getPartyStatement(partyId) {
  const txns = TXNS_BY_PARTY[partyId] ?? []
  return Promise.resolve(txns)
}
