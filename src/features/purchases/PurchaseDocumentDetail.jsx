import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Banknote, Boxes, CheckCircle2, ClipboardList, FileText,
  GitCompareArrows, IndianRupee, PackageCheck, ReceiptText, RotateCcw,
  ShieldCheck, Truck, WalletCards,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import {
  getDebitNotes,
  getGoodsReceipts,
  getPaymentOut,
  getPurchaseInvoices,
  getPurchaseOrders,
  getPurchaseReturns,
} from '../../data/services/purchaseService'
import { toast } from '../../lib/toast'

const CONFIG = {
  orders: {
    title: 'Purchase Order',
    back: '/procurement/purchase-orders',
    icon: ClipboardList,
    load: getPurchaseOrders,
    party: 'supplier',
    amount: 'amount',
  },
  grn: {
    title: 'Goods Receipt',
    back: '/procurement/goods-receipt',
    icon: PackageCheck,
    load: getGoodsReceipts,
    party: 'supplier',
    amount: 'landedCost',
  },
  invoices: {
    title: 'Purchase Invoice',
    back: '/procurement/purchase-invoices',
    icon: ReceiptText,
    load: getPurchaseInvoices,
    party: 'supplier',
    amount: 'total',
  },
  payments: {
    title: 'Payment Made',
    back: '/payables/payments',
    icon: WalletCards,
    load: getPaymentOut,
    party: 'supplier',
    amount: 'amount',
  },
  returns: {
    title: 'Return / Debit Note',
    back: '/procurement/returns-debit-notes',
    icon: RotateCcw,
    party: 'supplier',
    amount: 'amount',
  },
}

const STEP_ICONS = [ClipboardList, Truck, ReceiptText, ShieldCheck, WalletCards]

function Chip({ value, tone = 'neutral' }) {
  const tones = {
    good: 'bg-[var(--pos-tint)] text-[var(--pos)]',
    warn: 'bg-[var(--warn-tint)] text-[var(--warn)]',
    risk: 'bg-[var(--neg-tint)] text-[var(--neg)]',
    primary: 'bg-[var(--primary-tint)] text-[var(--primary)]',
    neutral: 'bg-[var(--surface-2)] text-[var(--muted)]',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${tones[tone]}`}>{value || '-'}</span>
}

function toneFor(value = '') {
  const text = String(value).toLowerCase()
  if (['paid', 'cleared', 'approved', 'accepted', 'matched', 'received', 'released', 'adjusted'].some(key => text.includes(key))) return 'good'
  if (['pending', 'partial', 'hold', 'review', 'mismatch', 'short'].some(key => text.includes(key))) return 'warn'
  if (['overdue', 'blocked', 'bounced', 'missing', 'rejected', 'cancelled', 'no po'].some(key => text.includes(key))) return 'risk'
  if (['open', 'unpaid'].some(key => text.includes(key))) return 'primary'
  return 'neutral'
}

function MiniBar({ label, value, total, color = 'var(--primary)' }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--muted)]">{label}</span>
        <span className="font-mono font-bold text-[var(--text)]">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, tone = 'var(--text)' }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={15} className="text-[var(--primary)]" />
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      </div>
      <p className="tabular text-lg font-black" style={{ color: tone }}>{value}</p>
    </div>
  )
}

function DetailField({ label, value }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value ?? '-'}</p>
    </div>
  )
}

async function loadReturnRows() {
  const [returns, debitNotes] = await Promise.all([getPurchaseReturns(), getDebitNotes()])
  return [
    ...returns.map(row => ({ ...row, docType: 'Return With Goods', goods: 'Yes', creditStatus: row.status === 'approved' ? 'Debit note ready' : 'Awaiting approval' })),
    ...debitNotes.map(row => ({ ...row, docType: 'Debit Note Only', goods: 'No', creditStatus: row.status === 'adjusted' ? 'Adjusted' : 'Open credit' })),
  ]
}

export default function PurchaseDocumentDetail({ kind }) {
  const navigate = useNavigate()
  const { docId } = useParams()
  const config = CONFIG[kind] ?? CONFIG.orders
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loader = kind === 'returns' ? loadReturnRows : config.load
    loader().then(rows => {
      setRecord(rows.find(row => row.id === docId || row.ref === docId) ?? null)
      setLoading(false)
    })
  }, [config.load, docId, kind])

  const progress = useMemo(() => {
    if (!record) return { value: 0, total: 1, label: 'Progress' }
    if (kind === 'orders') return { value: record.receivedQty ?? 0, total: record.orderedQty ?? 1, label: 'Received' }
    if (kind === 'invoices') return { value: record.paid ?? 0, total: record.total ?? 1, label: 'Paid' }
    if (kind === 'grn') return { value: (record.receivedQty ?? 0) - (record.rejectedQty ?? 0), total: record.receivedQty || 1, label: 'Accepted Qty' }
    return { value: record.amount ?? record.landedCost ?? 0, total: record.amount ?? record.landedCost ?? 1, label: 'Completed' }
  }, [kind, record])

  if (loading) {
    return <div className="py-16 text-center text-sm text-[var(--faint)]">Loading purchase document...</div>
  }

  if (!record) {
    return (
      <div>
        <PageHeader
          title="Document Not Found"
          subtitle="The selected purchase document is not available"
          breadcrumb={['Purchase Operations', config.title, docId]}
          action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate(config.back)}>Back</Button>}
        />
      </div>
    )
  }

  const Icon = config.icon
  const amount = record[config.amount] ?? record.total ?? record.amount ?? 0
  const status = record.status ?? record.approval ?? record.match

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${config.title} ${record.ref}`}
        subtitle={`${record[config.party] ?? 'Supplier'} - ${formatCurrency(amount)}`}
        breadcrumb={['Purchase Operations', config.title, record.ref]}
        action={<Button variant="secondary" icon={ArrowLeft} size="sm" onClick={() => navigate(config.back)}>Back</Button>}
      />

      <section className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="bg-[var(--text)] p-5 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-sm)] bg-white/10">
              <Icon size={24} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-white/50">{config.title}</p>
            <h1 className="mt-1 font-mono text-2xl font-black">{record.ref}</h1>
            <p className="mt-2 text-sm text-white/60">{record.date}</p>
            <div className="mt-5"><Chip value={status} tone={toneFor(status)} /></div>
          </div>

          <div className="p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric icon={IndianRupee} label="Value" value={formatCurrency(amount)} tone="var(--primary)" />
              <Metric icon={FileText} label="Supplier" value={record[config.party] ?? '-'} />
              <Metric icon={Boxes} label="Items" value={record.items ?? '-'} />
              <Metric icon={GitCompareArrows} label="Next Step" value={record.nextAction ?? record.creditStatus ?? 'Review'} tone="var(--warn)" />
            </div>

            <div className="mt-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <MiniBar label={progress.label} value={progress.value} total={progress.total} color="var(--primary)" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--primary)]" />
            <h2 className="text-sm font-bold text-[var(--text)]">Key Details</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <DetailField label="Supplier" value={record.supplier} />
            <DetailField label="PO" value={record.po ?? 'Not linked'} />
            <DetailField label="GRN" value={record.grn ?? (record.ref?.startsWith('GRN') ? record.ref : 'Not linked')} />
            <DetailField label="Invoice" value={record.invoice ?? record.bill ?? 'Not linked'} />
            <DetailField label="Due / Delivery" value={record.dueDate ?? record.deliveryDate ?? '-'} />
            <DetailField label="Warehouse" value={record.warehouse ?? '-'} />
            <DetailField label="Approval" value={record.approval ?? '-'} />
            <DetailField label="ITC / Match" value={record.itc ?? record.match ?? '-'} />
            <DetailField label="Reason" value={record.reason ?? record.stockAlert ?? '-'} />
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Flow Health</h2>
            </div>
            <div className="space-y-3">
              {['PO', 'GRN', 'Invoice', 'ITC', 'Payment'].map((step, index) => {
                const StepIcon = STEP_ICONS[index]
                const active = index === 0
                  || (step === 'GRN' && (record.grn || kind === 'grn'))
                  || (step === 'Invoice' && (record.invoice || record.bill || kind === 'invoices'))
                  || (step === 'ITC' && (record.itc || record.match))
                  || (step === 'Payment' && (record.paid > 0 || kind === 'payments'))
                return (
                  <div key={step} className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 ${active ? 'bg-[var(--primary-tint)] text-[var(--primary)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
                    <StepIcon size={15} />
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Banknote size={18} className="text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">Quick Actions</h2>
            </div>
            <div className="grid gap-2">
              <Button variant="secondary" icon={Truck} onClick={() => toast.info(`Receiving opened for ${record.ref}`)}>Record / Review GRN</Button>
              <Button variant="secondary" icon={ReceiptText} onClick={() => toast.info(`Bill matching opened for ${record.ref}`)}>Match Bill</Button>
              <Button variant="primary" icon={WalletCards} onClick={() => navigate('/procurement/payment-out/new')}>Make Payment</Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
