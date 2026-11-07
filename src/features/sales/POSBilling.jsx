import { useState, useEffect, useMemo } from 'react'
import { Monitor, Download, RefreshCw, Banknote, CreditCard, Smartphone, FileX, Barcode, PauseCircle, Plus, WalletCards, RotateCcw, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Filters from '../../components/ui/Filters'
import Button from '../../components/ui/Button'
import { formatCurrency, formatCompact } from '../../lib/currency'
import { getPOSBills } from '../../data/services/salesService'
import { toast } from '../../lib/toast'

const MODE_CFG = {
  Cash: { icon: Banknote,    bg: 'bg-green-50',  text: 'text-green-700'  },
  Card: { icon: CreditCard,  bg: 'bg-blue-50',   text: 'text-blue-700'   },
  UPI:  { icon: Smartphone,  bg: 'bg-purple-50', text: 'text-purple-700' },
}

function ModeChip({ mode }) {
  const c = MODE_CFG[mode] ?? { icon: Banknote, bg: 'bg-gray-100', text: 'text-gray-500' }
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon size={10} />
      {mode}
    </span>
  )
}

export default function POSBilling() {
  const [bills, setBills]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modeFilter, setModeFilter] = useState('All')
  const [barcode, setBarcode] = useState('')

  useEffect(() => {
    getPOSBills().then(d => { setBills(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => bills.filter(b => {
    const matchSearch = !search
      || b.customer.toLowerCase().includes(search.toLowerCase())
      || b.ref.toLowerCase().includes(search.toLowerCase())
      || b.counter.toLowerCase().includes(search.toLowerCase())
    const matchMode = modeFilter === 'All' || b.mode === modeFilter
    return matchSearch && matchMode
  }), [bills, search, modeFilter])

  const paidBills  = bills.filter(b => b.status === 'paid')
  const totalSales = paidBills.reduce((s, b) => s + b.total, 0)
  const cashTotal  = paidBills.filter(b => b.mode === 'Cash').reduce((s, b) => s + b.total, 0)
  const cardTotal  = paidBills.filter(b => b.mode === 'Card').reduce((s, b) => s + b.total, 0)
  const upiTotal   = paidBills.filter(b => b.mode === 'UPI').reduce((s, b) => s + b.total, 0)
  const voidCount  = bills.filter(b => b.status === 'void').length
  const returnCount = bills.filter(b => b.status === 'return').length
  const stockAlerts = bills.filter(b => b.stockAlert).length
  const openSettlement = paidBills.filter(b => b.settlement === 'open').reduce((s, b) => s + b.total, 0)

  const columns = [
    {
      key: 'ref',
      label: 'Bill #',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--primary)]">{val}</span>
          {row.status === 'void' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--neg-tint)] text-[var(--neg)]">
              <FileX size={9} /> VOID
            </span>
          )}
          {row.status === 'return' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--warn-tint)] text-[var(--warn)]">
              <RotateCcw size={9} /> RETURN
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'counter',
      label: 'Counter',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (val) => (
        <span className={`text-sm font-medium ${val === 'Walk-in' ? 'text-[var(--faint)] italic' : 'text-[var(--text)]'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      align: 'center',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (val) => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'tax',
      label: 'Tax',
      align: 'right',
      render: (val) => <span className="tabular text-sm text-[var(--muted)]">{formatCurrency(val)}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className={`tabular text-sm font-semibold ${row.status === 'void' ? 'line-through text-[var(--faint)]' : row.status === 'return' ? 'text-[var(--neg)]' : 'text-[var(--text)]'}`}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'mode',
      label: 'Mode',
      render: (val, row) => row.status === 'void'
        ? <span className="text-xs text-[var(--faint)] italic">—</span>
        : <ModeChip mode={val} />,
    },
    {
      key: 'stockAlert',
      label: 'Inventory',
      render: (val) => val
        ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--warn-tint)] text-[var(--warn)]">
            <AlertTriangle size={10} />
            {val}
          </span>
        )
        : <span className="text-xs text-[var(--faint)]">OK</span>,
    },
    {
      key: 'settlement',
      label: 'Settlement',
      render: (val, row) => (
        <button
          onClick={() => toast.info(`${row.counter} settlement: ${val}`)}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${val === 'settled' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : val === 'open' ? 'bg-[var(--primary-tint)] text-[var(--primary)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}
        >
          {val}
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="POS Billing"
        subtitle="Today's counter sales"
        breadcrumb={['Sales Operations', 'POS Billing']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} size="sm" onClick={() => toast.success('POS export started')}>Export</Button>
            <Button variant="secondary" icon={RefreshCw} size="sm" onClick={() => toast.info('Counter feed refreshed')}>Refresh</Button>
            <Button variant="primary" icon={Plus} size="sm" onClick={() => toast.success('New POS bill opened')}>New Bill</Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-[1fr_auto] gap-3 mb-5">
        <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 shadow-sm">
          <Barcode size={16} className="text-[var(--muted)]" />
          <input
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="Scan barcode or enter SKU"
            className="h-8 flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none"
          />
          <Button variant="secondary" size="sm" onClick={() => setBarcode('')}>Clear</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={PauseCircle} size="sm" onClick={() => toast.info('Current bill held')}>Hold Bill</Button>
          <Button variant="secondary" icon={RotateCcw} size="sm" onClick={() => toast.info('Return bill flow opened')}>Return Bill</Button>
          <Button variant="secondary" icon={WalletCards} size="sm" onClick={() => toast.success('Counter-wise settlement opened')}>Close Shift</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Total Sales',  value: formatCompact(totalSales), color: 'var(--text)'    },
          { label: 'Cash',         value: formatCompact(cashTotal),  color: 'var(--pos)'     },
          { label: 'Card + UPI',   value: formatCompact(cardTotal + upiTotal), color: 'var(--primary)' },
          { label: 'Void Bills',   value: voidCount,                 color: 'var(--neg)'     },
          { label: 'Returns',      value: returnCount,               color: 'var(--warn)'    },
          { label: 'Open Settle',   value: formatCompact(openSettlement), color: 'var(--primary)' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {stockAlerts > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--warn)]/20 bg-[var(--warn-tint)] px-4 py-2.5 text-xs font-medium text-[var(--warn)]">
          <AlertTriangle size={14} />
          {stockAlerts} POS bills triggered inventory alerts. Review low-stock items before the next shift.
        </div>
      )}

      {/* Mode breakdown bar */}
      {totalSales > 0 && (
        <div className="mb-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Payment Breakdown</p>
          <div className="flex rounded-full overflow-hidden h-3 gap-px">
            {cashTotal > 0 && (
              <div className="bg-green-500" style={{ width: `${(cashTotal / totalSales) * 100}%` }} title={`Cash: ${formatCurrency(cashTotal)}`} />
            )}
            {cardTotal > 0 && (
              <div className="bg-blue-500" style={{ width: `${(cardTotal / totalSales) * 100}%` }} title={`Card: ${formatCurrency(cardTotal)}`} />
            )}
            {upiTotal > 0 && (
              <div className="bg-purple-500" style={{ width: `${(upiTotal / totalSales) * 100}%` }} title={`UPI: ${formatCurrency(upiTotal)}`} />
            )}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { label: 'Cash', value: cashTotal,  color: 'bg-green-500'  },
              { label: 'Card', value: cardTotal,  color: 'bg-blue-500'   },
              { label: 'UPI',  value: upiTotal,   color: 'bg-purple-500' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${m.color}`} />
                <span className="text-xs text-[var(--muted)]">{m.label}</span>
                <span className="tabular text-xs font-semibold text-[var(--text)]">{formatCompact(m.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="id"
        toolbar={
          <Filters search={search} onSearchChange={setSearch} placeholder="Search bill, customer, counter…">
            <select
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </Filters>
        }
        emptyState={
          <div className="flex flex-col items-center py-14 text-center">
            <Monitor size={28} className="text-[var(--faint)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text)]">No bills found</p>
          </div>
        }
      />
    </div>
  )
}
