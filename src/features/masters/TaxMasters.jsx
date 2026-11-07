import { useState, useMemo } from 'react'
import { Plus, Percent, Globe2, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SUPPORTED_COUNTRIES, getCountryTaxConfig, COUNTRY_TAX_RATES } from '../../lib/countryTax'
import { useAppStore } from '../../store/useAppStore'

const TAX_TYPE_COLORS = {
  GST: { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]' },
  TDS: { bg: 'bg-[var(--warn-tint)]', text: 'text-[var(--warn)]' },
  TCS: { bg: 'bg-[var(--pos-tint)]', text: 'text-[var(--pos)]' },
  SalesTax: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  VAT: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  Withholding: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  HST: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
  GST_PST: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
}

const EMPTY_RATE = {
  taxType: '',
  code: '',
  name: '',
  rate: '',
  component: '',
  applicableOn: 'All Items',
}

export default function TaxMasters() {
  const { activeCompany, customTaxRates, setCompanyCountry, addTaxRate } = useAppStore()
  const activeCountryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(activeCountryCode)

  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [newRate, setNewRate] = useState(EMPTY_RATE)

  // Taxes for the active country from store or seed
  const taxes = useMemo(() => {
    return customTaxRates?.[activeCountryCode] || COUNTRY_TAX_RATES[activeCountryCode] || []
  }, [customTaxRates, activeCountryCode])

  // Unique tax types present for this country
  const availableTypes = useMemo(() => {
    const set = new Set(taxes.map(t => t.taxType))
    return Array.from(set)
  }, [taxes])

  const filtered = useMemo(() => {
    return taxes.filter(t => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase())
      const matchType = selectedType === 'All' || t.taxType === selectedType
      return matchSearch && matchType
    })
  }, [taxes, search, selectedType])

  // Summary per type
  const summary = useMemo(() => {
    return availableTypes.map(tt => ({
      type: tt,
      count: taxes.filter(t => t.taxType === tt).length,
    }))
  }, [availableTypes, taxes])

  const handleCreateTax = (e) => {
    e.preventDefault()
    if (!newRate.name || newRate.rate === '') return

    addTaxRate(activeCountryCode, {
      taxType: newRate.taxType || countryConfig.taxSystem,
      code: newRate.code || `${countryConfig.taxSystem}-${newRate.rate}`,
      name: newRate.name,
      rate: parseFloat(newRate.rate) || 0,
      component: newRate.component || 'Standard Rate',
      applicableOn: newRate.applicableOn || 'Goods & Services',
    })

    setModalOpen(false)
    setNewRate(EMPTY_RATE)
  }

  const columns = [
    {
      key: 'taxType',
      label: 'Tax Classification',
      sortable: true,
      render: (val) => {
        const c = TAX_TYPE_COLORS[val] ?? { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            {val}
          </span>
        )
      },
    },
    {
      key: 'code',
      label: 'Tax Code / Section',
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'name',
      label: 'Tax Rule Name',
      sortable: true,
      render: (val) => <span className="font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'rate',
      label: 'Rate',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="tabular font-bold text-[var(--text)]">
          {val}%
        </span>
      ),
    },
    {
      key: 'component',
      label: 'Statutory Breakdown',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'applicableOn',
      label: 'Applicable On',
      render: (val) => <span className="text-sm text-[var(--text)]">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Tax Masters"
        subtitle={`Configure ${countryConfig.name} statutory tax rates, withholding sections, and local jurisdiction rules`}
        breadcrumb={['Masters', 'Tax Masters']}
        action={
          <div className="flex items-center gap-2">
            <Button variant="primary" icon={Plus} size="sm" onClick={() => setModalOpen(true)}>
              New Tax Rate
            </Button>
          </div>
        }
      />

      {/* Country Tax Engine Banner */}
      <div className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{countryConfig.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text)]">
                  {countryConfig.name} — {countryConfig.taxSystemName}
                </h3>
                <span className="rounded-md bg-[var(--primary-tint)] px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
                  {countryConfig.taxSystem}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Tax Identifier: <strong>{countryConfig.taxIdLabel}</strong> ({activeCompany?.taxId || activeCompany?.gstin || 'Configured'}) · Currency: <strong>{countryConfig.currency} ({countryConfig.currencySymbol})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-xs font-semibold text-[var(--muted)] whitespace-nowrap">Switch Jurisdiction:</span>
            <select
              value={activeCountryCode}
              onChange={(e) => {
                setCompanyCountry(e.target.value)
                setSelectedType('All')
              }}
              className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-bold text-[var(--text)] outline-none focus:border-[var(--primary)]"
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.taxSystem})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Type Tiles */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {summary.map(s => {
            const c = TAX_TYPE_COLORS[s.type] ?? { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text)]' }
            const isSelected = selectedType === s.type
            return (
              <button
                key={s.type}
                onClick={() => setSelectedType(prev => prev === s.type ? 'All' : s.type)}
                className={`flex items-center justify-between p-3.5 rounded-[var(--radius-sm)] border transition-all duration-150 text-left
                  ${isSelected
                    ? `${c.bg} border-[var(--primary)] shadow-sm`
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
              >
                <div>
                  <p className={`text-sm font-bold ${isSelected ? c.text : 'text-[var(--text)]'}`}>{s.type}</p>
                  <p className="text-[11px] text-[var(--muted)]">Active Rules</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg}`}>
                  <span className={`text-sm font-bold tabular ${c.text}`}>{s.count}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder={`Search ${countryConfig.name} tax rates, sections, or codes…`}>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Classifications</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <Percent size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No tax rates defined for {countryConfig.name}</p>
            <p className="text-xs text-[var(--muted)] mt-1">Click "New Tax Rate" to add country-specific statutory rules.</p>
          </div>
        }
      />

      {/* Modal for creating country-specific tax rate */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add New ${countryConfig.name} Tax Rate`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handleCreateTax}>Save Tax Rate</Button>
          </>
        }
      >
        <form onSubmit={handleCreateTax} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Tax Classification</label>
              <select
                value={newRate.taxType || countryConfig.taxSystem}
                onChange={(e) => setNewRate(p => ({ ...p, taxType: e.target.value }))}
                className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              >
                <option value={countryConfig.taxSystem}>{countryConfig.taxSystem}</option>
                {countryConfig.hasWithholding && <option value="Withholding">{countryConfig.withholdingName}</option>}
                <option value="Special">Special Surcharge / Cess</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Code / Section</label>
              <input
                value={newRate.code}
                onChange={(e) => setNewRate(p => ({ ...p, code: e.target.value }))}
                placeholder={countryConfig.codeLabel}
                className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)]">Tax Rule Name</label>
            <input
              required
              value={newRate.name}
              onChange={(e) => setNewRate(p => ({ ...p, name: e.target.value }))}
              placeholder={`e.g. ${countryConfig.name} Standard ${countryConfig.taxSystem}`}
              className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newRate.rate}
                onChange={(e) => setNewRate(p => ({ ...p, rate: e.target.value }))}
                placeholder="e.g. 18, 5, or 7.25"
                className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--muted)]">Applicable On</label>
              <input
                value={newRate.applicableOn}
                onChange={(e) => setNewRate(p => ({ ...p, applicableOn: e.target.value }))}
                placeholder="Goods & Services"
                className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)]">Statutory Breakdown Note</label>
            <input
              value={newRate.component}
              onChange={(e) => setNewRate(p => ({ ...p, component: e.target.value }))}
              placeholder={countryConfig.code === 'IN' ? 'e.g. 9% CGST + 9% SGST' : countryConfig.code === 'US' ? 'e.g. State 6% + Local 1.25%' : 'Standard Statutory Rate'}
              className="mt-1 h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
