import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, BellRing, Building2, CheckCircle2, Download, Edit3,
  FileText, Mail, MessageCircle, Phone, Receipt, ShieldCheck,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast } from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'
import {
  findDuplicateParties,
  getPartyBillWise,
  getPartyDocuments,
  getPartyProfile,
  getPartyTimeline,
  validatePartyGstin,
} from '../../data/services/partiesService'

function Chip({ children, tone = 'bg-[var(--surface-2)] text-[var(--muted)]' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{children}</span>
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--text)]">{value || '-'}</p>
    </div>
  )
}

function action(label, party) {
  toast.success(`${label} for ${party.name}`)
}

export default function PartyDetailModal({ open, onClose, party }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [bills, setBills] = useState([])
  const [timeline, setTimeline] = useState([])
  const [documents, setDocuments] = useState([])
  const [duplicates, setDuplicates] = useState([])

  useEffect(() => {
    if (!open || !party) return
    let mounted = true
    Promise.all([
      getPartyProfile(party.id),
      getPartyBillWise(party.id),
      getPartyTimeline(party.id),
      getPartyDocuments(party.id),
      findDuplicateParties(party),
    ]).then(([profileData, billData, timelineData, documentData, duplicateData]) => {
      if (!mounted) return
      setProfile(profileData)
      setBills(billData)
      setTimeline(timelineData)
      setDocuments(documentData)
      setDuplicates(duplicateData)
    })
    return () => { mounted = false }
  }, [open, party])

  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  if (!party) return null

  const shown = profile ?? party
  const gst = validatePartyGstin(shown)
  const creditUsed = shown.creditLimit > 0 ? Math.min(100, Math.round((shown.outstanding / shown.creditLimit) * 100)) : 0
  const breach = shown.creditLimit > 0 && shown.outstanding > shown.creditLimit

  function openReminderQueue(channel = 'Email + SMS') {
    const params = new URLSearchParams({
      partyId: shown.id,
      party: shown.name,
      type: shown.type,
      amount: String(shown.overdue || shown.outstanding || 0),
      channel,
      source: 'party-detail',
    })
    onClose?.()
    navigate(`/parties/reminders?${params.toString()}`)
  }

  function openStatement() {
    const params = new URLSearchParams({ partyId: shown.id, party: shown.name })
    onClose?.()
    navigate(`/parties/statements?${params.toString()}`)
  }

  return (
    <Modal open={open} onClose={onClose} title={shown.name} size="2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="bg-[var(--primary-tint)] text-[var(--primary)]">{shown.type}</Chip>
              <Chip tone={shown.status === 'active' ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-gray-100 text-gray-500'}>{shown.status}</Chip>
              <Chip tone={gst.valid && gst.stateMatched ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-[var(--warn-tint)] text-[var(--warn)]'}>
                {gst.valid && gst.stateMatched ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {countryConfig.taxSystem} {gst.valid ? 'valid' : 'review'}
              </Chip>
              {duplicates.length > 0 && (
                <Chip tone="bg-[var(--warn-tint)] text-[var(--warn)]">{duplicates.length} possible duplicate</Chip>
              )}
            </div>
            <p className="mt-2 font-mono text-xs text-[var(--faint)]">{shown.taxId || shown.gstin}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={Edit3} onClick={() => action('Edit profile opened', shown)}>Edit</Button>
            <Button size="sm" variant="secondary" icon={BellRing} onClick={() => openReminderQueue()}>Reminder</Button>
            <Button size="sm" variant="secondary" icon={FileText} onClick={openStatement}>Statement</Button>
            <Button size="sm" variant="primary" icon={MessageCircle} onClick={() => openReminderQueue('WhatsApp')}>WhatsApp</Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Outstanding</p>
            <p className="mt-1 tabular text-lg font-bold text-[var(--text)]">{formatCurrency(shown.outstanding ?? 0)}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Overdue</p>
            <p className="mt-1 tabular text-lg font-bold text-[var(--neg)]">{formatCurrency(shown.overdue ?? 0)}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Credit Used</p>
            <p className={`mt-1 tabular text-lg font-bold ${breach ? 'text-[var(--neg)]' : 'text-[var(--primary)]'}`}>{shown.creditLimit ? `${creditUsed}%` : '-'}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Portal</p>
            <p className="mt-1 text-sm font-bold text-[var(--text)]">{shown.portal}</p>
          </div>
        </div>

        {breach && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--neg)]/20 bg-[var(--neg-tint)] px-3 py-2 text-xs font-semibold text-[var(--neg)]">
            <AlertTriangle size={14} />
            Credit limit breached. Warn or block new invoices until payment is received.
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 size={15} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact" value={shown.contactPerson} />
                <Field label="Phone" value={shown.phone} />
                <Field label="Email" value={shown.email} />
                <Field label="PAN" value={shown.pan} />
                <Field label="State" value={shown.state} />
                <Field label="Credit Period" value={`${shown.creditPeriod} days`} />
                <Field label="Payment Mode" value={shown.preferredMode} />
                <Field label="Owner" value={shown.owner} />
              </div>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={15} className="text-[var(--primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Tax and portal checks</h3>
              </div>
              <div className="space-y-2 text-xs text-[var(--muted)]">
                <p>Legal name: <span className="font-semibold text-[var(--text)]">{gst.legalName}</span></p>
                <p>{countryConfig.taxSystem} Jurisdiction: <span className="font-semibold text-[var(--text)]">{gst.expectedState || shown.city || 'Standard'}</span></p>
                <p>Last portal activity: <span className="font-semibold text-[var(--text)]">{shown.lastPortalActivity}</span></p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text)]">Bill-wise outstanding</h3>
                <Button size="sm" variant="secondary" icon={Receipt} onClick={() => action('Payment allocation opened', shown)}>Allocate</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                      <th className="py-2">Ref</th>
                      <th>Due</th>
                      <th>Bucket</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map(row => (
                      <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 font-mono text-xs text-[var(--primary)]">{row.ref}</td>
                        <td className="text-xs text-[var(--muted)]">{row.dueDate}</td>
                        <td><Chip>{row.bucket}</Chip></td>
                        <td className={`text-right tabular font-semibold ${row.balance < 0 ? 'text-[var(--primary)]' : row.bucket === '31-60' || row.bucket === '90+' ? 'text-[var(--neg)]' : 'text-[var(--text)]'}`}>{formatCurrency(Math.abs(row.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Timeline</h3>
                <div className="space-y-3">
                  {timeline.map(item => (
                    <div key={item.id} className="text-xs">
                      <p className="font-semibold text-[var(--text)]">{item.type} - {item.date}</p>
                      <p className="mt-0.5 text-[var(--muted)]">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text)]">Documents</h3>
                  <Download size={14} className="text-[var(--muted)]" />
                </div>
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 rounded bg-[var(--surface-2)] px-2 py-2 text-xs">
                      <span className="font-medium text-[var(--text)]">{doc.name}</span>
                      <span className="text-[var(--muted)]">{doc.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          <Button size="sm" variant="secondary" icon={Mail} onClick={() => action('Email sent', shown)}>Email</Button>
          <Button size="sm" variant="secondary" icon={Phone} onClick={() => action('Call logged', shown)}>Call</Button>
          <Button size="sm" variant="secondary" icon={Receipt} onClick={() => action(shown.type === 'Supplier' ? 'Payment recorded' : 'Receipt recorded', shown)}>
            {shown.type === 'Supplier' ? 'Record Payment' : 'Record Receipt'}
          </Button>
          <Button size="sm" variant="secondary" icon={FileText} onClick={() => action(shown.type === 'Supplier' ? 'Bill created' : 'Invoice created', shown)}>
            {shown.type === 'Supplier' ? 'Create Bill' : 'Create Invoice'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
