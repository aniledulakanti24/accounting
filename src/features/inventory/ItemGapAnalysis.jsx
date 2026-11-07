import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'

const GAP_ROWS = [
  { area:'Item master depth', unifiedTree:'SKU, HSN, GST, group, UOM, vendor started', tally:'Stock item, group/category, UOM, taxability, standard rates', zoho:'SKU, image, vendor, taxes, description', vyapar:'Simple product catalog with barcode', gap:'Add images, custom fields, aliases and multi-UOM conversion', priority:'High' },
  { area:'Batch and serial', unifiedTree:'Items tab includes batch and serial register', tally:'Batch-wise inventory with manufacturing/expiry', zoho:'Serial and batch tracking', vyapar:'Batch and expiry tracking', gap:'Connect batch selection to sales/purchase lines', priority:'High' },
  { area:'Warehouse/godown', unifiedTree:'Warehouses and movement tab', tally:'Hierarchical godowns and godown-wise reports', zoho:'Warehouses and committed stock', vyapar:'Multi-warehouse stock tracking', gap:'Add item-wise warehouse allocation and transfer workflow', priority:'High' },
  { area:'Reorder control', unifiedTree:'Low stock and reorder alerts', tally:'Reorder level and minimum order quantity', zoho:'Inventory reports and purchase planning', vyapar:'Low-stock alerts and PO generation', gap:'Turn alerts into purchase order drafts', priority:'High' },
  { area:'Barcode billing', unifiedTree:'Barcode label page added', tally:'Available through item/barcode workflows', zoho:'SKU/barcode friendly inventory', vyapar:'Strong barcode billing', gap:'Add barcode scan input on POS and invoices', priority:'Medium' },
  { area:'Price lists', unifiedTree:'Pricing tab exists', tally:'Standard rates and price levels', zoho:'Price lists', vyapar:'Item price management', gap:'Add customer/vendor-specific price lists', priority:'Medium' },
  { area:'Reports', unifiedTree:'Movement and basic value', tally:'Stock summary, movement, aging, reorder, profitability', zoho:'Valuation, FIFO cost lots, aging summary', vyapar:'Item-wise reports and exports', gap:'Add stock aging, valuation, item profitability reports', priority:'High' },
  { area:'Import/export', unifiedTree:'Item import tool added', tally:'Source system export/import', zoho:'Import ecosystem', vyapar:'Import/export for SMBs', gap:'Add rejected-row correction and duplicate merge workflow', priority:'Medium' },
]

function StatusIcon({ value }) {
  if (['Good', 'Excellent', 'High'].includes(value)) return <CheckCircle2 size={13} className="text-[var(--pos)]" />
  if (['Missing', 'Major gap'].includes(value)) return <AlertTriangle size={13} className="text-[var(--neg)]" />
  return <MinusCircle size={13} className="text-[var(--warn)]" />
}

export default function ItemGapAnalysis() {
  return (
    <div>
      <PageHeader
        title="Items Gap Analysis"
        subtitle="Items and inventory comparison against TallyPrime, Zoho Books/Inventory, and Vyapar"
        breadcrumb={['Items & Inventory', 'Gap Analysis']}
      />

      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-2)]">
              {['Area', 'UnifiedTree Today', 'TallyPrime', 'Zoho', 'Vyapar', 'Gap / Improvement', 'Priority'].map(label => (
                <th key={label} className="border-b border-[var(--border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GAP_ROWS.map(row => (
              <tr key={row.area} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.area}</td>
                <td className="px-4 py-3 text-[var(--text)]">{row.unifiedTree}</td>
                <td className="px-4 py-3 text-[var(--text)]">{row.tally}</td>
                <td className="px-4 py-3 text-[var(--text)]">{row.zoho}</td>
                <td className="px-4 py-3 text-[var(--text)]">{row.vyapar}</td>
                <td className="px-4 py-3 text-[var(--text)]">{row.gap}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--warn)]">
                    <StatusIcon value={row.priority} />
                    {row.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
