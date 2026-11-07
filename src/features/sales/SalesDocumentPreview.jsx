import { useEffect, useRef } from 'react'
import { Download, FileText, Printer, ReceiptText, Share2, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const TITLES = {
  quotation: 'QUOTATION',
  proforma: 'PROFORMA INVOICE',
  invoice: 'TAX INVOICE',
  challan: 'DELIVERY CHALLAN',
  receipt: 'RECEIPT',
}

export default function SalesDocumentPreview({
  open,
  onClose,
  document: salesDocument,
  type = 'quotation',
  onShare,
}) {
  const printRef = useRef(null)
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.document.addEventListener('keydown', handler)
    return () => window.document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open || !salesDocument) return null

  const title = TITLES[type] ?? TITLES.quotation
  const subtotal = salesDocument.subtotal ?? Math.round((salesDocument.amount ?? salesDocument.total ?? 0) / 1.18)
  const gst = salesDocument.gst ?? Math.round((salesDocument.amount ?? salesDocument.total ?? 0) - subtotal)
  const total = salesDocument.total ?? salesDocument.amount ?? subtotal + gst

  function printDocument() {
    const content = printRef.current?.innerHTML
    if (!content) return
    const win = window.open('', '_blank', 'width=850,height=1100')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} ${salesDocument.ref}</title><style>
      body { font-family: Arial, sans-serif; color: #0f172a; padding: 40px; }
      table { width: 100%; border-collapse: collapse; margin: 24px 0; }
      th { background: #f1f5f9; color: #64748b; text-transform: uppercase; font-size: 10px; padding: 10px; text-align: left; }
      td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; font-size: 13px; }
      th:last-child, td:last-child { text-align: right; }
      @media print { body { padding: 20px; } }
    </style></head><body>${content}</body></html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 300)
  }

  function convert(label) {
    toast.success(`${salesDocument.ref} converted to ${label}`)
  }

  return (
    <>
      <div className="fixed inset-0 z-[920] bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-4 sm:inset-8 lg:inset-14 z-[930] bg-[var(--bg)] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <p className="mr-auto text-sm font-bold text-[var(--text)]">
            {title} - <span className="text-[var(--primary)]">{salesDocument.ref}</span>
          </p>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => toast.success(`${salesDocument.ref} PDF downloaded`)}>Download PDF</Button>
          <Button variant="secondary" size="sm" icon={Printer} onClick={printDocument}>Print</Button>
          <Button variant="secondary" size="sm" icon={Share2} onClick={onShare}>Share</Button>
          {type === 'quotation' && <Button variant="secondary" size="sm" icon={ReceiptText} onClick={() => convert('Proforma Invoice')}>Convert to PI</Button>}
          {(type === 'quotation' || type === 'proforma') && <Button variant="primary" size="sm" icon={FileText} onClick={() => convert('Invoice')}>Convert to Invoice</Button>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--faint)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div ref={printRef} className="w-full max-w-[760px] bg-white rounded-xl shadow-lg p-10 border border-[#e2e8f0]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xl font-extrabold text-[#0f6e56]">{activeCompany?.name || 'UnifiedTree Entity'}</p>
                <p className="text-xs text-[#64748b] mt-1">{countryConfig.taxIdLabel}: {activeCompany?.taxId || activeCompany?.gstin || 'Tax-Registered'}</p>
                <p className="text-xs text-[#64748b]">{activeCompany?.branch || `${countryConfig.name} Head Office`}</p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black tracking-tight text-[#0f6e56]">{title}</h2>
                <p className="text-sm font-mono font-bold mt-1 text-[#0f172a]">{salesDocument.ref}</p>
                <p className="text-xs text-[#64748b] mt-1">Date: {salesDocument.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-y border-[#e2e8f0] py-5 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Bill To</p>
                <p className="font-bold text-[#0f172a]">{salesDocument.customer}</p>
                <p className="text-xs text-[#64748b] mt-0.5">accounts@customer.example</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">{type === 'quotation' ? 'Valid Till' : 'Reference Date'}</p>
                <p className="font-semibold text-[#0f172a]">{salesDocument.validTill ?? salesDocument.dueDate ?? salesDocument.date}</p>
                <p className="text-xs text-[#64748b] mt-1">Status: {salesDocument.status}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>{countryConfig.taxSystem}</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: salesDocument.items ?? 2 }, (_, index) => {
                  const lineAmount = Math.round(subtotal / (salesDocument.items ?? 1))
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{index === 0 ? 'Goods / services supplied' : 'Implementation and support'}</td>
                      <td>1</td>
                      <td>{formatCurrency(lineAmount)}</td>
                      <td>{countryConfig.defaultRate}%</td>
                      <td>{formatCurrency(lineAmount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="ml-auto w-72">
              <div className="flex justify-between py-1 text-sm text-[#64748b]"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between py-1 text-sm text-[#64748b]"><span>{countryConfig.taxSystem}</span><span>{formatCurrency(gst)}</span></div>
              <div className="flex justify-between mt-3 pt-3 border-t-2 border-[#0f6e56] text-lg font-extrabold text-[#0f6e56]"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>

            <div className="mt-10 pt-4 border-t border-[#e2e8f0] text-xs text-[#64748b]">
              <p className="font-semibold text-[#0f172a] mb-1">Terms</p>
              <p>Prices are inclusive of applicable {countryConfig.taxSystem} unless stated otherwise. This document can be converted into a proforma invoice or tax invoice from the action bar.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
