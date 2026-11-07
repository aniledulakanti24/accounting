import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Clock, Download, Eye, FileSignature,
  Plus, Printer, RefreshCw, Share2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import ShareSheet from '../../components/ui/ShareSheet'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getProforma, getQuotations } from '../../data/services/salesService'
import { exportCsv } from '../../lib/csvExport'
import { toast } from '../../lib/toast'
import SalesDocumentPreview from './SalesDocumentPreview'

const STATUS_CFG = {
  draft:    { bg: 'bg-gray-100',              text: 'text-gray-500',         label: 'Draft',    icon: FileSignature },
  sent:     { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]', label: 'Sent',     icon: Clock },
  accepted: { bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Accepted', icon: CheckCircle2 },
  rejected: { bg: 'bg-[var(--neg-tint)]',     text: 'text-[var(--neg)]',     label: 'Rejected', icon: RefreshCw },
  expired:  { bg: 'bg-gray-100',              text: 'text-gray-400',         label: 'Expired',  icon: Clock },
}

function StatusChip({ status }) {
  const c = STATUS_CFG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: status, icon: Clock }
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon size={10} />
      {c.label}
    </span>
  )
}

function nextStepFor(row, isProforma) {
  if (isProforma) {
    if (row.status === 'accepted') return { label: 'Ready for invoice', tone: 'text-[var(--pos)] bg-[var(--pos-tint)]' }
    if (row.status === 'expired') return { label: 'Refresh PI', tone: 'text-[var(--warn)] bg-[var(--warn-tint)]' }
    return { label: 'Follow up PI', tone: 'text-[var(--primary)] bg-[var(--primary-tint)]' }
  }
  if (row.status === 'accepted') return { label: 'Convert to invoice', tone: 'text-[var(--pos)] bg-[var(--pos-tint)]' }
  if (row.status === 'sent') return { label: 'Follow up', tone: 'text-[var(--primary)] bg-[var(--primary-tint)]' }
  if (row.status === 'draft') return { label: 'Send quotation', tone: 'text-gray-600 bg-gray-100' }
  if (row.status === 'expired') return { label: 'Revise quote', tone: 'text-[var(--warn)] bg-[var(--warn-tint)]' }
  return { label: 'Review terms', tone: 'text-[var(--neg)] bg-[var(--neg-tint)]' }
}

function IconAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-sm transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--primary)]"
    >
      <Icon size={14} />
    </button>
  )
}

function TextAction({ children, primary = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold shadow-sm transition-colors ${
        primary
          ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-600)]'
          : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]'
      }`}
    >
      {children}
    </button>
  )
}

export default function Quotations({ mode = 'quotation' }) {
  const navigate = useNavigate()
  const isProforma = mode === 'proforma'
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [shareDoc, setShareDoc] = useState(null)

  useEffect(() => {
    const loader = isProforma ? getProforma : getQuotations
    loader().then(d => { setRecords(d); setLoading(false) })
  }, [isProforma])

  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !search || r.customer.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    return matchSearch && matchStatus
  }), [records, search, statusFilter])

  const accepted = records.filter(r => r.status === 'accepted').length
  const pending = records.filter(r => r.status === 'sent').length
  const total = records.reduce((s, r) => s + r.amount, 0)

  function handleExport() {
    exportCsv(filtered, isProforma ? 'proforma-invoices' : 'quotations', ['ref', 'date', 'customer', 'validTill', 'items', 'amount', 'status'])
    toast.success(`Exported ${filtered.length} ${isProforma ? 'proforma invoices' : 'quotations'}`)
  }

  const columns = [
    {
      key: 'ref',
      label: isProforma ? 'PI #' : 'Quotation #',
      sortable: true,
      render: (val, row) => {
        const nextStep = nextStepFor(row, isProforma)
        return (
          <div className="flex items-center gap-2 min-w-[205px]">
            <span className="font-mono text-xs text-[var(--primary)]">{val}</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${nextStep.tone}`}>{nextStep.label}</span>
          </div>
        )
      },
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => {
        const display = String(val).replace(/-(\d{2})$/, '-\n$1')
        return <span className="block text-sm leading-5 whitespace-pre-line text-[var(--muted)] min-w-[74px]">{display}</span>
      },
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-semibold text-[var(--text)]">{val}</span>
          <p className="mt-1 text-[10px] text-[var(--faint)]">{row.items} line items</p>
        </div>
      ),
    },
    { key: 'items', label: 'Items', align: 'center', render: (val) => <span className="text-sm font-medium text-[var(--primary)]">{val}</span> },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="tabular text-base font-extrabold text-[var(--text)] whitespace-nowrap">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'validTill',
      label: 'Valid Till',
      sortable: true,
      render: (val, row) => {
        const expired = new Date(val) < new Date()
        return <span className={`text-sm ${expired && row.status !== 'accepted' ? 'text-[var(--neg)]' : 'text-[var(--muted)]'}`}>{val}</span>
      },
    },
    { key: 'status', label: 'Status', render: (val) => <StatusChip status={val} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex min-w-[245px] items-center justify-end gap-1.5">
          <IconAction icon={Eye} label="View" onClick={e => { e.stopPropagation(); setPreviewDoc(row) }} />
          <IconAction icon={Share2} label="Share" onClick={e => { e.stopPropagation(); setShareDoc(row) }} />
          {!isProforma && (
            <TextAction onClick={e => { e.stopPropagation(); toast.success(`${row.ref} converted to proforma invoice`) }}>
              PI
              <ArrowRight size={12} />
            </TextAction>
          )}
          <TextAction primary={row.status === 'accepted'} onClick={e => { e.stopPropagation(); toast.success(`${row.ref} converted to invoice draft`) }}>
            Invoice
            <ArrowRight size={12} />
          </TextAction>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={isProforma ? 'Proforma Invoices' : 'Quotations'}
        subtitle={isProforma ? 'Advance sales documents before tax invoice' : 'Estimate documents with preview, share, print, and conversion'}
        breadcrumb={['Sales', isProforma ? 'Proforma Invoices' : 'Quotations']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
            <Button variant="secondary" icon={Printer} size="sm" onClick={() => toast.info('Select a document to print')}>Print</Button>
            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={() => navigate(isProforma ? '/sales/proforma-invoices/new' : '/sales/quotations/new')}
            >
              {isProforma ? 'New Proforma' : 'New Quotation'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Value', value: formatCompact(total), color: 'var(--text)' },
          { label: 'Accepted', value: accepted, color: 'var(--pos)' },
          { label: 'Pending', value: pending, color: 'var(--primary)' },
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
        onRowClick={(row) => setPreviewDoc(row)}
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder={`Search ${isProforma ? 'proforma' : 'quotation'} or customer...`}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </Filters>
        }
      />

      <SalesDocumentPreview
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        type={isProforma ? 'proforma' : 'quotation'}
        onShare={() => { setShareDoc(previewDoc); setPreviewDoc(null) }}
      />

      <ShareSheet
        open={!!shareDoc}
        onClose={() => setShareDoc(null)}
        item={shareDoc ? { ...shareDoc, total: shareDoc.amount, dueDate: shareDoc.validTill } : null}
        onPreview={() => { setPreviewDoc(shareDoc); setShareDoc(null) }}
      />
    </div>
  )
}
