import { useEffect, useRef } from 'react'
import { Ban, CheckCircle2, ChevronDown, FileDown, Globe, Printer, Receipt, Share2, ShieldCheck, Truck, X } from 'lucide-react'
import { getCountryTaxConfig, formatMoneyByCountry, calculateDocumentTax } from '../../lib/countryTax'
import { useAppStore } from '../../store/useAppStore'

const EWAY_CFG = {
  active:  { label: 'EWB active',  tone: 'text-[#15803d] bg-[#dcfce7]' },
  closed:  { label: 'EWB closed',  tone: 'text-[#64748b] bg-[#f1f5f9]' },
  expired: { label: 'EWB expired', tone: 'text-[#dc2626] bg-[#fee2e2]' },
  pending: { label: 'EWB due',     tone: 'text-[#b45309] bg-[#fef3c7]' },
  none:    { label: 'No EWB',      tone: 'text-[#64748b] bg-[#f1f5f9]' },
}

function EwayChip({ status }) {
  const cfg = EWAY_CFG[status] ?? EWAY_CFG.none
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.tone}`}>{cfg.label}</span>
}

export default function InvoicePreview({
  open,
  onClose,
  onShare,
  invoice,
  onEwayAction,
  onCreateChallan,
  onCreateReceipt,
}) {
  const printRef = useRef(null)
  const { activeCompany } = useAppStore()
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const ewayOpen = open && !!invoice

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open || !invoice) return null

  const outstanding = (invoice.total ?? 0) - (invoice.paid ?? 0)
  const ewayNo = invoice.ewayNo ?? (invoice.ewayStatus === 'active' || invoice.ewayStatus === 'closed' || invoice.ewayStatus === 'expired'
    ? `EWB-${invoice.ref.replace(/\D/g, '').slice(-8)}`
    : 'Not generated')

  function handlePrint() {
    const content = printRef.current?.innerHTML
    if (!content) return
    const w = window.open('', '_blank', 'width=850,height=1100')
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${countryConfig.invoiceTitle} ${invoice.ref}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #0F172A; padding: 40px; font-size: 13px; }
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .company-name { font-size: 20px; font-weight: 800; color: #0F6E56; }
    .inv-meta { text-align: right; }
    .inv-meta h2 { font-size: 26px; font-weight: 900; color: #0F6E56; letter-spacing: -0.5px; }
    .inv-meta p { font-size: 12px; color: #64748B; margin-top: 2px; }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    thead tr { background: #F1F5F9; }
    th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 12px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
    .totals-box { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .total-row.grand { border-top: 2px solid #0F6E56; margin-top: 8px; padding-top: 12px; font-weight: 800; font-size: 16px; color: #0F6E56; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>${content}</body>
</html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 400)
  }

  const statusColor = {
    paid:    { bg: '#DCFCE7', color: '#16a34a' },
    partial: { bg: '#FEF3C7', color: '#d97706' },
    unpaid:  { bg: '#F1F5F9', color: '#64748B' },
    overdue: { bg: '#FEE2E2', color: '#EF4444' },
  }[invoice.status] ?? { bg: '#F1F5F9', color: '#64748B' }

  const taxLabel = countryConfig.taxSystem === 'GST' ? 'GST' : countryConfig.taxSystem === 'VAT' ? 'VAT' : 'Sales Tax'
  const taxBreakdown = calculateDocumentTax({
    subtotal: invoice.subtotal || 0,
    taxRate: 18,
    companyCountry: countryCode,
    companyRegion: activeCompany?.zones?.[0] || countryConfig.regions[0],
    partyRegion: invoice.state || activeCompany?.zones?.[0] || countryConfig.regions[0],
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[920] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 sm:inset-8 lg:inset-16 z-[930] bg-[var(--bg)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'previewIn 220ms cubic-bezier(0.16,1,0.3,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
          <p className="text-sm font-bold text-[var(--text)] flex-1 flex items-center gap-2">
            <span>{countryConfig.flag}</span>
            <span>{countryConfig.invoiceTitle} Preview — </span>
            <span style={{ color: 'var(--primary)' }}>{invoice.ref}</span>
            <span className="rounded bg-[var(--primary-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
              {countryConfig.name} ({countryConfig.taxSystem})
            </span>
          </p>
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--text)' }}
          >
            <Share2 size={13} /> Share
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            <Printer size={13} /> Print / PDF
          </button>
          {countryConfig.hasEWayBill && (
            <button
              onClick={() => onEwayAction?.('generate', invoice)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--primary)]/25 bg-[var(--primary-tint)] text-[var(--primary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <ShieldCheck size={13} /> Generate E-way Bill <ChevronDown size={12} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)] transition-colors ml-1">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable invoice body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-5">
          <div
            ref={printRef}
            className="w-full max-w-[760px] bg-white rounded-xl shadow-lg p-10"
            style={{ border: '1px solid #E2E8F0' }}
          >
            {/* Invoice header */}
            <div className="inv-header flex justify-between items-start mb-8">
              <div>
                <p className="text-xl font-extrabold" style={{ color: 'var(--primary)' }}>
                  {activeCompany?.name || 'Acme Global Corporation'}
                </p>
                <p className="text-xs text-[#64748B] mt-1 font-mono font-medium">
                  {countryConfig.taxIdLabel}: {activeCompany?.taxId || activeCompany?.gstin || 'Configured'}
                </p>
                <p className="text-xs text-[#64748B]">
                  {activeCompany?.branch || countryConfig.regions[0]}, {countryConfig.name}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black tracking-tight uppercase" style={{ color: 'var(--primary)' }}>
                  {countryConfig.invoiceTitle}
                </h2>
                <p className="text-sm font-mono font-bold mt-1 text-[#0F172A]">{invoice.ref}</p>
                <span
                  className="inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase"
                  style={{ background: statusColor.bg, color: statusColor.color }}
                >
                  {invoice.status}
                </span>
              </div>
            </div>

            <hr style={{ borderColor: '#E2E8F0', marginBottom: 20 }} />

            {/* Bill to + dates */}
            <div className="flex justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Billed To</p>
                <p className="font-bold text-[#0F172A]">{invoice.customer}</p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {countryConfig.taxIdLabel}: {invoice.taxId || invoice.gstin || 'Standard Party'}
                </p>
                <p className="text-xs text-[#64748B]">
                  {invoice.city || countryConfig.regions[0]}, {countryConfig.name}
                </p>
              </div>
              <div className="text-right">
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">Invoice Date</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{invoice.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">Payment Due Date</p>
                  <p className="text-sm font-semibold" style={{ color: invoice.status === 'overdue' ? '#EF4444' : '#0F172A' }}>
                    {invoice.dueDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['#', 'Item & Description', 'Qty', `Rate (${countryConfig.currencySymbol})`, `${taxLabel}%`, `Amount (${countryConfig.currencySymbol})`].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: h.startsWith('Amount') ? 'right' : 'left',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: '#64748B',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: invoice.items ?? 2 }, (_, i) => {
                  const lineSubtotal = i === 0 ? Math.round((invoice.subtotal ?? 0) * 0.6) : Math.round((invoice.subtotal ?? 0) * 0.4)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px', fontSize: 13, color: '#94A3B8' }}>{i + 1}</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>
                        <span className="font-semibold">{i === 0 ? 'Enterprise Cloud Accounting System' : 'Annual Platform Subscription & Support'}</span>
                        <span className="block text-xs text-[#94A3B8]">{countryConfig.codeLabel}: {i === 0 ? '998311' : '998313'}</span>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#64748B' }}>1</td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>
                        {formatMoneyByCountry(lineSubtotal, countryCode)}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#64748B' }}>18%</td>
                      <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatMoneyByCountry(lineSubtotal, countryCode)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals & Dynamic Statutory Breakdown */}
            <div style={{ marginLeft: 'auto', width: 290 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: '#64748B' }}>Subtotal</span>
                <span style={{ color: '#0F172A', fontFamily: 'monospace' }}>{formatMoneyByCountry(invoice.subtotal ?? 0, countryCode)}</span>
              </div>

              {taxBreakdown.lines.map((tl) => (
                <div key={tl.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>{tl.name}</span>
                  <span style={{ color: '#64748B', fontFamily: 'monospace' }}>{formatMoneyByCountry(tl.amount, countryCode)}</span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: '#64748B' }}>Paid / Received</span>
                <span style={{ color: 'var(--pos)', fontFamily: 'monospace' }}>{formatMoneyByCountry(invoice.paid ?? 0, countryCode)}</span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderTop: '2px solid #0F6E56', marginTop: 8, paddingTop: 12,
                fontWeight: 800, fontSize: 16, color: '#0F6E56',
              }}>
                <span>Total Balance Due</span>
                <span style={{ fontFamily: 'monospace' }}>{formatMoneyByCountry(outstanding, countryCode)}</span>
              </div>
            </div>

            {/* Statutory Footer */}
            <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8' }}>
              <div>
                <p className="font-semibold text-[#64748B] mb-1">Statutory Compliance ({countryConfig.name})</p>
                <p>{countryConfig.taxSystemName} · Authorized Document</p>
                <p>Tax Reg No: {activeCompany?.taxId || activeCompany?.gstin || 'None'}</p>
              </div>
              <div className="text-right">
                <p>Thank you for your business!</p>
                <p className="mt-1">Billing queries: accounts@unifiedtree.com</p>
              </div>
            </div>
          </div>

          {/* Compliance Sidebar Panel */}
          {ewayOpen && (
            <aside className="w-full max-w-[760px] xl:max-w-[340px] bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-lg self-start overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">
                      {countryConfig.code === 'IN' ? 'Generate E-way Bill' : `${countryConfig.taxSystem} Statutory Compliance`}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">Jurisdiction: {countryConfig.name}</p>
                  </div>
                  {countryConfig.hasEWayBill ? (
                    <EwayChip status={invoice.ewayStatus} />
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pos-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--pos)]">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Document Ref', value: invoice.ref },
                    { label: countryConfig.taxIdLabel, value: activeCompany?.taxId || activeCompany?.gstin || 'Active' },
                    { label: 'Tax System', value: countryConfig.taxSystem },
                    { label: 'Currency', value: `${countryConfig.currency} (${countryConfig.currencySymbol})` },
                  ].map(item => (
                    <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">{item.label}</p>
                      <p className="mt-1 text-xs font-semibold text-[var(--text)] break-words">{item.value}</p>
                    </div>
                  ))}
                </div>

                {countryConfig.hasEWayBill ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => onEwayAction?.('generate', invoice)}
                      className="w-full flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left hover:bg-[var(--primary-tint)]"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-[var(--text)]">Generate</span>
                        <span className="text-[11px] text-[var(--muted)]">Create EWB for this invoice</span>
                      </span>
                      <ShieldCheck size={15} className="text-[var(--primary)]" />
                    </button>
                    <button
                      onClick={() => onEwayAction?.('download', invoice)}
                      disabled={invoice.ewayStatus === 'none' || invoice.ewayStatus === 'pending'}
                      className="w-full flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-[var(--text)]">Download</span>
                        <span className="text-[11px] text-[var(--muted)]">Download EWB PDF</span>
                      </span>
                      <FileDown size={15} className="text-[var(--primary)]" />
                    </button>
                    <button
                      onClick={() => onEwayAction?.('cancel', invoice)}
                      disabled={invoice.ewayStatus !== 'active'}
                      className="w-full flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left text-[var(--neg)] hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>
                        <span className="block text-sm font-semibold">Cancel EWB</span>
                        <span className="text-[11px] opacity-75">Void e-way bill number</span>
                      </span>
                      <Ban size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)] space-y-1.5">
                    <p className="font-semibold text-[var(--text)]">Jurisdiction Rules Applied:</p>
                    <p>• {countryConfig.taxSystemName} computed at source.</p>
                    <p>• Customer tax classification matched to destination region.</p>
                    <p>• Ready for export to local tax authorities.</p>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
