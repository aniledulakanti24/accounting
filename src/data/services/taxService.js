/* ── Tax Center service — mock data ── */

/* GSTR-1: outward supply summary by rate */
export const GSTR1_SUMMARY = [
  { id:'G1-01', rate:'18%', taxableAmt:8450000, cgst:760500, sgst:760500, igst:0,      total:9971000, invoiceCount:12 },
  { id:'G1-02', rate:'12%', taxableAmt:2180000, cgst:130800, sgst:130800, igst:0,      total:2441600, invoiceCount:5  },
  { id:'G1-03', rate:'5%',  taxableAmt:580000,  cgst:14500,  sgst:14500,  igst:0,      total:609000,  invoiceCount:3  },
  { id:'G1-04', rate:'0%',  taxableAmt:120000,  cgst:0,      sgst:0,      igst:0,      total:120000,  invoiceCount:2  },
]
export const GSTR1_INVOICES = [
  { id:'GI001', period:'Dec 2025', gstin:'27AAACI5345K1ZE', party:'Infosys BPO Ltd',       invoiceNo:'SI-2526-0108', date:'2025-12-18', taxable:2415254, igst:0,      cgst:217373,  sgst:217373,  total:2850000 },
  { id:'GI002', period:'Dec 2025', gstin:'27AABCT5840Q1ZL', party:'Tech Mahindra Limited', invoiceNo:'SI-2526-0099', date:'2025-12-10', taxable:1627119, igst:0,      cgst:146441,  sgst:146441,  total:1920000 },
  { id:'GI003', period:'Dec 2025', gstin:'27AAACW0027H1ZR', party:'Wipro Digital Ltd',     invoiceNo:'SI-2526-0094', date:'2025-12-08', taxable:1305085, igst:0,      cgst:117458,  sgst:117458,  total:1540000 },
]
export function getGSTR1Summary(period) { return Promise.resolve([...GSTR1_SUMMARY]) }
export function getGSTR1Invoices(period) { return Promise.resolve([...GSTR1_INVOICES]) }

/* GSTR-3B: liability vs ITC */
export const GSTR3B = {
  period: 'December 2025',
  outwardLiability: { igst:0, cgst:1274372, sgst:1274372, cess:0, total:2548744 },
  itcAvailable:     { igst:0, cgst:420000,  sgst:420000,  cess:0, total:840000  },
  netPayable:       { igst:0, cgst:854372,  sgst:854372,  cess:0, total:1708744 },
  cashPaid:         { igst:0, cgst:854372,  sgst:854372,  cess:0, total:1708744 },
  status: 'Filed',
  arn: 'AA270126123456789',
  filedOn: '2026-01-20',
}
export function getGSTR3B(period) { return Promise.resolve({...GSTR3B}) }

/* GSTR-2B: ITC available (purchase-side) */
export const GSTR2B = [
  { id:'2B001', period:'Dec 2025', gstin:'27AAACR0349K1ZF', supplier:'Reliance Industries',  invoiceNo:'PI-2526-0042', date:'2026-01-05', taxable:1271186, igst:0,     cgst:114407, sgst:114407, total:1500000, itcStatus:'Available', matched:true  },
  { id:'2B002', period:'Dec 2025', gstin:'27AAACA8719H1ZN', supplier:'Adani Enterprises',    invoiceNo:'PI-2526-0039', date:'2025-12-28', taxable:847458,  igst:0,     cgst:76271,  sgst:76271,  total:1000000, itcStatus:'Available', matched:true  },
  { id:'2B003', period:'Dec 2025', gstin:'27AABCT5840Q1ZL', supplier:'Tata Steel',           invoiceNo:'PI-2526-0036', date:'2025-12-20', taxable:635593,  igst:0,     cgst:57203,  sgst:57203,  total:750000,  itcStatus:'Available', matched:false },
  { id:'2B004', period:'Dec 2025', gstin:'27AAACL5167G1ZO', supplier:'BHEL',                 invoiceNo:'PI-2526-0027', date:'2025-12-05', taxable:423729,  igst:0,     cgst:38136,  sgst:38136,  total:500000,  itcStatus:'Blocked',   matched:false },
]
export function getGSTR2B(period) { return Promise.resolve([...GSTR2B]) }

/* E-Invoicing */
export const E_INVOICES = [
  { id:'EI001', invoiceNo:'SI-2526-0108', date:'2025-12-18', party:'Infosys BPO Ltd',       amount:2850000, irn:'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', status:'generated', ackDate:'2025-12-18' },
  { id:'EI002', invoiceNo:'SI-2526-0099', date:'2025-12-10', party:'Tech Mahindra Limited', amount:1920000, irn:'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', status:'generated', ackDate:'2025-12-10' },
  { id:'EI003', invoiceNo:'SI-2526-0094', date:'2025-12-08', party:'Wipro Digital Ltd',     amount:1540000, irn:'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', status:'generated', ackDate:'2025-12-08' },
  { id:'EI004', invoiceNo:'SI-2526-0088', date:'2025-12-02', party:'HCL Technologies',      amount:980000,  irn:null,                                                              status:'pending',   ackDate:null         },
  { id:'EI005', invoiceNo:'SI-2526-0065', date:'2025-11-10', party:'Tata Consultancy Svcs', amount:620000,  irn:'d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', status:'cancelled', ackDate:'2025-11-10' },
]
export function getEInvoices() { return Promise.resolve([...E_INVOICES]) }

/* E-Way Bills */
export const EWAYBILLS = [
  { id:'EW001', ewbNo:'241019123456', date:'2025-12-18', party:'Infosys BPO Ltd',       invoice:'SI-2526-0108', amount:2850000, from:'Mumbai', to:'Bengaluru', mode:'Road', vehicle:'MH02AB1234', validTill:'2025-12-20', status:'active'  },
  { id:'EW002', ewbNo:'241019234567', date:'2025-12-10', party:'Tech Mahindra Limited', invoice:'SI-2526-0099', amount:1920000, from:'Mumbai', to:'Pune',      mode:'Road', vehicle:'MH04CD5678', validTill:'2025-12-11', status:'expired' },
  { id:'EW003', ewbNo:'241019345678', date:'2025-12-08', party:'Wipro Digital Ltd',     invoice:'SI-2526-0094', amount:1540000, from:'Mumbai', to:'Hyderabad', mode:'Rail', vehicle:'—',          validTill:'2025-12-12', status:'expired' },
  { id:'EW004', ewbNo:null,           date:'2025-12-02', party:'HCL Technologies',      invoice:'SI-2526-0088', amount:980000,  from:'Mumbai', to:'Noida',     mode:'Road', vehicle:'—',          validTill:null,         status:'pending' },
]
export function getEWayBills() { return Promise.resolve([...EWAYBILLS]) }

/* TDS */
export const TDS_DEDUCTIONS = [
  { id:'TDS001', date:'2025-12-31', vendor:'Mehta & Associates',  nature:'194J — Professional Fees', grossAmt:50000,  tdsRate:'10%', tdsAmt:5000,  netPaid:45000, challanNo:'CHAL281-001', status:'deposited' },
  { id:'TDS002', date:'2025-12-31', vendor:'IndiGo Airlines',     nature:'194C — Contractor',        grossAmt:85000,  tdsRate:'2%',  tdsAmt:1700,  netPaid:83300, challanNo:'CHAL281-001', status:'deposited' },
  { id:'TDS003', date:'2025-12-31', vendor:'Google India',        nature:'194J — Technical Services',grossAmt:50000,  tdsRate:'10%', tdsAmt:5000,  netPaid:45000, challanNo:null,          status:'pending'   },
  { id:'TDS004', date:'2025-11-30', vendor:'CoolTech Services',   nature:'194C — Contractor',        grossAmt:10000,  tdsRate:'2%',  tdsAmt:200,   netPaid:9800,  challanNo:'CHAL281-002', status:'deposited' },
  { id:'TDS005', date:'2025-11-30', vendor:'Adobe Systems',       nature:'194J — Royalty/Software',  grossAmt:25000,  tdsRate:'10%', tdsAmt:2500,  netPaid:22500, challanNo:'CHAL281-002', status:'deposited' },
]
export function getTDSDeductions() { return Promise.resolve([...TDS_DEDUCTIONS]) }

/* TCS */
export const TCS_COLLECTIONS = [
  { id:'TCS001', date:'2025-12-18', customer:'Infosys BPO Ltd',       invoice:'SI-2526-0108', nature:'206C(1H) — Sales >50L', grossAmt:2850000, tcsRate:'0.1%', tcsAmt:2850,  challanNo:null,          status:'pending'   },
  { id:'TCS002', date:'2025-12-10', customer:'Tech Mahindra Limited', invoice:'SI-2526-0099', nature:'206C(1H) — Sales >50L', grossAmt:1920000, tcsRate:'0.1%', tcsAmt:1920,  challanNo:'CHAL281-003', status:'deposited' },
]
export function getTCSCollections() { return Promise.resolve([...TCS_COLLECTIONS]) }

/* Tax Payments */
export const TAX_PAYMENTS = [
  { id:'TP001', type:'GST',     period:'Nov 2025', challanNo:'CHAL-GST-NOV25', date:'2025-12-20', amount:1580000, bank:'ICICI', status:'paid'    },
  { id:'TP002', type:'GST',     period:'Oct 2025', challanNo:'CHAL-GST-OCT25', date:'2025-11-20', amount:1420000, bank:'ICICI', status:'paid'    },
  { id:'TP003', type:'TDS',     period:'Nov 2025', challanNo:'CHAL281-002',    date:'2025-12-07', amount:11900,   bank:'ICICI', status:'paid'    },
  { id:'TP004', type:'TDS',     period:'Dec 2025', challanNo:'CHAL281-001',    date:'2026-01-07', amount:11700,   bank:'ICICI', status:'paid'    },
  { id:'TP005', type:'GST',     period:'Dec 2025', challanNo:null,             date:null,          amount:1708744, bank:'—',    status:'pending' },
  { id:'TP006', type:'Adv Tax', period:'Q3 FY26',  challanNo:'CHAL280-001',    date:'2025-12-15', amount:650000,  bank:'ICICI', status:'paid'    },
]
export function getTaxPayments() { return Promise.resolve([...TAX_PAYMENTS]) }

/* Quarterly Compliance Calendar */
export const COMPLIANCE_CALENDAR = [
  { id:'CC001', dueDate:'2026-01-11', task:'GSTR-1 (Dec 2025)',         type:'GST',  status:'filed',   filedOn:'2026-01-10' },
  { id:'CC002', dueDate:'2026-01-20', task:'GSTR-3B (Dec 2025)',        type:'GST',  status:'filed',   filedOn:'2026-01-20' },
  { id:'CC003', dueDate:'2026-01-07', task:'TDS Deposit (Dec 2025)',    type:'TDS',  status:'paid',    filedOn:'2026-01-07' },
  { id:'CC004', dueDate:'2026-01-31', task:'TDS Return 26Q (Q3)',       type:'TDS',  status:'pending', filedOn:null         },
  { id:'CC005', dueDate:'2026-02-11', task:'GSTR-1 (Jan 2026)',         type:'GST',  status:'upcoming',filedOn:null         },
  { id:'CC006', dueDate:'2026-02-20', task:'GSTR-3B (Jan 2026)',        type:'GST',  status:'upcoming',filedOn:null         },
  { id:'CC007', dueDate:'2026-03-15', task:'Advance Tax Q4',            type:'Tax',  status:'upcoming',filedOn:null         },
  { id:'CC008', dueDate:'2026-03-31', task:'Annual GSTR-9 (FY25)',      type:'GST',  status:'upcoming',filedOn:null         },
]
export function getComplianceCalendar() { return Promise.resolve([...COMPLIANCE_CALENDAR]) }
