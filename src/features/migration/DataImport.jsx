import { useState, useRef, useCallback } from 'react'
import {
  Upload, CheckCheck, AlertTriangle, ChevronRight, ChevronLeft,
  FileSpreadsheet, FileCheck, X, RefreshCw, ArrowRight,
  Loader2, Info, DatabaseZap,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'

/* ─────────────────────────── Source config ─────────────────────────── */
const SOURCES = [
  {
    id: 'tally',
    name: 'Tally Prime / ERP 9',
    logo: '🧾',
    description: 'Import ledgers, vouchers, stock items from Tally XML export',
    accepts: '.xml,.zip',
    format: 'Tally XML',
    popular: true,
    exportSteps: [
      'Open Tally → Gateway → Backup',
      'Choose XML as export format',
      'Select: Ledgers, Vouchers, Stock Items',
      'Export and upload the .xml or .zip file here',
    ],
  },
  {
    id: 'zoho',
    name: 'Zoho Books',
    logo: '📘',
    description: 'Import contacts, invoices, bills, expenses from Zoho CSV export',
    accepts: '.csv,.zip',
    format: 'CSV (UTF-8)',
    popular: true,
    exportSteps: [
      'Go to Zoho Books → Settings → Data Backup',
      'Request a backup — Zoho emails you a link',
      'Download the ZIP and upload it here',
    ],
  },
  {
    id: 'vyapar',
    name: 'Vyapar',
    logo: '📦',
    description: 'Import parties, invoices, payments, inventory from Vyapar Excel export',
    accepts: '.xlsx,.csv',
    format: 'Excel / CSV',
    popular: true,
    exportSteps: [
      'Open Vyapar → Reports → select report type',
      'Tap Export → choose Excel or CSV',
      'Upload each exported file separately',
    ],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    logo: '🔵',
    description: 'Import customers, vendors, chart of accounts, transactions via IIF/CSV',
    accepts: '.iif,.csv,.xlsx',
    format: 'IIF / CSV',
    popular: false,
    exportSteps: [
      'Go to QuickBooks → Accountant Tools → Export Data',
      'Select entity types to export',
      'Download IIF or CSV and upload here',
    ],
  },
  {
    id: 'busy',
    name: 'Busy Accounting',
    logo: '🏦',
    description: 'Import masters and vouchers from Busy XML or CSV export',
    accepts: '.xml,.csv',
    format: 'XML / CSV',
    popular: false,
    exportSteps: [
      'Open Busy → Utilities → Export Data',
      'Select XML or CSV format',
      'Choose Masters + Transactions and export',
    ],
  },
  {
    id: 'excel',
    name: 'Excel / CSV (Generic)',
    logo: '📊',
    description: 'Upload any structured CSV or Excel file and map columns manually',
    accepts: '.csv,.xlsx,.xls',
    format: 'Excel / CSV',
    popular: false,
    exportSteps: [
      'Prepare your data in Excel or CSV format',
      'One sheet / file per data type recommended',
      'Headers must be in the first row',
    ],
  },
]

/* ─────────────────────── Field mapping config ──────────────────────── */
const DATA_TYPES = [
  { id: 'parties',    label: 'Parties (Customers & Suppliers)' },
  { id: 'ledgers',    label: 'Chart of Accounts / Ledgers'     },
  { id: 'invoices',   label: 'Sales Invoices'                  },
  { id: 'bills',      label: 'Purchase Bills'                  },
  { id: 'payments',   label: 'Payments & Receipts'             },
  { id: 'inventory',  label: 'Inventory Items'                 },
  { id: 'journals',   label: 'Journal Entries'                 },
]

const UT_FIELDS = {
  parties:  ['Name', 'Type', 'Email', 'Phone', 'GSTIN', 'PAN', 'Address', 'City', 'State', 'Opening Balance'],
  ledgers:  ['Account Name', 'Group', 'Opening Balance', 'Nature'],
  invoices: ['Invoice #', 'Date', 'Customer', 'Amount', 'GST', 'Total', 'Due Date', 'Status'],
  bills:    ['Bill #', 'Date', 'Supplier', 'Amount', 'GST', 'Total', 'Due Date', 'Status'],
  payments: ['Ref #', 'Date', 'Party', 'Amount', 'Mode', 'Account', 'Type'],
  inventory:['Item Name', 'Unit', 'HSN Code', 'Rate', 'Opening Stock', 'Category'],
  journals: ['Date', 'Ref #', 'Ledger', 'Debit', 'Credit', 'Narration'],
}

/* ─────────────────────── Mock preview data ─────────────────────────── */
const MOCK_PREVIEW = {
  parties: [
    { Name: 'Infosys BPO Ltd', Type: 'Customer', Email: 'accounts@infosys.com', GSTIN: '29AABCI0048N1Z5', 'Opening Balance': '2,85,000' },
    { Name: 'Reliance Industries', Type: 'Supplier', Email: 'vendor@ril.com', GSTIN: '24AAACR5055K1ZE', 'Opening Balance': '0' },
    { Name: 'Wipro Digital', Type: 'Customer', Email: 'finance@wipro.com', GSTIN: '29AAACW0035C1ZM', 'Opening Balance': '1,54,000' },
  ],
  invoices: [
    { 'Invoice #': 'INV-001', Date: '01-Apr-2024', Customer: 'Infosys BPO Ltd', Amount: '2,40,000', GST: '43,200', Total: '2,83,200', Status: 'Unpaid' },
    { 'Invoice #': 'INV-002', Date: '05-Apr-2024', Customer: 'Tech Mahindra',   Amount: '1,80,000', GST: '32,400', Total: '2,12,400', Status: 'Paid'   },
  ],
}

/* ─────────────────────── Step indicator ─────────────────────────────── */
const STEPS = ['Choose Source', 'Upload File', 'Map Fields', 'Preview', 'Import']

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done    = i < current
        const active  = i === current
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                done   ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                : active ? 'bg-[var(--primary-tint)] border-[var(--primary)] text-[var(--primary)]'
                :          'bg-[var(--surface-2)] border-[var(--border)] text-[var(--faint)]'
              )}>
                {done ? <CheckCheck size={13} /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] font-semibold mt-1 whitespace-nowrap',
                active ? 'text-[var(--primary)]' : done ? 'text-[var(--muted)]' : 'text-[var(--faint)]'
              )}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 mb-4 transition-all',
                done ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────── Main component ─────────────────────────── */
export default function DataImport() {
  const [step,       setStep]       = useState(0)
  const [source,     setSource]     = useState(null)
  const [file,       setFile]       = useState(null)
  const [dragging,   setDragging]   = useState(false)
  const [dataType,   setDataType]   = useState('parties')
  const [fieldMap,   setFieldMap]   = useState({})   // utField → sourceCol
  const [importing,  setImporting]  = useState(false)
  const [done,       setDone]       = useState(false)
  const fileRef = useRef(null)
  const importJobs = useAppStore(s => s.importJobs)
  const addImportJob = useAppStore(s => s.addImportJob)
  const recordAudit = useAppStore(s => s.recordAudit)

  const selectedSource = SOURCES.find(s => s.id === source)

  /* ── File drop ── */
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (f) {
      setFile(f)
      setStep(2)
      recordAudit('migration', 'Import file validated', `${f.name} passed mock validation and is ready for field mapping.`, { module: 'Data Migration' })
    }
  }, [recordAudit])

  /* ── Field auto-map ── */
  function autoMap(type) {
    const fields = UT_FIELDS[type] ?? []
    const auto = {}
    fields.forEach(f => { auto[f] = f })   // identity map (demo)
    setFieldMap(auto)
    setDataType(type)
  }

  /* ── Simulate import ── */
  function startImport() {
    setImporting(true)
    setTimeout(() => {
      addImportJob({
        source: selectedSource?.name ?? 'Excel / CSV',
        fileName: file?.name ?? 'sample-import.xlsx',
        dataType,
        records: previewRows.length,
        status: 'completed',
        errors: 0,
      })
      recordAudit(
        'migration',
        'Import completed',
        `${previewRows.length} ${dataType} records imported from ${selectedSource?.name ?? 'Excel / CSV'} with 0 errors.`,
        { module: 'Data Migration' }
      )
      setImporting(false)
      setDone(true)
    }, 2200)
  }

  /* ── Reset ── */
  function resetAll() {
    setStep(0); setSource(null); setFile(null)
    setFieldMap({}); setImporting(false); setDone(false)
    setDataType('parties')
  }

  const previewRows = MOCK_PREVIEW[dataType] ?? MOCK_PREVIEW.parties
  const previewCols = Object.keys(previewRows[0] ?? {})

  return (
    <div>
      <PageHeader
        title="Import Data"
        subtitle="Bring your data from another accounting tool into UnifiedTree — no manual re-entry needed."
        breadcrumb={['Data Migration', 'Import Data']}
      />

      <Panel>
        {importJobs.length > 0 && (
          <div className="mb-6 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Recent Imports</p>
                <p className="text-xs text-[var(--faint)]">Switching confidence: imported jobs are kept locally for demo rollback/history.</p>
              </div>
              <span className="text-xs font-semibold text-[var(--primary)]">{importJobs.length} jobs</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {importJobs.slice(0, 3).map(job => (
                <div key={job.id} className="rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{job.source}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate">{job.fileName}</p>
                  <p className="text-[11px] text-[var(--pos)] mt-1">{job.records} records · {job.errors} errors</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <StepBar current={step} />

        {/* ══ STEP 0 — Choose source ══ */}
        {step === 0 && (
          <div>
            <p className="text-sm font-semibold text-[var(--text)] mb-1">Which software are you migrating from?</p>
            <p className="text-xs text-[var(--muted)] mb-5">We support direct import from these tools. Pick yours.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSource(s.id); setStep(1) }}
                  className={cn(
                    'relative text-left p-4 rounded-[var(--radius)] border-2 transition-all hover:shadow-md hover:-translate-y-px',
                    source === s.id
                      ? 'border-[var(--primary)] bg-[var(--primary-tint)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50'
                  )}
                >
                  {s.popular && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-tint)] px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
                      Popular
                    </span>
                  )}
                  <div className="text-2xl mb-2">{s.logo}</div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">{s.name}</p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed mb-2">{s.description}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--faint)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                    <FileSpreadsheet size={9} />
                    {s.format}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ STEP 1 — Upload file ══ */}
        {step === 1 && selectedSource && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How to export from source */}
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-3">
                How to export from {selectedSource.name}
              </p>
              <div className="space-y-2">
                {selectedSource.exportSteps.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-[var(--primary-tint)] border border-[var(--primary)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--primary)] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-[var(--muted)] leading-snug">{s}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 p-3 rounded-[var(--radius-sm)] bg-[var(--primary-tint)] border border-[var(--primary)]/20">
                <Info size={13} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--primary)] leading-relaxed">
                  Accepted formats: <strong>{selectedSource.accepts}</strong>. Max file size: 50MB.
                </p>
              </div>
            </div>

            {/* Upload zone */}
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-3">Upload your file</p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-[var(--radius)] p-10 text-center cursor-pointer transition-all',
                  dragging
                    ? 'border-[var(--primary)] bg-[var(--primary-tint)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/60 hover:bg-[var(--surface-2)]'
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={selectedSource.accepts}
                  className="hidden"
                  onChange={onDrop}
                />
                {file ? (
                  <div>
                    <FileCheck size={32} className="mx-auto mb-3 text-[var(--pos)]" />
                    <p className="text-sm font-semibold text-[var(--text)]">{file.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {(file.size / 1024).toFixed(1)} KB — ready to process
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--neg)] hover:underline"
                    >
                      <X size={11} /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto mb-3 text-[var(--faint)]" />
                    <p className="text-sm font-semibold text-[var(--text)] mb-1">
                      Drag & drop your file here
                    </p>
                    <p className="text-xs text-[var(--muted)]">or click to browse</p>
                    <p className="text-xs text-[var(--faint)] mt-3">{selectedSource.accepts}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="ghost" icon={ChevronLeft} size="sm" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  iconRight={ChevronRight}
                  size="sm"
                  disabled={!file}
                  onClick={() => { autoMap(dataType); setStep(2) }}
                  className="flex-1"
                >
                  Continue to Map Fields
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2 — Map fields ══ */}
        {step === 2 && (
          <div>
            <p className="text-sm font-semibold text-[var(--text)] mb-1">Map your data fields</p>
            <p className="text-xs text-[var(--muted)] mb-5">
              Tell us which of your columns match UnifiedTree's fields. We've auto-mapped the ones we recognise.
            </p>

            {/* Data type selector */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                What type of data is in this file?
              </p>
              <div className="flex flex-wrap gap-2">
                {DATA_TYPES.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => autoMap(dt.id)}
                    className={cn(
                      'text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                      dataType === dt.id
                        ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/40'
                    )}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field mapping table */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] overflow-hidden mb-5">
              <div className="grid grid-cols-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
                <div className="px-4 py-2.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  UnifiedTree Field
                </div>
                <div className="px-4 py-2.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border-l border-[var(--border)]">
                  Your Column (from file)
                </div>
              </div>
              {(UT_FIELDS[dataType] ?? []).map((field, i) => (
                <div
                  key={field}
                  className={cn(
                    'grid grid-cols-2 border-b border-[var(--border)] last:border-0',
                    i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'
                  )}
                >
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text)]">{field}</span>
                    {fieldMap[field] && (
                      <CheckCheck size={12} className="text-[var(--pos)]" />
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-l border-[var(--border)]">
                    <select
                      value={fieldMap[field] ?? ''}
                      onChange={(e) => setFieldMap(m => ({ ...m, [field]: e.target.value }))}
                      className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">— skip this field —</option>
                      {/* Mock source columns */}
                      {[field, `Source_${field}`, `col_${i + 1}`].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" icon={ChevronLeft} size="sm" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" iconRight={ChevronRight} size="sm" onClick={() => setStep(3)} className="flex-1">
                Preview Data
              </Button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 — Preview ══ */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Preview — first {previewRows.length} rows</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Check your data before importing. Errors show in red.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-[var(--pos)]">
                  <CheckCheck size={12} /> {previewRows.length} rows ready
                </span>
                <span className="flex items-center gap-1.5 text-[var(--warn)]">
                  <AlertTriangle size={12} /> 0 warnings
                </span>
              </div>
            </div>

            {/* Summary strip */}
            <div className="flex flex-wrap gap-3 mb-5">
              {[
                { label: 'Records to import', value: '3',   color: 'var(--pos)'     },
                { label: 'Fields mapped',     value: `${Object.values(fieldMap).filter(Boolean).length}/${(UT_FIELDS[dataType] ?? []).length}`, color: 'var(--primary)' },
                { label: 'Duplicates found',  value: '0',   color: 'var(--muted)'   },
                { label: 'Errors',            value: '0',   color: 'var(--neg)'     },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-xs text-[var(--muted)]">{s.label}:</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] mb-5">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-2)]">
                    <th className="px-3 py-2.5 text-left font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] w-8">
                      #
                    </th>
                    {previewCols.map(col => (
                      <th key={col} className="px-3 py-2.5 text-left font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-left font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] w-16">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                      <td className="px-3 py-2.5 text-[var(--faint)]">{i + 1}</td>
                      {previewCols.map(col => (
                        <td key={col} className="px-3 py-2.5 text-[var(--text)] whitespace-nowrap">
                          {row[col] ?? '—'}
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pos)] bg-[var(--pos-tint)] px-2 py-0.5 rounded-full">
                          <CheckCheck size={9} /> OK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" icon={ChevronLeft} size="sm" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" icon={DatabaseZap} size="sm" onClick={() => setStep(4)} className="flex-1">
                Start Import
              </Button>
            </div>
          </div>
        )}

        {/* ══ STEP 4 — Import ══ */}
        {step === 4 && (
          <div className="text-center py-8">
            {!done && !importing && (
              <div>
                <div className="w-16 h-16 rounded-full bg-[var(--primary-tint)] flex items-center justify-center mx-auto mb-4">
                  <DatabaseZap size={28} className="text-[var(--primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text)] mb-2">Ready to import!</h3>
                <p className="text-sm text-[var(--muted)] mb-2">
                  {previewRows.length} records will be imported from{' '}
                  <strong>{selectedSource?.name ?? 'your file'}</strong>.
                </p>
                <p className="text-xs text-[var(--faint)] mb-6">
                  Existing data is not affected. You can undo the import from Import History.
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="ghost" icon={ChevronLeft} size="sm" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button variant="primary" icon={ArrowRight} size="sm" onClick={startImport}>
                    Confirm &amp; Import
                  </Button>
                </div>
              </div>
            )}

            {importing && (
              <div>
                <Loader2 size={40} className="mx-auto mb-4 text-[var(--primary)] animate-spin" />
                <h3 className="text-base font-bold text-[var(--text)] mb-2">Importing your data…</h3>
                <p className="text-sm text-[var(--muted)]">Please wait, do not close this window.</p>
                <div className="mt-6 max-w-xs mx-auto h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all duration-[2000ms]"
                    style={{ width: '90%' }}
                  />
                </div>
              </div>
            )}

            {done && (
              <div>
                <div className="w-16 h-16 rounded-full bg-[var(--pos-tint)] flex items-center justify-center mx-auto mb-4">
                  <CheckCheck size={28} className="text-[var(--pos)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text)] mb-2">Import complete!</h3>
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {[
                    { label: 'Records imported', value: previewRows.length, color: 'var(--pos)' },
                    { label: 'Skipped',          value: 0,                  color: 'var(--muted)' },
                    { label: 'Errors',           value: 0,                  color: 'var(--neg)'  },
                  ].map(s => (
                    <div key={s.label} className="px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--muted)]">{s.label}</p>
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted)] mb-6">
                  Your data is now in UnifiedTree. Check the relevant sections to verify.
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="ghost"
                    icon={RefreshCw}
                    size="sm"
                    onClick={() => { resetAll(); toast.success('Ready for another import!') }}
                  >
                    Import More
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => toast.success('Import saved to history')}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}
