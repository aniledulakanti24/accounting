import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileMinus, PackageCheck, RefreshCcw, RotateCcw, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { getARInvoices, getSalesReturnById } from '../../data/services/receivablesService'

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--text)]" style={tone ? { color: tone } : undefined}>{value}</p>
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

export default function SalesReturnDetail() {
  const navigate = useNavigate()
  const { returnId } = useParams()
  const [record, setRecord] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSalesReturnById(returnId), getARInvoices()]).then(([row, invoices]) => {
      setRecord(row)
      setInvoice(row ? invoices.find(item => item.ref === row.invoice) ?? null : null)
      setLoading(false)
    })
  }, [returnId])

  if (!loading && !record) {
    return (
      <div>
        <PageHeader
          title="Sales Return"
          subtitle="No return was found for this link"
          breadcrumb={['Money In', 'Sales Returns', 'Detail']}
          action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/sales-returns')}>Back</Button>}
        />
        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[var(--text)]">Sales return not found</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={record ? `${record.ref} Return Workspace` : 'Sales Return Workspace'}
        subtitle={record ? `${record.customer} - ${record.nextAction}` : 'Loading return'}
        breadcrumb={['Money In', 'Sales Returns', 'Detail']}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate('/receivables/sales-returns')}>Back</Button>}
      />

      {record && (
        <>
          <section className="mb-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-center">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--primary-tint)] px-2.5 py-1 text-xs font-black text-[var(--primary)]">{record.status}</span>
                  <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">{record.goodsStatus}</span>
                  <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">{record.outcome}</span>
                </div>
                <p className="text-lg font-black text-[var(--text)]">{record.customer}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{record.reason} against {record.invoice}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label="Return Value" value={formatCurrency(record.amount)} tone="var(--neg)" />
                <Metric label="Items" value={record.items} />
                <Metric label="Goods" value={record.goodsStatus} />
                <Metric label="Outcome" value={record.outcome} />
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-5">
              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">Recommended Outcome</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Choose the next action for this return.</p>
                  </div>
                  <span className="rounded-full bg-[var(--primary-tint)] px-3 py-1 text-xs font-black text-[var(--primary)]">{record.nextAction}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Button variant="primary" icon={FileMinus} onClick={() => toast.success(`Credit note flow opened for ${record.ref}`)}>Credit Note</Button>
                  <Button variant="secondary" icon={RefreshCcw} onClick={() => toast.success(`Refund flow opened for ${record.ref}`)}>Refund</Button>
                  <Button variant="secondary" icon={RotateCcw} onClick={() => toast.success(`Replacement arranged for ${record.ref}`)}>Replace</Button>
                  <Button variant="secondary" icon={XCircle} onClick={() => toast.warn(`${record.ref} rejected`)}>Reject</Button>
                </div>
              </section>

              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <p className="mb-4 text-sm font-bold text-[var(--text)]">Returned Items</p>
                <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">{record.items} item(s) returned</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{record.reason}</p>
                    </div>
                    <Button variant="secondary" icon={PackageCheck} size="sm" onClick={() => toast.success('Inspection status updated')}>Update Inspection</Button>
                  </div>
                </div>
              </section>
            </main>

            <aside className="space-y-4">
              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="mb-3 text-sm font-bold text-[var(--text)]">Return Detail</p>
                <DetailRow label="Date" value={record.date} />
                <DetailRow label="Original invoice" value={record.invoice} />
                <DetailRow label="Approval" value={record.approval} />
                <DetailRow label="Goods status" value={record.goodsStatus} />
                <DetailRow label="Inventory impact" value={record.inventoryImpact} />
                <DetailRow label="Refund status" value={record.refundStatus} />
              </section>

              <section className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="mb-3 text-sm font-bold text-[var(--text)]">Original Invoice</p>
                {invoice ? (
                  <>
                    <DetailRow label="Invoice" value={invoice.ref} />
                    <DetailRow label="Total" value={formatCurrency(invoice.total)} />
                    <DetailRow label="Balance" value={formatCurrency(invoice.balance)} />
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted)]">Invoice reference linked by document number.</p>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
