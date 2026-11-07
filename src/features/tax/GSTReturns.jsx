import { useState, useEffect, useMemo } from 'react'
import { FileText, Eye, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import CompliancePipeline from '../../components/compliance/CompliancePipeline'
import { getCountryTaxConfig, formatMoneyByCountry } from '../../lib/countryTax'
import { getGSTR1Summary, getGSTR3B } from '../../data/services/taxService'
import { useAppStore } from '../../store/useAppStore'

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  )
}

export default function GSTReturns() {
  const { activeCompany, setCompanyCountry } = useAppStore()
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [tab, setTab] = useState(countryCode === 'IN' ? 'gstr1' : 'statutory-return')
  const [gstr1, setGstr1] = useState([])
  const [gstr3b, setGstr3b] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getGSTR1Summary(), getGSTR3B()]).then(([g1, g3b]) => {
      setGstr1(g1)
      setGstr3b(g3b)
      setLoading(false)
    })
  }, [])

  // Update default tab if country changes
  useEffect(() => {
    if (countryCode === 'IN') {
      setTab('gstr1')
    } else {
      setTab('statutory-return')
    }
  }, [countryCode])

  const totalTaxable = gstr1.reduce((s, i) => s + i.taxableAmt, 0)
  const totalGST = gstr1.reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0)
  const totalInvoices = gstr1.reduce((s, i) => s + i.invoiceCount, 0)

  /* ── India GSTR Columns ── */
  const gstr1Columns = [
    { key: 'rate', label: 'Rate', render: v => <span className="font-semibold text-[var(--text)]">{v}</span> },
    { key: 'taxableAmt', label: 'Taxable Amt', align: 'right', render: v => <span className="tabular text-sm">{formatMoneyByCountry(v, 'IN')}</span> },
    { key: 'cgst', label: 'CGST', align: 'right', render: v => <span className="tabular text-sm text-[var(--muted)]">{formatMoneyByCountry(v, 'IN')}</span> },
    { key: 'sgst', label: 'SGST', align: 'right', render: v => <span className="tabular text-sm text-[var(--muted)]">{formatMoneyByCountry(v, 'IN')}</span> },
    { key: 'igst', label: 'IGST', align: 'right', render: v => <span className="tabular text-sm text-[var(--muted)]">{formatMoneyByCountry(v, 'IN')}</span> },
    { key: 'total', label: 'Total', align: 'right', render: v => <span className="tabular text-sm font-semibold text-[var(--text)]">{formatMoneyByCountry(v, 'IN')}</span> },
    { key: 'invoiceCount', label: 'Invoices', align: 'center', render: v => <span className="tabular text-sm text-[var(--muted)]">{v}</span> },
  ]

  const G3B = gstr3b
  const g3bRows = G3B ? [
    { label: 'CGST', liability: G3B.outwardLiability.cgst, itc: G3B.itcAvailable.cgst, net: G3B.netPayable.cgst },
    { label: 'SGST', liability: G3B.outwardLiability.sgst, itc: G3B.itcAvailable.sgst, net: G3B.netPayable.sgst },
    { label: 'IGST', liability: G3B.outwardLiability.igst, itc: G3B.itcAvailable.igst, net: G3B.netPayable.igst },
    { label: 'Total', liability: G3B.outwardLiability.total, itc: G3B.itcAvailable.total, net: G3B.netPayable.total, bold: true },
  ] : []

  /* ── US Sales Tax Data ── */
  const usSalesTaxRows = [
    { state: 'California (CDTFA)', grossSales: 450000, exempt: 50000, taxable: 400000, rate: '7.25%', taxDue: 29000, localTax: 5000, totalRemit: 34000 },
    { state: 'New York (DTF)', grossSales: 320000, exempt: 20000, taxable: 300000, rate: '8.875%', taxDue: 26625, localTax: 0, totalRemit: 26625 },
    { state: 'Texas (Comptroller)', grossSales: 180000, exempt: 10000, taxable: 170000, rate: '6.25%', taxDue: 10625, localTax: 3400, totalRemit: 14025 },
  ]

  /* ── UK MTD VAT Data ── */
  const ukVatBoxes = [
    { box: 'Box 1', label: 'VAT due in the period on sales and other outputs', amount: 56400 },
    { box: 'Box 2', label: 'VAT due in the period on acquisitions from other countries', amount: 0 },
    { box: 'Box 3', label: 'Total VAT due (Box 1 + Box 2)', amount: 56400, bold: true },
    { box: 'Box 4', label: 'VAT reclaimed in the period on purchases and other inputs', amount: 21800 },
    { box: 'Box 5', label: 'Net VAT to pay to HMRC (Box 3 - Box 4)', amount: 34600, bold: true, highlight: true },
    { box: 'Box 6', label: 'Total value of sales and all other outputs excluding any VAT', amount: 282000 },
    { box: 'Box 7', label: 'Total value of purchases and all other inputs excluding any VAT', amount: 109000 },
  ]

  /* ── UAE FTA VAT 201 Data ── */
  const uaeVatBoxes = [
    { box: '1a', label: 'Standard rated supplies in Dubai (5%)', amount: 350000, vat: 17500 },
    { box: '1b', label: 'Standard rated supplies in Abu Dhabi (5%)', amount: 150000, vat: 7500 },
    { box: '2',  label: 'Supplies subject to the reverse charge provisions', amount: 80000, vat: 4000 },
    { box: '3',  label: 'Zero-rated supplies (0%)', amount: 120000, vat: 0 },
    { box: '4',  label: 'Exempt supplies', amount: 45000, vat: 0 },
    { box: '9',  label: 'Total Output Tax Due (Boxes 1 to 8)', amount: 745000, vat: 29000, bold: true },
    { box: '10', label: 'Standard rated expenses (Input Tax Recoverable)', amount: 220000, vat: 11000 },
    { box: '14', label: 'Total Net Tax Payable to FTA for the period', amount: null, vat: 18000, bold: true, highlight: true },
  ]

  return (
    <div>
      <PageHeader
        title={`${countryConfig.taxSystem} Returns & Statutory Filings`}
        subtitle={`${countryConfig.name} compliance, tax liabilities, and return staging`}
        breadcrumb={['Tax Center', `${countryConfig.taxSystem} Returns`]}
      />

      {/* Jurisdiction Header Banner */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{countryConfig.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text)]">{countryConfig.name} Tax Jurisdiction</span>
              <span className="rounded bg-[var(--primary-tint)] px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
                {countryConfig.taxSystem} Active
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {countryConfig.taxIdLabel}: <strong>{activeCompany?.taxId || activeCompany?.gstin || 'None'}</strong> · Currency: <strong>{countryConfig.currency} ({countryConfig.currencySymbol})</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Jurisdiction:</span>
          <select
            value={countryCode}
            onChange={(e) => setCompanyCountry(e.target.value)}
            className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]"
          >
            <option value="IN">🇮🇳 India (GST)</option>
            <option value="US">🇺🇸 United States (Sales Tax)</option>
            <option value="GB">🇬🇧 United Kingdom (MTD VAT)</option>
            <option value="AE">🇦🇪 UAE (FTA VAT 201)</option>
          </select>
        </div>
      </div>

      {countryCode === 'IN' && <CompliancePipeline />}

      {/* ── INDIA GST REGIME VIEW ── */}
      {countryCode === 'IN' && (
        <>
          <div className="flex gap-1 border-b border-[var(--border)] mb-5">
            <TabButton active={tab === 'gstr1'} onClick={() => setTab('gstr1')}>GSTR-1 (Outward Supplies)</TabButton>
            <TabButton active={tab === 'gstr3b'} onClick={() => setTab('gstr3b')}>GSTR-3B (Monthly Summary)</TabButton>
          </div>

          {tab === 'gstr1' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total Taxable', value: formatMoneyByCountry(totalTaxable, 'IN'), color: 'var(--text)' },
                  { label: 'Total GST', value: formatMoneyByCountry(totalGST, 'IN'), color: 'var(--primary)' },
                  { label: 'Invoice Count', value: totalInvoices, color: 'var(--muted)' },
                ].map(k => (
                  <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
                    <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>
              <DataTable
                columns={gstr1Columns}
                data={gstr1}
                loading={loading}
                rowKey="id"
                toolbar={
                  <div className="flex justify-end">
                    <Button variant="primary" icon={FileText} size="sm">File GSTR-1</Button>
                  </div>
                }
              />
            </>
          )}

          {tab === 'gstr3b' && G3B && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pos-tint)] px-3 py-1 text-xs font-semibold text-[var(--pos)]">
                  <CheckCircle2 size={12} /> {G3B.status} — ARN: {G3B.arn}
                </span>
                <span className="text-sm text-[var(--muted)]">Filed on {G3B.filedOn} · Period: {G3B.period}</span>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-sm mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Head</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Liability</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">ITC</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {g3bRows.map(row => (
                      <tr key={row.label} className={row.bold ? 'bg-[var(--surface-2)]' : ''}>
                        <td className={`px-4 py-3 ${row.bold ? 'font-bold text-[var(--text)]' : 'text-[var(--muted)]'}`}>{row.label}</td>
                        <td className={`px-4 py-3 text-right tabular ${row.bold ? 'font-bold text-[var(--text)]' : 'text-[var(--text)]'}`}>{formatMoneyByCountry(row.liability, 'IN')}</td>
                        <td className={`px-4 py-3 text-right tabular ${row.bold ? 'font-bold text-[var(--pos)]' : 'text-[var(--pos)]'}`}>{formatMoneyByCountry(row.itc, 'IN')}</td>
                        <td className={`px-4 py-3 text-right tabular ${row.bold ? 'font-bold text-[var(--primary)]' : 'text-[var(--primary)]'}`}>{formatMoneyByCountry(row.net, 'IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" icon={Eye} size="sm">View Filed Return</Button>
              </div>
            </>
          )}
        </>
      )}

      {/* ── USA SALES & USE TAX REGIME VIEW ── */}
      {countryCode === 'US' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Gross Taxable Sales</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text)]">{formatMoneyByCountry(870000, 'US')}</p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">State & Local Sales Tax Due</p>
              <p className="mt-1 text-2xl font-bold text-[var(--primary)]">{formatMoneyByCountry(74650, 'US')}</p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Next Remittance Due</p>
              <p className="mt-1 text-2xl font-bold text-amber-500">Jan 31, 2027</p>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[var(--text)]">Multi-State Nexus & Sales Tax Remittance Summary</h4>
                <p className="text-xs text-[var(--muted)]">Quarterly State Returns for Active Economic Nexus Jurisdictions</p>
              </div>
              <Button variant="primary" icon={FileText} size="sm">Remit Sales Tax</Button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-4 py-3 text-left">State Authority</th>
                  <th className="px-4 py-3 text-right">Gross Sales</th>
                  <th className="px-4 py-3 text-right">Exempt B2B</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">State Rate</th>
                  <th className="px-4 py-3 text-right">Local / District</th>
                  <th className="px-4 py-3 text-right font-bold text-[var(--text)]">Total Remittance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {usSalesTaxRows.map(r => (
                  <tr key={r.state} className="hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-3 font-semibold text-[var(--text)]">{r.state}</td>
                    <td className="px-4 py-3 text-right tabular text-[var(--muted)]">{formatMoneyByCountry(r.grossSales, 'US')}</td>
                    <td className="px-4 py-3 text-right tabular text-[var(--muted)]">{formatMoneyByCountry(r.exempt, 'US')}</td>
                    <td className="px-4 py-3 text-right tabular font-medium text-[var(--text)]">{formatMoneyByCountry(r.taxable, 'US')}</td>
                    <td className="px-4 py-3 text-right tabular text-[var(--muted)]">{r.rate}</td>
                    <td className="px-4 py-3 text-right tabular text-[var(--muted)]">{formatMoneyByCountry(r.localTax, 'US')}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-[var(--primary)]">{formatMoneyByCountry(r.totalRemit, 'US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── UK MTD VAT RETURN VIEW ── */}
      {countryCode === 'GB' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 size={15} /> HMRC Making Tax Digital (MTD) Gateway Connected
            </span>
            <span>VAT Registration: {activeCompany?.taxId || 'GB 123 4567 89'}</span>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[var(--text)]">HMRC VAT 100 Return (9-Box Declaration)</h4>
                <p className="text-xs text-[var(--muted)]">Period: Q4 2026 · Standard 20% / Reduced 5% / Zero-Rated</p>
              </div>
              <Button variant="primary" icon={FileText} size="sm">Submit to HMRC</Button>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                {ukVatBoxes.map(b => (
                  <tr key={b.box} className={b.highlight ? 'bg-[var(--primary-tint)]/25' : b.bold ? 'bg-[var(--surface-2)]' : ''}>
                    <td className="px-4 py-3 w-24 font-mono font-bold text-[var(--primary)]">{b.box}</td>
                    <td className={`px-4 py-3 ${b.bold ? 'font-bold text-[var(--text)]' : 'text-[var(--muted)]'}`}>{b.label}</td>
                    <td className={`px-4 py-3 text-right tabular font-mono ${b.bold ? 'font-bold text-base text-[var(--text)]' : 'text-sm text-[var(--text)]'}`}>
                      {formatMoneyByCountry(b.amount, 'GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── UAE FTA VAT 201 VIEW ── */}
      {countryCode === 'AE' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--primary)]/20 bg-[var(--primary-tint)] p-3 text-xs text-[var(--primary)]">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={15} /> Federal Tax Authority (FTA) ZATCA E-Invoicing Ready
            </span>
            <span>TRN: {activeCompany?.taxId || '100234567800003'}</span>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[var(--text)]">FTA VAT 201 Return Declaration</h4>
                <p className="text-xs text-[var(--muted)]">Standard 5% Rate · Emirate-Wise Output vs Input VAT</p>
              </div>
              <Button variant="primary" icon={FileText} size="sm">File VAT 201 Return</Button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-4 py-3 text-left">Box</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Supplies (AED)</th>
                  <th className="px-4 py-3 text-right font-bold">VAT Amount (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {uaeVatBoxes.map(b => (
                  <tr key={b.box} className={b.highlight ? 'bg-[var(--primary-tint)]/25' : b.bold ? 'bg-[var(--surface-2)]' : ''}>
                    <td className="px-4 py-3 font-mono font-bold text-[var(--primary)]">{b.box}</td>
                    <td className={`px-4 py-3 ${b.bold ? 'font-bold text-[var(--text)]' : 'text-[var(--muted)]'}`}>{b.label}</td>
                    <td className="px-4 py-3 text-right tabular text-[var(--muted)]">
                      {b.amount != null ? formatMoneyByCountry(b.amount, 'AE') : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right tabular font-mono ${b.bold ? 'font-bold text-base text-[var(--text)]' : 'text-sm text-[var(--text)]'}`}>
                      {formatMoneyByCountry(b.vat, 'AE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
