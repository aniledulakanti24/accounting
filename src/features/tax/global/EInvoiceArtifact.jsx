import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Copy } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { formatCurrency } from '../../../lib/currency'
import { toast } from '../../../lib/toast'

/** Shows the identifiers an e-invoicing network issued for an invoice, with its QR code. */
export default function EInvoiceArtifact({ doc, onClose }) {
  const artifact = doc?.artifact
  const [qr, setQr] = useState({ for: null, url: null })

  useEffect(() => {
    if (!artifact?.qrPayload) return undefined
    let cancelled = false
    QRCode.toDataURL(artifact.qrPayload, { margin: 1, width: 220, errorCorrectionLevel: 'M' })
      .then(url => { if (!cancelled) setQr({ for: artifact.qrPayload, url }) }, () => {})
    return () => { cancelled = true }
  }, [artifact?.qrPayload])

  if (!doc || !artifact) return null
  const copy = text => navigator.clipboard?.writeText(text).then(() => toast.success('Copied'))
  const fields = [
    ['Network', artifact.network],
    [artifact.idLabel, artifact.id],
    artifact.ackNo && ['Acknowledgement No', artifact.ackNo],
    artifact.protocol && ['Protocolo', artifact.protocol],
    artifact.participant && ['Peppol participant', artifact.participant],
    artifact.fileName && ['File name', artifact.fileName],
    artifact.hash && ['Invoice hash', artifact.hash],
    ['Issued', new Date(artifact.issuedAt).toLocaleString()],
  ].filter(Boolean)

  return (
    <Modal open onClose={onClose} title={`${doc.invoiceNo} · ${doc.customer}`} size="lg">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <dl className="space-y-2 text-sm min-w-0">
          {fields.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{k}</dt>
              <dd className="flex items-start gap-2">
                <code className="break-all text-xs text-[var(--text)]">{v}</code>
                {String(v).length > 20 && <button type="button" aria-label="Copy" onClick={() => copy(String(v))} className="border-0 bg-transparent text-[var(--muted)] cursor-pointer"><Copy size={12} /></button>}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Total</dt>
            <dd className="tabular text-[var(--text)]">{formatCurrency(doc.total)}</dd>
          </div>
        </dl>
        {artifact.qrPayload && (
          <div className="text-center">
            {qr.for === artifact.qrPayload && qr.url
              ? <img src={qr.url} alt={`${artifact.qrType} QR code`} width={180} height={180} className="rounded border border-[var(--border)] bg-white p-1" />
              : <div className="h-[180px] w-[180px] animate-pulse rounded bg-[var(--surface-2)]" />}
            <p className="mt-1 text-[11px] text-[var(--muted)]">{artifact.qrType}</p>
          </div>
        )}
      </div>
      {artifact.qrPayload && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[var(--muted)]">QR payload</summary>
          <code className="mt-1 block break-all rounded bg-[var(--surface-2)] p-2 text-[10px] text-[var(--text)]">{artifact.qrPayload}</code>
        </details>
      )}
      {artifact.xml && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[var(--muted)]">UBL invoice (Peppol BIS Billing 3.0)</summary>
          <pre className="mt-1 max-h-60 overflow-auto rounded bg-[var(--surface-2)] p-2 text-[10px] text-[var(--text)]">{artifact.xml}</pre>
          <div className="mt-1"><Button size="sm" variant="ghost" icon={Copy} onClick={() => copy(artifact.xml)}>Copy XML</Button></div>
        </details>
      )}
      <p className="mt-3 text-[11px] text-[var(--muted)]">Demo mode: identifiers are generated in the network's real format but not registered with the authority.</p>
    </Modal>
  )
}
