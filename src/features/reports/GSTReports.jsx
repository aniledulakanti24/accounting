import { useState, useEffect, useMemo } from 'react'
import { Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getGSTR1Summary, getGSTR3B, getGSTR2B } from '../../data/services/taxService'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const COUNTRY_REPORTS_CONFIG = {
  IN: {
    title: 'GST Reports',
    subtitle: 'GSTR-1 · GSTR-3B · GSTR-2B ITC',
    tabs: ['GSTR-1 Summary', 'GSTR-3B', 'GSTR-2B ITC'],
  },
  US: {
    title: 'Sales Tax & 1099 Reports',
    subtitle: 'State & Local Sales Tax Remittance · 1099-NEC · Resale Exemption Audit',
    tabs: ['State Sales Tax Remittance', '1099-NEC Vendor Summary', 'Resale Exemption Audit'],
  },
  GB: {
    title: 'HMRC VAT Reports',
    subtitle: 'VAT 100 9-Box Summary · Input VAT Audit · Reverse Charge Register',
    tabs: ['VAT 100 Summary (9-Box)', 'Input VAT Audit', 'Reverse Charge Register'],
  },
  AE: {
    title: 'FTA VAT Reports',
    subtitle: 'VAT 201 Summary · Emirate-Wise Sales Breakdown · Customs BOE Recoverable',
    tabs: ['VAT 201 Return Summary', 'Emirate-Wise Sales', 'Customs & Input VAT'],
  },
}

export default function GSTReports() {
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)
  const config = COUNTRY_REPORTS_CONFIG[countryCode] || {
    title: `${countryConfig.taxSystem} Reports`,
    subtitle: `Statutory ${countryConfig.taxSystem} filing & audit records`,
    tabs: [`${countryConfig.taxSystem} Summary`, 'Tax Liabilities', 'Audit Trail'],
  }

  const [tab, setTab]       = useState(config.tabs[0])
  const [gstr1, setGstr1]   = useState([])
  const [gstr3b, setGstr3b] = useState(null)
  const [gstr2b, setGstr2b] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTab(config.tabs[0])
  }, [countryCode])

  useEffect(() => {
    Promise.all([getGSTR1Summary(), getGSTR3B(), getGSTR2B()]).then(([g1, g3b, g2b]) => {
      setGstr1(g1); setGstr3b(g3b); setGstr2b(g2b); setLoading(false)
    })
  }, [])

  const totalOutput = gstr1.reduce((s,r) => s + r.cgst + r.sgst + r.igst, 0)
  const totalTaxable = gstr1.reduce((s,r) => s + r.taxableAmt, 0)

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={`${config.subtitle} · (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={['Reports & Analytics', config.title]}
        action={<Button variant="secondary" icon={Download} size="sm">Export Report</Button>}
      />

      <div className="flex gap-1 mb-5 overflow-x-auto">
        {config.tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-[var(--radius-sm)] transition-colors ${tab===t?'bg-[var(--primary)] text-white':'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center text-sm text-[var(--faint)] py-12">Loading report records…</p> : (
        <>
          {/* TAB 1: Outward / Sales Tax / VAT Summary */}
          {tab === config.tabs[0] && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label:'Taxable Turnover', value:formatCompact(totalTaxable), color:'var(--text)' },
                  { label:`Total ${countryConfig.taxSystem}`, value:formatCompact(totalOutput),  color:'var(--primary)' },
                  { label:'Total Invoices',    value:gstr1.reduce((s,r)=>s+r.invoiceCount,0), color:'var(--muted)' },
                ].map(k => (
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      {['Rate Tier', 'Invoices', 'Taxable Base', countryCode === 'IN' ? 'CGST' : 'State/Local', countryCode === 'IN' ? 'SGST' : 'County/City', countryCode === 'IN' ? 'IGST' : 'Special Dist', `Total ${countryConfig.taxSystem}`].map(h => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${h==='Rate Tier'||h==='Invoices'?'text-left':'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gstr1.map((r,i) => (
                      <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                        <td className="px-4 py-2.5 font-semibold text-[var(--primary)]">{r.rate}</td>
                        <td className="px-4 py-2.5 text-center text-[var(--muted)]">{r.invoiceCount}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--text)]">{formatCurrency(r.taxableAmt)}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.cgst > 0 ? formatCurrency(r.cgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.sgst > 0 ? formatCurrency(r.sgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.igst > 0 ? formatCurrency(r.igst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right font-semibold text-[var(--primary)]">{formatCurrency(r.cgst+r.sgst+r.igst)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--primary)]">
                      <td className="px-4 py-3 text-sm font-bold text-[var(--text)]">TOTAL</td>
                      <td className="px-4 py-3 text-center font-bold">{gstr1.reduce((s,r)=>s+r.invoiceCount,0)}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(totalTaxable)}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(gstr1.reduce((s,r)=>s+r.cgst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(gstr1.reduce((s,r)=>s+r.sgst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold">{formatCurrency(gstr1.reduce((s,r)=>s+r.igst,0))}</td>
                      <td className="px-4 py-3 tabular text-right font-bold text-[var(--primary)]">{formatCurrency(totalOutput)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 2: Summary Return / 1099 / Input VAT */}
          {tab === config.tabs[1] && gstr3b && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--pos-tint)] border border-[var(--pos)]">
                <CheckCircle2 size={16} className="text-[var(--pos)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--pos)]">Filed & Verified — {gstr3b.period}</p>
                  <p className="text-xs text-[var(--muted)]">Statutory Reference: {gstr3b.arn} · Filed on {gstr3b.filedOn}</p>
                </div>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Summary Head</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Direct/Interstate</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Central/State</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Local/District</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label:'Gross Statutory Liability',  data:gstr3b.outwardLiability, color:'var(--text)'    },
                      { label:'Eligible Input Credit / Exemptions', data:gstr3b.itcAvailable,     color:'var(--pos)'     },
                      { label:'Net Remittance Due',         data:gstr3b.netPayable,       color:'var(--primary)' },
                      { label:'Bank EFT / Cash Disbursed',  data:gstr3b.cashPaid,         color:'var(--neg)'     },
                    ].map((row, i) => (
                      <tr key={row.label} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                        <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.label}</td>
                        <td className="px-4 py-3 tabular text-right" style={{color:row.color}}>{row.data.igst > 0 ? formatCurrency(row.data.igst) : '-'}</td>
                        <td className="px-4 py-3 tabular text-right" style={{color:row.color}}>{formatCurrency(row.data.cgst)}</td>
                        <td className="px-4 py-3 tabular text-right" style={{color:row.color}}>{formatCurrency(row.data.sgst)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Input Reconciliation / Audit */}
          {tab === config.tabs[2] && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label:`Total Input ${countryConfig.taxSystem}`, value:formatCompact(gstr2b.filter(r=>r.itcStatus==='Available').reduce((s,r)=>s+r.cgst+r.sgst+r.igst,0)), color:'var(--pos)' },
                  { label:'Verified / Matched',             value:gstr2b.filter(r=>r.matched).length, color:'var(--pos)' },
                  { label:'Unmatched / Blocked',            value:gstr2b.filter(r=>!r.matched).length, color:'var(--neg)' },
                ].map(k => (
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                      {['Counterparty', 'Doc Ref', 'Date', countryCode === 'IN' ? 'CGST' : 'Base Tax', countryCode === 'IN' ? 'SGST' : 'Local Surtax', countryCode === 'IN' ? 'IGST' : 'Special Tax', 'Status', 'Audit'].map(h => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${['CGST','SGST','IGST','Base Tax','Local Surtax','Special Tax'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gstr2b.map((r,i) => (
                      <tr key={r.id} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                        <td className="px-4 py-2.5 font-medium text-[var(--text)]">{r.supplier}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[var(--primary)]">{r.invoiceNo}</td>
                        <td className="px-4 py-2.5 text-[var(--muted)] text-xs">{r.date}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.cgst > 0 ? formatCurrency(r.cgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.sgst > 0 ? formatCurrency(r.sgst) : '—'}</td>
                        <td className="px-4 py-2.5 tabular text-right text-[var(--muted)]">{r.igst > 0 ? formatCurrency(r.igst) : '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.itcStatus==='Available'?'bg-[var(--pos-tint)] text-[var(--pos)]':'bg-[var(--neg-tint)] text-[var(--neg)]'}`}>{r.itcStatus}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {r.matched
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pos)]"><CheckCircle2 size={11}/>Verified</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--warn)]"><AlertCircle size={11}/>Variance</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
