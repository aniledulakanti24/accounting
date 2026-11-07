import { useState, useEffect, useMemo } from 'react'
import { Link2, FilePlus, Download, Send, Trash2, CheckCircle, Share2, MessageCircle, QrCode, ShieldCheck, FileText, Receipt, Eye, Truck } from 'lucide-react'
import PageHeader        from '../../components/layout/PageHeader'
import DataTable         from '../../components/ui/DataTable'
import Filters           from '../../components/ui/Filters'
import StatusBadge       from '../../components/ui/StatusBadge'
import Button            from '../../components/ui/Button'
import ShareSheet        from '../../components/ui/ShareSheet'
import InvoicePreview    from '../../components/ui/InvoicePreview'
import QuickInvoiceModal from '../../components/ui/QuickInvoiceModal'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getSalesInvoices } from '../../data/services/salesService'
import { exportCsv }     from '../../lib/csvExport'
import { toast }         from '../../lib/toast'
import { usePersistentFilters } from '../../hooks/usePersistentFilters'
import { useAppStore }   from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const RISK_CFG = {
  low:    { label: 'Low',    tone: 'text-[var(--pos)] bg-[var(--pos-tint)]' },
  medium: { label: 'Medium', tone: 'text-[var(--warn)] bg-[var(--warn-tint)]' },
  high:   { label: 'High',   tone: 'text-[var(--neg)] bg-[var(--neg-tint)]' },
}

const COMPLIANCE_CFG = {
  generated: { label: 'IRN done',   tone: 'text-[var(--pos)] bg-[var(--pos-tint)]' },
  pending:   { label: 'IRN due',    tone: 'text-[var(--warn)] bg-[var(--warn-tint)]' },
  cancelled: { label: 'IRN cancel', tone: 'text-gray-500 bg-gray-100' },
}

const EWAY_CFG = {
  active:  { label: 'EWB active',  tone: 'text-[var(--pos)] bg-[var(--pos-tint)]' },
  closed:  { label: 'EWB closed',  tone: 'text-gray-500 bg-gray-100' },
  expired: { label: 'EWB expired', tone: 'text-[var(--neg)] bg-[var(--neg-tint)]' },
  pending: { label: 'EWB due',     tone: 'text-[var(--warn)] bg-[var(--warn-tint)]' },
  none:    { label: 'No EWB',      tone: 'text-[var(--faint)] bg-[var(--surface-2)]' },
}

function MiniChip({ cfg }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cfg.tone}`}>
      {cfg.label}
    </span>
  )
}

export default function SalesInvoices() {
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [shareInv, setShareInv] = useState(null)
  const [previewInv, setPreviewInv] = useState(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  /* Persistent filters — survive navigation */
  const [filters, setFilters] = usePersistentFilters('sales-invoices', { search: '', status: 'All' })
  const { search, status: statusFilter } = filters

  useEffect(() => {
    getSalesInvoices().then(d => { setInvoices(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchSearch = !search || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.ref.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter
    return matchSearch && matchStatus
  }), [invoices, search, statusFilter])

  const setSearch      = (v) => setFilters({ search: v })
  const setStatusFilter = (v) => setFilters({ status: v })

  const totalBilled      = invoices.reduce((s, i) => s + i.total, 0)
  const totalCollected   = invoices.reduce((s, i) => s + i.paid, 0)
  const totalOutstanding = totalBilled - totalCollected
  const overdueCount     = invoices.filter(i => i.status === 'overdue').length
  const highRiskCount    = invoices.filter(i => i.risk === 'high').length

  function handleExport() {
    exportCsv(filtered, 'sales-invoices', ['ref', 'date', 'customer', 'sourceOrder', 'items', 'subtotal', 'gst', 'total', 'paid', 'dueDate', 'status', 'irnStatus', 'ewayStatus', 'risk', 'nextAction'])
    toast.success(`Exported ${filtered.length} invoices to CSV`)
  }

  function handlePaymentLink(inv) {
    toast.success(inv.paymentLink ? `Payment link copied for ${inv.ref}` : `Payment link generated for ${inv.ref}`)
  }

  function handleWhatsApp(inv) {
    toast.success(`WhatsApp reminder queued for ${inv.customer}`)
  }

  function handleCompliance(inv) {
    if (inv.irnStatus === 'pending') {
      toast.info(`IRN generation started for ${inv.ref}`)
    } else if (inv.ewayStatus === 'pending' || inv.ewayStatus === 'expired') {
      setPreviewInv(inv)
    } else {
      toast.success(`${inv.ref} compliance is up to date`)
    }
  }

  function handleInvoiceFlow(action, inv) {
    toast.success(`${action} for ${inv.ref}`)
  }

  function updateInvoice(ref, patch) {
    setInvoices(rows => rows.map(row => row.ref === ref ? { ...row, ...patch } : row))
    setPreviewInv(current => current?.ref === ref ? { ...current, ...patch } : current)
  }

  function handleEwayAction(action, inv) {
    if (action === 'generate') {
      const ewayNo = `EWB-${inv.ref.replace(/\D/g, '').slice(-8)}`
      updateInvoice(inv.ref, { ewayStatus: 'active', ewayNo })
      toast.success(`E-way bill generated for ${inv.ref}`)
      return
    }

    if (action === 'download') {
      toast.success(`E-way bill PDF downloaded for ${inv.ref}`)
      return
    }

    if (action === 'cancel') {
      updateInvoice(inv.ref, { ewayStatus: 'closed', ewayNo: inv.ewayNo ?? `EWB-${inv.ref.replace(/\D/g, '').slice(-8)}` })
      toast.info(`E-way bill cancelled for ${inv.ref}`)
    }
  }

  const columns = [
    {
      key: 'ref',
      label: 'Invoice #',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--primary)]">{val}</span>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--faint)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
              <Link2 size={9} /> Synced
            </span>
          </div>
          {row.sourceOrder && <p className="mt-0.5 text-[10px] text-[var(--faint)]">Order {row.sourceOrder}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-[var(--text)]">{val}</p>
          <p className="text-[10px] text-[var(--faint)]">Limit {formatCompact(row.creditLimit)}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      align: 'right',
      sortable: true,
      sum: true,
      render: (val, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold text-[var(--text)]">{formatCurrency(val)}</span>
        : <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'gst',
      label: countryConfig.taxSystem,
      align: 'right',
      sum: true,
      render: (val, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold text-[var(--text)]">{formatCurrency(val)}</span>
        : <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      sortable: true,
      sum: true,
      render: (val, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(val)}</span>
        : <span className="tabular text-sm font-semibold text-[var(--text)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'paid',
      label: 'Collected',
      align: 'right',
      sortable: true,
      sum: true,
      render: (val, row) => row?._isTotal
        ? <span className="tabular text-sm font-bold" style={{ color: 'var(--pos)' }}>{formatCurrency(val)}</span>
        : <span className={`tabular text-sm font-medium ${val > 0 ? 'text-[var(--pos)]' : 'text-[var(--faint)]'}`}>
            {val > 0 ? formatCurrency(val) : '—'}
          </span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (val, row) => (
        <span className={`text-sm ${row.status === 'overdue' ? 'text-[var(--neg)] font-medium' : 'text-[var(--muted)]'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'irnStatus',
      label: `${countryConfig.taxSystem} Flow`,
      render: (val, row) => (
        <div className="flex flex-col gap-1">
          <MiniChip cfg={COMPLIANCE_CFG[val] ?? COMPLIANCE_CFG.pending} />
          <button
            onClick={e => { e.stopPropagation(); setPreviewInv(row) }}
            className="text-left"
            title="Open e-way bill options"
          >
            <MiniChip cfg={EWAY_CFG[row.ewayStatus] ?? EWAY_CFG.none} />
          </button>
        </div>
      ),
    },
    {
      key: 'paymentLink',
      label: 'Payment',
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); handlePaymentLink(row) }}
            className={`p-1.5 rounded-lg transition-colors ${val ? 'text-[var(--primary)] hover:bg-[var(--primary-tint)]' : 'text-[var(--warn)] hover:bg-[var(--warn-tint)]'}`}
            title={val ? 'Copy payment link' : 'Generate payment link'}
          >
            <Link2 size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); handlePaymentLink(row) }}
            className={`p-1.5 rounded-lg transition-colors ${row.qrReady ? 'text-[var(--primary)] hover:bg-[var(--primary-tint)]' : 'text-[var(--faint)] hover:bg-[var(--surface-2)]'}`}
            title={row.qrReady ? 'Show payment QR' : 'Create payment QR'}
          >
            <QrCode size={13} />
          </button>
        </div>
      ),
    },
    {
      key: 'risk',
      label: 'Collection',
      render: (val, row) => (
        <div>
          <MiniChip cfg={RISK_CFG[val] ?? RISK_CFG.medium} />
          <p className="mt-1 text-[10px] text-[var(--faint)]">{row.avgDelay}d avg delay</p>
          <p className="text-[10px] text-[var(--faint)]">Last {row.lastReminder}</p>
        </div>
      ),
    },
    {
      key: 'viewed',
      label: 'WhatsApp',
      render: (val, row) => (
        <div className="space-y-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${val === 'Yes' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--warn-tint)] text-[var(--warn)]'}`}>
            <Eye size={10} />
            {val === 'Yes' ? 'Viewed' : 'Not viewed'}
          </span>
          <p className="text-[10px] text-[var(--faint)]">{row.paymentSignal}</p>
          <div className="flex gap-1">
            <button
              onClick={e => { e.stopPropagation(); handleWhatsApp(row) }}
              className="rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              Send
            </button>
            <button
              onClick={e => { e.stopPropagation(); toast.info(`Reminder queued for ${row.customer}`) }}
              className="rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              Remind
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'nextAction',
      label: 'Next',
      render: (val, row) => (
        <div className="space-y-2">
          <button
            onClick={e => {
              e.stopPropagation()
              if (val.toLowerCase().includes('irn')) handleCompliance(row)
              else if (val.toLowerCase().includes('archive')) toast.info(`${row.ref} moved to archive queue`)
              else handleWhatsApp(row)
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--surface-2)] hover:bg-[var(--primary-tint)] text-xs font-semibold text-[var(--text)] hover:text-[var(--primary)] transition-colors whitespace-nowrap"
          >
            {val.toLowerCase().includes('irn') ? <ShieldCheck size={12} /> : <MessageCircle size={12} />}
            {val}
          </button>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={e => { e.stopPropagation(); handleInvoiceFlow('E-invoice opened', row) }}
              className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <FileText size={10} /> E-Inv
            </button>
            <button
              onClick={e => { e.stopPropagation(); setPreviewInv(row) }}
              className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <ShieldCheck size={10} /> EWB
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleInvoiceFlow('Delivery challan created', row) }}
              className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <Truck size={10} /> DC
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleInvoiceFlow('Receipt created', row) }}
              className="inline-flex items-center gap-1 rounded bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <Receipt size={10} /> Receipt
            </button>
          </div>
        </div>
      ),
    },
    {
      key: '_share',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); handleCompliance(row) }}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--muted)]"
            title="Open GST compliance"
          >
            <ShieldCheck size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setShareInv(row) }}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--primary)' }}
            title="Share invoice"
          >
            <Share2 size={13} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        subtitle={`Quote-to-cash invoices with payment links, ${countryConfig.taxSystem} compliance, and collection risk`}
        breadcrumb={['Sales Operations', 'Sales Invoices']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="primary" icon={FilePlus} size="sm" onClick={() => setInvoiceOpen(true)}>Create Invoice</Button>
          </div>
        }
      />

      {/* Sync notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--primary-tint)] border border-[var(--primary)]/20 text-xs text-[var(--primary)] mb-5">
        <Link2 size={13} />
        <span>Invoices now carry order references, IRN/e-way bill status, payment links, QR readiness, and next collection action.</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total Billed',      value: formatCompact(totalBilled),       color: 'var(--text)'    },
          { label: 'Collected',         value: formatCompact(totalCollected),     color: 'var(--pos)'     },
          { label: 'Outstanding',       value: formatCompact(totalOutstanding),   color: 'var(--primary)' },
          { label: 'Overdue',           value: `${overdueCount} invoices`,        color: 'var(--neg)'     },
          { label: 'High Risk',         value: `${highRiskCount} customers`,      color: 'var(--warn)'    },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        onRowClick={(row) => setPreviewInv(row)}
        showTotals
        selectable
        bulkActions={[
          {
            label: 'Export Selected',
            icon: Download,
            onClick: (rows) => {
              exportCsv(rows, 'invoices-selected', ['ref','date','customer','total','status'])
              toast.success(`Exported ${rows.length} invoices`)
            },
          },
          {
            label: 'WhatsApp',
            icon: MessageCircle,
            onClick: (rows) => toast.info(`WhatsApp sent for ${rows.length} invoices`),
          },
          {
            label: 'E-Invoice',
            icon: FileText,
            onClick: (rows) => toast.success(`E-invoice queue opened for ${rows.length} invoices`),
          },
          {
            label: 'Generate EWB',
            icon: ShieldCheck,
            onClick: (rows) => {
              setInvoices(list => list.map(inv =>
                rows.some(row => row.ref === inv.ref)
                  ? { ...inv, ewayStatus: 'active', ewayNo: inv.ewayNo ?? `EWB-${inv.ref.replace(/\D/g, '').slice(-8)}` }
                  : inv
              ))
              toast.success(`Generated e-way bills for ${rows.length} invoices`)
            },
          },
          {
            label: 'Send Reminder',
            icon: Send,
            onClick: (rows) => toast.info(`Reminder sent for ${rows.length} invoices`),
          },
          {
            label: 'Mark Paid',
            icon: CheckCircle,
            onClick: (rows) => toast.success(`Marked ${rows.length} invoices as paid`),
          },
          {
            label: 'Delete',
            icon: Trash2,
            variant: 'danger',
            onClick: (rows) => toast.error(`Deleted ${rows.length} invoices`),
          },
        ]}
        rowClassName={(row) =>
          row.status === 'overdue' ? 'bg-[var(--neg-tint)]/40' : ''
        }
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search invoice or customer…">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </Filters>
        }
      />

      {/* Share Sheet */}
      <ShareSheet
        open={!!shareInv}
        onClose={() => setShareInv(null)}
        item={shareInv}
        onPreview={() => { setPreviewInv(shareInv); setShareInv(null) }}
      />

      {/* Invoice Preview / Print */}
      <InvoicePreview
        open={!!previewInv}
        onClose={() => setPreviewInv(null)}
        invoice={previewInv}
        onShare={() => { setShareInv(previewInv); setPreviewInv(null) }}
        onEwayAction={handleEwayAction}
        onCreateChallan={(inv) => handleInvoiceFlow('Delivery challan created', inv)}
        onCreateReceipt={(inv) => handleInvoiceFlow('Receipt created', inv)}
      />

      <QuickInvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />

    </div>
  )
}
