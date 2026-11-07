import { Landmark, PlugZap, ReceiptText, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Panel from '../ui/Panel'
import { INTEGRATION_CATALOG } from '../../data/services/integrationsService'
import { useAppStore } from '../../store/useAppStore'

const WORKFLOWS = [
  {
    category: 'Payment Gateways',
    title: 'Payment links on invoices',
    text: 'Connected gateways enable payment link hints and faster receipt matching.',
    href: '/sales/sales-invoices',
    icon: ReceiptText,
  },
  {
    category: 'Banking',
    title: 'Bank feed reconciliation',
    text: 'Connected banks unlock imported statement hints on reconciliation screens.',
    href: '/cashbank/bank-rules',
    icon: Landmark,
  },
  {
    category: 'E-commerce',
    title: 'Imported online orders',
    text: 'Connected stores can stage orders into sales invoices and inventory movements.',
    href: '/business-tools/online-orders',
    icon: ShoppingBag,
  },
]

function isConnected(catalogItem, stored) {
  return stored[catalogItem.id]?.status === 'connected' || (!stored[catalogItem.id] && catalogItem.seedStatus === 'connected')
}

export default function IntegrationWorkflowHints() {
  const navigate = useNavigate()
  const stored = useAppStore(s => s.integrations)

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-3">
        <PlugZap size={15} className="text-[var(--primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text)]">Connected Workflow Boosts</h3>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {WORKFLOWS.map((workflow) => {
          const providers = INTEGRATION_CATALOG.filter(i => i.category === workflow.category)
          const connected = providers.filter(i => isConnected(i, stored))
          const Icon = workflow.icon
          return (
            <button
              key={workflow.category}
              onClick={() => navigate(connected.length ? workflow.href : '/settings/integrations')}
              className="text-left rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-tint)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <Icon size={15} className={connected.length ? 'text-[var(--primary)]' : 'text-[var(--faint)]'} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">{workflow.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{workflow.text}</p>
                  <p className={`text-[11px] font-semibold mt-2 ${connected.length ? 'text-[var(--pos)]' : 'text-[var(--warn)]'}`}>
                    {connected.length ? `${connected.map(i => i.name).join(', ')} active` : 'Connect a provider'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
