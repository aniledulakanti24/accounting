import { useState } from 'react'
import { Hammer, SlidersHorizontal, AlertTriangle, Warehouse, ArrowRightLeft, ShoppingCart, PackageCheck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { api } from '../../data/api/client'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/currency'
import { ErrorBox, Chip } from '../tax/global/shared'
import { Card, Money, Table, Stat } from './ui'
import { inputCls } from './styles'

/** Stock valued at FIFO or weighted-average cost, batches with expiry, and assembly from bills of materials. */
export default function StockValuation() {
  const stock = useApi('/books/stock')
  const boms = useApi('/books/boms')
  const [build, setBuild] = useState(1)
  const [adj, setAdj] = useState({ itemId: '', qty: '', reason: 'Stock count' })
  const godowns = useApi('/books/godowns')
  const reorder = useApi('/books/reorder')
  const pos = useApi('/books/purchase-orders')
  const [move, setMove] = useState({ itemId: '', qty: '', from: 'Main Warehouse', to: 'Pune Branch' })
  const refresh = () => { stock.refetch(); boms.refetch(); godowns.refetch(); reorder.refetch(); pos.refetch() }
  async function act(promise, done) {
    try { const r = await promise; toast.success(done(r)); refresh() } catch (err) { toast.error(err.message) }
  }
  const d = stock.data

  return (
    <div className="space-y-4">
      <PageHeader title="Stock Valuation" subtitle="Quantities and values come from every bill, sale, return, build and adjustment" />
      {stock.error && <ErrorBox error={stock.error} onRetry={refresh} />}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Stock value" value={d ? formatCurrency(d.totalValue) : '—'} />
        <Stat label="Items tracked" value={d?.items.length ?? '—'} />
        <Stat label="Below reorder level" value={d?.lowStock ?? '—'} tone={d?.lowStock ? 'warn' : undefined} />
        <Stat label="Batches expiring ≤ 30 days" value={d?.expiringBatches ?? '—'} tone={d?.expiringBatches ? 'neg' : undefined} hint="Sold first under FIFO" />
      </div>

      <Card title="Valuation" subtitle="Each item uses its own costing method">
        <Table columns={[
          { key: 'sku', label: 'SKU', render: r => <span className="font-mono text-xs">{r.sku}</span> },
          { key: 'name', label: 'Item' },
          { key: 'costMethod', label: 'Costing', render: r => <Chip tone="muted" label={r.costMethod === 'WAVG' ? 'Weighted avg' : 'FIFO'} /> },
          { key: 'qty', label: 'On hand', align: 'right', render: r => <span className={`tabular ${r.low ? 'font-bold text-[var(--warn)]' : ''}`}>{r.qty} {r.unit}</span> },
          { key: 'avgCost', label: 'Unit cost', align: 'right', render: r => <Money value={r.avgCost} /> },
          { key: 'value', label: 'Value', align: 'right', render: r => <Money value={r.value} strong /> },
          { key: 'batches', label: 'Batches', render: r => r.batches.length ? (
            <span className="flex flex-wrap gap-1">{r.batches.map(b => (
              <span key={b.batch} className={`rounded px-1.5 py-0.5 text-[11px] ${b.daysToExpiry <= 30 ? 'bg-[var(--neg-tint)] text-[var(--neg)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
                {b.batch} · {b.qty} · {b.daysToExpiry <= 30 ? <><AlertTriangle size={10} className="inline" /> {b.daysToExpiry}d</> : b.expiry}
              </span>))}</span>
          ) : <span className="text-[var(--faint)]">—</span> },
        ]} rows={d?.items ?? []} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {(boms.data ?? []).map(bom => (
          <Card key={bom.id} title={`Assemble: ${bom.product}`} subtitle="Parts are consumed at cost; the finished item is valued at the total"
            action={<span className="flex items-center gap-2">
              <input id={`build-${bom.id}`} type="number" min="1" aria-label="How many to build" className={`${inputCls} !w-20`} value={build} onChange={e => setBuild(e.target.value)} />
              <Button size="sm" variant="primary" icon={Hammer} onClick={() => act(api.post(`/books/boms/${bom.id}/build`, { qty: Number(build) }), r => `Built ${r.made} at ${formatCurrency(r.unitCost)} each`)}>Build</Button>
            </span>}>
            <Table columns={[
              { key: 'name', label: 'Part' },
              { key: 'qty', label: 'Per unit', align: 'right' },
              { key: 'onHand', label: 'On hand', align: 'right' },
              { key: 'unitCost', label: 'Unit cost', align: 'right', render: r => <Money value={r.unitCost} /> },
            ]} rows={bom.components.map(c => ({ ...c, id: c.itemId }))} />
          </Card>
        ))}
        <Card title="Adjust after a stock count" subtitle="Posts the difference to Inventory Adjustments">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_100px_minmax(0,1.5fr)_auto]">
            <select id="adj-item" className={inputCls} value={adj.itemId} onChange={e => setAdj(a => ({ ...a, itemId: e.target.value }))}>
              <option value="">Item…</option>{(d?.items ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input id="adj-qty" type="number" placeholder="+/− qty" aria-label="Quantity change" className={inputCls} value={adj.qty} onChange={e => setAdj(a => ({ ...a, qty: e.target.value }))} />
            <input id="adj-reason" aria-label="Reason" className={inputCls} value={adj.reason} onChange={e => setAdj(a => ({ ...a, reason: e.target.value }))} />
            <Button size="sm" variant="secondary" icon={SlidersHorizontal} onClick={() => act(api.post('/books/stock/adjust', { ...adj, qty: Number(adj.qty) }), r => `Adjusted by ${r.delta} (${formatCurrency(r.value)})`)}>Post</Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Warehouses" subtitle="Moves keep their original cost, so stock value doesn't change">
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            {(godowns.data ?? []).map(g => (
              <div key={g.name} className="rounded-lg bg-[var(--surface-2)] p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)]"><Warehouse size={13} /> {g.name}</p>
                {g.items.length ? g.items.map(i => <p key={i.itemId} className="mt-1 flex justify-between text-xs"><span className="truncate text-[var(--muted)]">{i.name}</span><span className="tabular font-semibold">{i.qty}</span></p>)
                  : <p className="mt-1 text-xs text-[var(--faint)]">Empty</p>}
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_80px_minmax(0,1.4fr)_minmax(0,1.4fr)_auto]">
            <select id="mv-item" className={inputCls} value={move.itemId} onChange={e => setMove(m => ({ ...m, itemId: e.target.value }))}><option value="">Item…</option>{(d?.items ?? []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
            <input id="mv-qty" type="number" min="1" placeholder="Qty" aria-label="Quantity to move" className={inputCls} value={move.qty} onChange={e => setMove(m => ({ ...m, qty: e.target.value }))} />
            <select id="mv-from" aria-label="From warehouse" className={inputCls} value={move.from} onChange={e => setMove(m => ({ ...m, from: e.target.value }))}>{(godowns.data ?? []).map(g => <option key={g.name}>{g.name}</option>)}</select>
            <select id="mv-to" aria-label="To warehouse" className={inputCls} value={move.to} onChange={e => setMove(m => ({ ...m, to: e.target.value }))}>{(godowns.data ?? []).map(g => <option key={g.name}>{g.name}</option>)}</select>
            <Button size="sm" variant="secondary" icon={ArrowRightLeft} onClick={() => act(api.post('/books/stock/transfer', { ...move, qty: Number(move.qty) }), t => `Moved ${t.qty} to ${t.to}`)}>Move</Button>
          </div>
        </Card>

        <Card title="Reorder" subtitle="Items at or below their reorder level, ordered from the last supplier at the last price"
          action={<Button size="sm" variant="primary" icon={ShoppingCart} disabled={!(reorder.data ?? []).some(r => r.suggestQty > 0 && r.supplierId)} onClick={() => act(api.post('/books/purchase-orders', {}), r => `${r.created.length} purchase order(s) raised`)}>Raise purchase orders</Button>}>
          <Table columns={[
            { key: 'name', label: 'Item' }, { key: 'onHand', label: 'On hand', align: 'right' }, { key: 'reorderLevel', label: 'Reorder at', align: 'right' },
            { key: 'onOrder', label: 'On order', align: 'right' }, { key: 'suggestQty', label: 'Order', align: 'right', render: r => <strong>{r.suggestQty}</strong> },
            { key: 'supplier', label: 'From', render: r => r.supplier ?? <span className="text-[var(--faint)]">No supplier yet</span> },
          ]} rows={(reorder.data ?? []).map(r => ({ ...r, id: r.itemId }))} empty="Everything is above its reorder level" />
          {(pos.data ?? []).length > 0 && (
            <div className="mt-4 space-y-2">
              {(pos.data ?? []).map(po => (
                <div key={po.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <span className="font-mono text-xs">{po.id}</span><span className="flex-1">{po.partyName} · {po.lines.map(l => `${l.qty} × ${l.name}`).join(', ')}</span>
                  <Money value={po.total} />
                  {po.status === 'open'
                    ? <Button size="sm" variant="secondary" icon={PackageCheck} onClick={() => act(api.post(`/books/purchase-orders/${po.id}/receive`, {}), r => `Received — bill ${r.bill.id}${r.bill.status === 'pending_approval' ? ' waiting for approval' : ' posted'}`)}>Receive</Button>
                    : <Chip tone="pos" label={`Received · ${po.billId}`} />}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
