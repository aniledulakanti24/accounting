import { useState } from 'react'
import { Plus, Trash2, Play, Download, GripVertical, ChevronDown } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

const AVAILABLE_FIELDS = {
  Sales: ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total', 'Status'],
  Purchase: ['Invoice No', 'Date', 'Supplier', 'GSTIN', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total', 'Status'],
  'Trial Balance': ['Account Code', 'Account Name', 'Group', 'Debit', 'Credit', 'Net Balance'],
  'P&L': ['Category', 'Sub-Category', 'FY 24-25', 'FY 25-26', 'Variance', 'Variance %'],
  'Ledger': ['Date', 'Voucher Ref', 'Narration', 'Debit', 'Credit', 'Balance'],
}

const FILTER_OPS = ['equals', 'not equals', 'greater than', 'less than', 'contains', 'between']

const SAMPLE_PREVIEW = [
  { 'Invoice No':'SI-2526-0108', 'Date':'2025-12-18', 'Customer':'Infosys BPO Ltd', 'Total':'₹28,50,000', 'Status':'Paid' },
  { 'Invoice No':'SI-2526-0099', 'Date':'2025-12-10', 'Customer':'Tech Mahindra',   'Total':'₹19,20,000', 'Status':'Paid' },
  { 'Invoice No':'SI-2526-0094', 'Date':'2025-12-08', 'Customer':'Wipro Digital',   'Total':'₹15,40,000', 'Status':'Partial' },
]

export default function ReportBuilder() {
  const [dataSource, setDataSource] = useState('Sales')
  const [selectedFields, setSelected] = useState(['Invoice No', 'Date', 'Customer', 'Total', 'Status'])
  const [filters, setFilters]   = useState([{ field:'Status', op:'equals', value:'Paid' }])
  const [groupBy, setGroupBy]   = useState('')
  const [sortBy, setSortBy]     = useState('Date')
  const [sortDir, setSortDir]   = useState('desc')
  const [preview, setPreview]   = useState(false)
  const [reportName, setReportName] = useState('Custom Sales Report')

  const availFields = AVAILABLE_FIELDS[dataSource] || []

  const toggleField = (f) => {
    setSelected(prev => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f])
  }

  const addFilter = () => setFilters(prev => [...prev, { field: availFields[0] || '', op:'equals', value:'' }])
  const removeFilter = (i) => setFilters(prev => prev.filter((_,idx) => idx!==i))
  const updateFilter = (i, key, val) => setFilters(prev => prev.map((f,idx) => idx===i ? {...f,[key]:val} : f))

  return (
    <div>
      <PageHeader title="Report Builder" subtitle="Custom report designer" breadcrumb={['Reports & Analytics', 'Report Builder']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm">Save Template</Button>
            <Button variant="primary" icon={Play} size="sm" onClick={() => setPreview(true)}>Run Report</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Config panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Report name */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Report Name</p>
            <input value={reportName} onChange={e=>setReportName(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]" />
          </div>

          {/* Data source */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Data Source</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.keys(AVAILABLE_FIELDS).map(src => (
                <button key={src} onClick={() => { setDataSource(src); setSelected(AVAILABLE_FIELDS[src].slice(0,5)) }}
                  className={`px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] text-left transition-colors ${dataSource===src?'bg-[var(--primary)] text-white':'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}>
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* Field selector */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Fields</p>
            <div className="space-y-1">
              {availFields.map(f => (
                <label key={f} className="flex items-center gap-2.5 cursor-pointer py-0.5 group">
                  <input type="checkbox" checked={selectedFields.includes(f)} onChange={() => toggleField(f)}
                    className="accent-[var(--primary)]" />
                  <span className={`text-sm transition-colors ${selectedFields.includes(f)?'text-[var(--text)]':'text-[var(--muted)]'}`}>{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Sort</p>
            <div className="flex gap-2">
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                className="flex-1 h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
                {availFields.map(f => <option key={f}>{f}</option>)}
              </select>
              <select value={sortDir} onChange={e=>setSortDir(e.target.value)}
                className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
                <option value="asc">ASC</option>
                <option value="desc">DESC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters + preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Filters</p>
              <button onClick={addFilter} className="flex items-center gap-1 text-xs text-[var(--primary)] hover:opacity-80 font-medium">
                <Plus size={12} /> Add Filter
              </button>
            </div>
            <div className="space-y-2">
              {filters.map((f,i) => (
                <div key={i} className="flex items-center gap-2">
                  <select value={f.field} onChange={e=>updateFilter(i,'field',e.target.value)}
                    className="flex-1 h-8 px-2 text-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
                    {availFields.map(fld => <option key={fld}>{fld}</option>)}
                  </select>
                  <select value={f.op} onChange={e=>updateFilter(i,'op',e.target.value)}
                    className="w-32 h-8 px-2 text-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
                    {FILTER_OPS.map(op => <option key={op}>{op}</option>)}
                  </select>
                  <input value={f.value} onChange={e=>updateFilter(i,'value',e.target.value)} placeholder="value"
                    className="flex-1 h-8 px-2 text-xs rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]" />
                  <button onClick={() => removeFilter(i)} className="text-[var(--muted)] hover:text-[var(--neg)] transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {filters.length === 0 && <p className="text-xs text-[var(--faint)] py-2">No filters — showing all records.</p>}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {preview ? `Preview — ${reportName}` : 'Run report to see preview'}
              </p>
              {preview && <span className="text-[10px] text-[var(--muted)]">{SAMPLE_PREVIEW.length} rows (sample)</span>}
            </div>
            {!preview ? (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--faint)]">
                <Play size={28} className="mb-3 opacity-30" />
                <p className="text-sm">Click "Run Report" to generate preview</p>
                <p className="text-xs mt-1">Results appear here with selected fields and filters applied</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                    {selectedFields.map(f => (
                      <th key={f} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_PREVIEW.map((row,i) => (
                    <tr key={i} className={`border-b border-[var(--border)] ${i%2===1?'bg-[var(--surface-2)]':''}`}>
                      {selectedFields.map(f => (
                        <td key={f} className="px-4 py-2.5 text-sm text-[var(--text)]">{row[f] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
