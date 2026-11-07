import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Download, RefreshCcw, Send, Share2, WalletCards } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getARInvoices, getCreditNoteById } from '../../data/services/receivablesService'

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 tabular text-xl font-black text-[var(--text)]" style={tone ? { color: tone } : undefined}>{value}</p>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-semibold text-[var(--text)]">{value}</span>
    </div>
  )
}

export default function CreditNoteDetail() {
  const navigate = useNavigate()
  const { creditNoteId } = useParams()
  const [note, setNote] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCreditNoteById(creditNoteId), getARInvoices()]).then(([creditNote, invoiceRows]) => {
      setNote(creditNote)
      setInvoices(invoiceRows)
      setLoading(false)
    })
  }, [creditNoteId])

  const customerInvoices = note ? invoices.filter(invoice => invoice.customer === note.customer && invoice.balance > 0) : []

  if (!loading && !note) {
    return (
      <div>
        <PageHeader
          title="Credit Note"
          subtitle="No credit note was found for this link"
          breadcrumb={['Money In', 'Credit Notes & Refunds', 'Detail']}
          action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/credit-notes')}>Back</Button>}
        />
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[var(--text)]">Credit note not found</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={note ? `${note.ref} Workspace` : 'Credit Note Workspace'}
        subtitle={note ? `${note.customer} - ${note.nextAction}` : 'Loading credit note'}
        breadcrumb={['Money In', 'Credit Notes & Refunds', 'Detail']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/credit-notes')}>Back</Button>}
      />

      {note && (
        <>
          <section className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-center">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--primary-tint)] px-2.5 py-1 text-xs font-black text-[var(--primary)]">{note.status}</span>
                  <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">{note.approval}</span>
                  <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">GST {note.gstStatus}</span>
                </div>
                <p className="text-lg font-black text-[var(--text)]">{note.customer}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{note.reason} against {note.invoice}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label="Credit" value={formatCurrency(note.amount)} />
                <Metric label="Available" value={formatCurrency(note.available)} tone="var(--primary)" />
                <Metric label="Applied" value={formatCurrency(note.applied)} tone="var(--pos)" />
                <Metric label="Refunded" value={formatCurrency(note.refunded)} tone="var(--neg)" />
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-5">
              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">Recommended Next Action</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Use the action that matches this credit note state.</p>
                  </div>
                  <span className="rounded-full bg-[var(--primary-tint)] px-3 py-1 text-xs font-black text-[var(--primary)]">{note.nextAction}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Button variant="primary" icon={WalletCards} onClick={() => toast.success(`Apply credit opened for ${note.ref}`)}>Apply to Invoice</Button>
                  <Button variant="secondary" icon={RefreshCcw} onClick={() => toast.success(`Refund flow opened for ${note.ref}`)}>Issue Refund</Button>
                  <Button variant="secondary" icon={CheckCircle2} onClick={() => toast.success(`${note.ref} marked adjusted`)}>Mark Adjusted</Button>
                </div>
              </section>

              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <p className="mb-4 text-sm font-bold text-[var(--text)]">Apply Credit</p>
                <div className="grid gap-3">
                  {customerInvoices.length ? customerInvoices.map(invoice => (
                    <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
                      <div>
                        <p className="font-mono text-xs font-bold text-[var(--primary)]">{invoice.ref}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">Outstanding {formatCurrency(invoice.balance)}</p>
                      </div>
                      <Button variant="secondary" size="sm" icon={WalletCards} onClick={() => toast.success(`${formatCurrency(Math.min(note.available, invoice.balance))} credit applied to ${invoice.ref}`)}>Apply</Button>
                    </div>
                  )) : (
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">No open invoices for this customer. Refund or keep credit open.</div>
                  )}
                </div>
              </section>
            </main>

            <aside className="space-y-4">
              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="mb-3 text-sm font-bold text-[var(--text)]">Credit Note Detail</p>
                <DetailRow label="Date" value={note.date} />
                <DetailRow label="Original invoice" value={note.invoice} />
                <DetailRow label="Settlement" value={note.settlement} />
                <DetailRow label="Tax reversal" value={formatCurrency(note.taxReversal)} />
                <DetailRow label="Available balance" value={formatCurrency(note.available)} />
              </section>

              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="mb-3 text-sm font-bold text-[var(--text)]">Document Actions</p>
                <div className="grid gap-2">
                  <Button variant="secondary" icon={Download} size="sm" onClick={() => toast.info(`PDF downloaded for ${note.ref}`)}>Download</Button>
                  <Button variant="secondary" icon={Share2} size="sm" onClick={() => toast.info(`Share sheet opened for ${note.ref}`)}>Share</Button>
                  <Button variant="primary" icon={Send} size="sm" onClick={() => toast.info(`Credit note sent to ${note.customer}`)}>Send to Customer</Button>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
