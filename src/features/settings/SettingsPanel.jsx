import { useMemo, useState } from 'react'
import {
  Bell, Building2, CalendarDays, CheckCircle2, KeyRound,
  Save, ShieldCheck, Lock, Unlock,
  AlertTriangle, Info, AlertCircle, XCircle,
  FileCheck, Plug, RefreshCw, ChevronRight, RotateCcw,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import Panel from '../../components/ui/Panel'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import sections from '../../config/sections'
import { ROLES as RBAC_ROLES, LEVELS } from '../../config/permissions'
import { mergeMatrix, levelFor } from '../../lib/rbac'
import { INTEGRATION_CATALOG, INTEGRATION_CATEGORIES } from '../../data/services/integrationsService'
import { useAppStore } from '../../store/useAppStore'
import { getActiveLocale } from '../../lib/currency'

/* ─────────────────────────── TAB CONFIG ─────────────────────────── */
const CONFIG = {
  'company-profile': {
    title: 'Company Profile',
    subtitle: 'GST registration, PAN, CIN, registered address, and bank details',
    icon: Building2,
  },
  configuration: {
    title: 'Accounting Configuration',
    subtitle: 'Financial year, voucher numbering, approval limits, tax defaults, and period-lock rules',
    icon: FileCheck,
  },
  'fiscal-periods': {
    title: 'Fiscal Periods',
    subtitle: 'Open, close, or lock accounting periods for FY 2025-26',
    icon: CalendarDays,
  },
  roles: {
    title: 'Roles & Permissions',
    subtitle: 'Control module-level access for accountants, finance leads, auditors, and CA users',
    icon: ShieldCheck,
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'GST portal, TRACES, bank feeds, e-way bill, and third-party connectors',
    icon: Plug,
  },
  notifications: {
    title: 'Notification Templates',
    subtitle: 'Email and push templates for GST reminders, approvals, payment alerts, and CA access',
    icon: Bell,
  },
  'audit-logs': {
    title: 'Audit Logs',
    subtitle: 'System events, user actions, configuration changes, and sensitive accounting operations',
    icon: KeyRound,
  },
}

/* ─────────────────────────── MOCK DATA ─────────────────────────── */
const ROLES = [
  { id: 'R001', role: 'Super Admin',    description: 'Full access — all modules, configs, period unlock, user mgmt', users: 2,  systemDefault: true,  status: 'active' },
  { id: 'R002', role: 'Finance Lead',   description: 'Approvals, bank review, reports, period close, CA grant',       users: 4,  systemDefault: false, status: 'active' },
  { id: 'R003', role: 'Senior Accountant', description: 'Post vouchers, reconcile, AR/AP, GST prep, TDS',            users: 8,  systemDefault: true,  status: 'active' },
  { id: 'R004', role: 'Accountant', description: 'Data entry, DR/CR notes, POS billing, delivery challans',   users: 12, systemDefault: true,  status: 'active' },
  { id: 'R005', role: 'CA / Auditor',   description: 'Temporary read-only access scoped to granted period',           users: 2,  systemDefault: false, status: 'active' },
  { id: 'R006', role: 'Viewer (Branch)', description: 'Read-only reports for assigned cost center branch only',       users: 5,  systemDefault: false, status: 'active' },
]

const FISCAL_PERIODS = [
  { id:'FP01', period:'Apr 2025', start:'2025-04-01', end:'2025-04-30', status:'locked',  closedOn:'2025-05-10', closedBy:'Finance Lead' },
  { id:'FP02', period:'May 2025', start:'2025-05-01', end:'2025-05-31', status:'locked',  closedOn:'2025-06-08', closedBy:'Finance Lead' },
  { id:'FP03', period:'Jun 2025', start:'2025-06-01', end:'2025-06-30', status:'locked',  closedOn:'2025-07-07', closedBy:'Finance Lead' },
  { id:'FP04', period:'Jul 2025', start:'2025-07-01', end:'2025-07-31', status:'locked',  closedOn:'2025-08-09', closedBy:'Finance Lead' },
  { id:'FP05', period:'Aug 2025', start:'2025-08-01', end:'2025-08-31', status:'locked',  closedOn:'2025-09-06', closedBy:'Finance Lead' },
  { id:'FP06', period:'Sep 2025', start:'2025-09-01', end:'2025-09-30', status:'locked',  closedOn:'2025-10-10', closedBy:'Finance Lead' },
  { id:'FP07', period:'Oct 2025', start:'2025-10-01', end:'2025-10-31', status:'closed',  closedOn:'2025-11-08', closedBy:'Senior Accountant' },
  { id:'FP08', period:'Nov 2025', start:'2025-11-01', end:'2025-11-30', status:'closed',  closedOn:'2025-12-07', closedBy:'Senior Accountant' },
  { id:'FP09', period:'Dec 2025', start:'2025-12-01', end:'2025-12-31', status:'closed',  closedOn:'2026-01-09', closedBy:'Finance Lead' },
  { id:'FP10', period:'Jan 2026', start:'2026-01-01', end:'2026-01-31', status:'open',    closedOn:null,         closedBy:null           },
  { id:'FP11', period:'Feb 2026', start:'2026-02-01', end:'2026-02-28', status:'open',    closedOn:null,         closedBy:null           },
  { id:'FP12', period:'Mar 2026', start:'2026-03-01', end:'2026-03-31', status:'open',    closedOn:null,         closedBy:null           },
]

const TEMPLATES = [
  { id:'N001', category:'GST',       name:'GSTR-3B Due Reminder',      channel:'Email + Push' },
  { id:'N002', category:'GST',       name:'GSTR-1 Filing Reminder',     channel:'Email'        },
  { id:'N003', category:'TDS',       name:'TDS Quarterly Due Alert',    channel:'Email + Push' },
  { id:'N004', category:'Approvals', name:'Voucher Approval Request',   channel:'Email'        },
  { id:'N005', category:'Approvals', name:'Payment Run Approval',       channel:'Email + Push' },
  { id:'N006', category:'Payments',  name:'Receipt Recorded — Customer',channel:'Email'        },
  { id:'N007', category:'CA Access', name:'Temporary Access Link',      channel:'Email'        },
  { id:'N008', category:'Period',    name:'Period Close Reminder',       channel:'Email + Push' },
]

const AUDIT_LOGS = [
  { id:'A001', ts:'27 May 2026 11:48 AM', user:'Priya S (Admin)',      module:'Settings',      action:'UPDATE',  entity:'GST Registration',      detail:'GSTIN updated — 27AABCU9603R1ZX → 27AABCU9603R1ZY', severity:'critical', ip:'192.168.1.45' },
  { id:'A002', ts:'27 May 2026 10:22 AM', user:'Rahul M (Finance Lead)',module:'Receivables',   action:'POST',    entity:'Receipt REC-2526-0055', detail:'₹16,00,000 receipt posted against SI-2526-0099',      severity:'info',     ip:'10.0.0.12'    },
  { id:'A003', ts:'27 May 2026 09:55 AM', user:'System',               module:'Banking',       action:'SYNC',    entity:'ICICI Bank Feed',       detail:'Imported 38 statement lines for Jan 2026',            severity:'info',     ip:'Localhost'    },
  { id:'A004', ts:'26 May 2026 06:30 PM', user:'Ankit R (Accountant)', module:'Expenses',      action:'POST',    entity:'JV-2026-042',           detail:'Journal voucher posted — ₹45,000 depreciation',       severity:'info',     ip:'192.168.1.110'},
  { id:'A005', ts:'26 May 2026 04:10 PM', user:'Priya S (Admin)',      module:'Settings',      action:'CREATE',  entity:'CA Access — CACSE001',  detail:'Temp CA access granted to CA Suresh Kumar till 31 May',severity:'warning',  ip:'192.168.1.45' },
  { id:'A006', ts:'26 May 2026 02:45 PM', user:'System',               module:'Tax',           action:'SUBMIT',  entity:'GSTR-3B Dec 2025',      detail:'GSTR-3B filed successfully — ARN AA280526123456789',  severity:'info',     ip:'Localhost'    },
  { id:'A007', ts:'26 May 2026 11:30 AM', user:'Rahul M (Finance Lead)',module:'Fiscal Periods',action:'LOCK',   entity:'Period Dec 2025',       detail:'December 2025 period locked after reconciliation',     severity:'warning',  ip:'10.0.0.12'    },
  { id:'A008', ts:'25 May 2026 08:00 PM', user:'System',               module:'Sales',         action:'SYNC',    entity:'E-Invoice Batch',       detail:'24 IRNs generated for SI-2526-0098 to SI-2526-0108',  severity:'info',     ip:'Localhost'    },
  { id:'A009', ts:'25 May 2026 05:15 PM', user:'Ankit R (Accountant)', module:'Payables',      action:'DELETE',  entity:'Draft PO-2526-0011',    detail:'Draft purchase order deleted — below approval',        severity:'warning',  ip:'192.168.1.110'},
  { id:'A010', ts:'25 May 2026 09:00 AM', user:'System',               module:'Alerts',        action:'TRIGGER', entity:'Overdue Alert',         detail:'3 invoices crossed 30-day overdue threshold — notified',severity:'warning', ip:'Localhost'    },
]

const SEV_CFG = {
  info:     { icon: Info,          color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-tint)]', label: 'Info'     },
  warning:  { icon: AlertTriangle, color: 'text-[var(--warn)]',    bg: 'bg-amber-50',              label: 'Warning'  },
  critical: { icon: XCircle,       color: 'text-[var(--neg)]',     bg: 'bg-[var(--neg-tint)]',     label: 'Critical' },
}

/* ─────────────────────────── SHARED UI ─────────────────────────── */
function SettingsCard({ title, description, children, action }) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Panel>
  )
}

function SettingRow({ label, hint, value, control = 'input', wide }) {
  return (
    <div className={`grid gap-2 py-3 border-b border-[var(--border)] last:border-0 ${wide ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[220px_1fr]'} md:gap-4 items-start`}>
      <div>
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        {hint && <p className="text-[11px] text-[var(--faint)] mt-0.5">{hint}</p>}
      </div>
      {control === 'select' ? (
        <select className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]">
          {value.map(v => <option key={v}>{v}</option>)}
        </select>
      ) : control === 'toggle' ? (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div className="w-9 h-5 rounded-full bg-[var(--primary)] relative">
            <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-xs font-medium text-[var(--pos)]">Enabled</span>
        </label>
      ) : control === 'toggle-off' ? (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div className="w-9 h-5 rounded-full bg-gray-300 relative">
            <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-xs font-medium text-[var(--muted)]">Disabled</span>
        </label>
      ) : control === 'readonly' ? (
        <div className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 flex items-center text-sm text-[var(--muted)] font-mono">
          {value}
        </div>
      ) : (
        <input
          defaultValue={value}
          className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
        />
      )}
    </div>
  )
}

/* ─────────────────────────── TAB CONTENT ─────────────────────────── */
function CompanyProfile() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <SettingsCard title="Company Identity" description="Legal name, company type, and registration numbers">
        <SettingRow label="Company Name"     value="UnifiedTree Technologies Pvt Ltd" />
        <SettingRow label="Company Type"     value={['Private Limited', 'LLP', 'Proprietorship', 'Partnership']} control="select" />
        <SettingRow label="CIN"              value="U72200MH2019PTC324181" control="readonly" />
        <SettingRow label="PAN"              value="AABCU9603R" control="readonly" />
        <SettingRow label="TAN"              value="MUMT12345A" />
        <SettingRow label="MSME Registration" value="UDYAM-MH-01-0012345" />
      </SettingsCard>

      <SettingsCard title="GST Details" description="GST registration, filing type, and e-invoicing applicability">
        <SettingRow label="GSTIN"                value="27AABCU9603R1ZX" control="readonly" hint="State: Maharashtra (27)" />
        <SettingRow label="GST Registration Type" value={['Regular', 'Composition', 'Unregistered']} control="select" />
        <SettingRow label="E-Invoicing Applicable" control="toggle" />
        <SettingRow label="HSN/SAC Summary Required" control="toggle" />
        <SettingRow label="GST Filing Frequency" value={['Monthly (QRMP - No)', 'Quarterly (QRMP - Yes)']} control="select" />
        <SettingRow label="State (Place of Supply)" value="Maharashtra (27)" />
      </SettingsCard>

      <SettingsCard title="Registered Address" description="As per GST and MCA registration">
        <SettingRow label="Address Line 1" value="Unit 402, Solitaire Corporate Park" />
        <SettingRow label="Address Line 2" value="Andheri-Kurla Road, Andheri East" />
        <SettingRow label="City"           value="Mumbai" />
        <SettingRow label="State"          value={['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu']} control="select" />
        <SettingRow label="PIN Code"       value="400093" />
      </SettingsCard>

      <SettingsCard title="Primary Bank Account" description="Used for payment references and account statements">
        <SettingRow label="Bank Name"       value="ICICI Bank Ltd" />
        <SettingRow label="Account Number"  value="••••  ••••  4821" control="readonly" hint="Stored encrypted" />
        <SettingRow label="IFSC Code"       value="ICIC0000195" />
        <SettingRow label="Account Type"    value={['Current', 'Savings', 'Overdraft']} control="select" />
        <SettingRow label="MICR Code"       value="400229002" />
      </SettingsCard>
    </div>
  )
}

function AccountingConfiguration() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <SettingsCard title="Financial Year & Period" description="FY boundaries, accounting method, and currency settings">
        <SettingRow label="Financial Year"     value={['April – March (India Standard)', 'January – December']} control="select" />
        <SettingRow label="Accounting Method"  value={['Accrual (Default)', 'Cash Basis']} control="select" />
        <SettingRow label="Base Currency"      value={['INR – Indian Rupee', 'USD – US Dollar']} control="select" />
        <SettingRow label="Currency Rounding"  value={['Round to whole unit', 'Round to 0.01']} control="select" />
        <SettingRow label="Default Payment Terms" value="30 Days" hint="Used when no terms set on party" />
      </SettingsCard>

      <SettingsCard title="Voucher & Document Numbering" description="Auto-numbering format for all document types">
        <SettingRow label="Auto-Numbering"       control="toggle" />
        <SettingRow label="Sales Invoice Prefix" value="SI-{FY}-" hint="e.g. SI-2526-0001" />
        <SettingRow label="Purchase Invoice Prefix" value="PI-{FY}-" />
        <SettingRow label="Journal Voucher Prefix" value="JV-{YYYY}-" />
        <SettingRow label="Receipt Prefix"       value="REC-{FY}-" />
        <SettingRow label="Narration Mandatory"  control="toggle-off" hint="Force narration on all vouchers" />
      </SettingsCard>

      <SettingsCard title="Approval Workflow" description="Minimum amounts that trigger approval before posting">
        <SettingRow label="Payment Approval Limit"   value="500000" hint="In base currency — payments above this need Finance Lead sign-off" />
        <SettingRow label="Journal Approval Required" control="toggle" />
        <SettingRow label="Credit Note Approval"     control="toggle" hint="Credit notes need Finance Lead approval" />
        <SettingRow label="Purchase Order Approval"  value="250000" hint="In base currency — PO value above this needs approval" />
        <SettingRow label="Write-off Approval"       value="10000"  hint="In base currency — any write-off needs Finance Lead" />
      </SettingsCard>

      <SettingsCard title="Tax Defaults" description="Default behaviour for GST, TDS, and TCS across transactions">
        <SettingRow label="Default GST Rate"      value={['18% (Standard)', '12%', '5%', '28%', '0% (Exempt)']} control="select" />
        <SettingRow label="TDS Tracking"          control="toggle" hint="Track TDS deductions on vendor payments" />
        <SettingRow label="TCS Collection"        control="toggle-off" hint="Collect TCS on high-value sales" />
        <SettingRow label="Reverse Charge (RCM)"  control="toggle" hint="Auto-flag RCM applicable purchases" />
        <SettingRow label="Input Tax Credit (ITC)" control="toggle" hint="Enable ITC offset against GST liability" />
      </SettingsCard>

      <SettingsCard title="Period Locking & Close" description="Controls for preventing edits to closed accounting periods">
        <SettingRow label="Period Lock Mode"      value={['Manual (Finance Lead locks)', 'Auto (10 days after period end)']} control="select" />
        <SettingRow label="Quarter Close Locking" control="toggle" hint="Auto-lock quarter once GSTR-3B is filed" />
        <SettingRow label="Allow Backdating"      value="30 Days" hint="Max days past period to allow back-dated entries" />
        <SettingRow label="Year-End Lock Trigger" value={['Manual', 'After Annual Audit Sign-off']} control="select" />
      </SettingsCard>

      <SettingsCard title="Reports & Statements" description="Output preferences for financial statements and exports">
        <SettingRow label="P&L View Default"     value={['Vertical Format', 'Horizontal (T-Account)']} control="select" />
        <SettingRow label="Balance Sheet Format" value={['Schedule VI (Companies Act)', 'Simple Format']} control="select" />
        <SettingRow label="Export Default Format" value={['Excel (.xlsx)', 'CSV', 'PDF']} control="select" />
        <SettingRow label="Show Cost Centers in Reports" control="toggle" />
      </SettingsCard>
    </div>
  )
}

function FiscalPeriods() {
  const STATUS_CFG = {
    open:   { icon: Unlock,       bg: 'bg-[var(--pos-tint)]',     text: 'text-[var(--pos)]',     label: 'Open'   },
    closed: { icon: Lock,         bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary)]', label: 'Closed' },
    locked: { icon: AlertCircle,  bg: 'bg-gray-100',              text: 'text-gray-500',         label: 'Locked' },
  }

  const closedCount = FISCAL_PERIODS.filter(p => p.status !== 'open').length
  const openCount   = FISCAL_PERIODS.filter(p => p.status === 'open').length

  const columns = [
    {
      key: 'period',
      label: 'Period',
      render: (val) => <span className="font-semibold text-sm text-[var(--text)]">{val}</span>,
    },
    {
      key: 'start',
      label: 'Start',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'end',
      label: 'End',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const c = STATUS_CFG[val]
        const Icon = c.icon
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            <Icon size={10} />{c.label}
          </span>
        )
      },
    },
    {
      key: 'closedOn',
      label: 'Closed On',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val ?? '—'}</span>,
    },
    {
      key: 'closedBy',
      label: 'Closed By',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val ?? '—'}</span>,
    },
    {
      key: 'status',
      label: '',
      render: (val) => val === 'open'
        ? <Button variant="secondary" size="sm" icon={Lock}>Close Period</Button>
        : val === 'closed'
        ? <Button variant="secondary" size="sm" icon={AlertCircle}>Lock</Button>
        : <Button variant="secondary" size="sm" icon={Unlock}>Unlock</Button>,
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'FY 2025-26', value: '12 periods', color: 'var(--text)'    },
          { label: 'Closed / Locked', value: closedCount, color: 'var(--primary)' },
          { label: 'Open',       value: openCount,     color: 'var(--pos)'    },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">{k.label}</p>
            <p className="tabular text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-xs text-amber-700 mb-4">
        <AlertTriangle size={13} />
        <span>Locked periods cannot be reopened without Super Admin approval. Closed periods can be reopened by Finance Lead.</span>
      </div>

      <DataTable columns={columns} data={FISCAL_PERIODS} rowKey="id" />
    </div>
  )
}

const LEVEL_STYLE = {
  full:   'bg-[var(--pos-tint)] text-[var(--pos)]',
  edit:   'bg-[var(--primary-tint)] text-[var(--primary)]',
  create: 'bg-blue-50 text-blue-600',
  view:   'bg-gray-100 text-gray-500',
  none:   'bg-transparent text-[var(--faint)] border border-dashed border-[var(--border)]',
}
const LEVEL_LABEL = { full: 'Full', edit: 'Edit', create: 'Create', view: 'View', none: 'None' }

function RolesPermissions() {
  const [view, setView] = useState('roles')
  const overrides       = useAppStore(s => s.permissionOverrides)
  const setPermission   = useAppStore(s => s.setPermission)
  const resetPermissions = useAppStore(s => s.resetPermissions)

  const matrix = useMemo(() => mergeMatrix(overrides), [overrides])
  const rows   = [...sections.map(s => ({ id: s.id, label: s.label })), { id: 'settings', label: 'Settings' }]

  function cycle(sectionId, role) {
    const cur  = levelFor(matrix, role, sectionId)
    const next = LEVELS[(LEVELS.indexOf(cur) + 1) % LEVELS.length]
    setPermission(sectionId, role, next)
  }

  const hasOverrides = Object.keys(overrides).length > 0

  return (
    <div>
      <div className="flex gap-1 mb-4 items-center">
        {['roles', 'matrix'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] transition-colors ${view === v ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'}`}
          >
            {v === 'roles' ? 'Roles' : 'Permission Matrix'}
          </button>
        ))}
        {view === 'matrix' && hasOverrides && (
          <Button variant="secondary" size="sm" icon={RotateCcw} className="ml-auto" onClick={resetPermissions}>
            Reset to Defaults
          </Button>
        )}
      </div>

      {view === 'roles' ? (
        <DataTable
          columns={[
            { key: 'role',          label: 'Role',           sortable: true, render: v => <span className="font-semibold text-sm text-[var(--text)]">{v}</span> },
            { key: 'description',   label: 'Description',    render: v => <span className="text-sm text-[var(--muted)]">{v}</span> },
            { key: 'users',         label: 'Users',          align: 'center', render: v => <span className="tabular text-sm text-[var(--text)]">{v}</span> },
            { key: 'systemDefault', label: 'System Default', align: 'center', render: v => v
              ? <CheckCircle2 size={14} className="text-[var(--pos)] mx-auto" />
              : <span className="text-[var(--faint)] text-xs">—</span> },
            { key: 'status',        label: 'Status',         render: v => <StatusBadge status={v} /> },
          ]}
          data={ROLES}
          rowKey="id"
        />
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--primary-tint)] border border-[var(--primary)]/20 text-xs text-[var(--primary)] mb-4">
            <Info size={13} />
            <span>Click any cell to cycle access: None → View → Create → Edit → Full. Changes apply live and persist — switch roles from the header bar to test.</span>
          </div>
          <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2.5 text-[var(--muted)] font-semibold sticky left-0 bg-[var(--surface-2)]">Module</th>
                  {RBAC_ROLES.map(r => (
                    <th key={r} className="px-3 py-2.5 text-[var(--muted)] font-semibold text-center whitespace-nowrap">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} className={`border-b border-[var(--border)] ${i % 2 === 0 ? '' : 'bg-[var(--surface-2)]'}`}>
                    <td className="px-4 py-2.5 font-medium text-[var(--text)] sticky left-0 bg-[inherit] whitespace-nowrap">{row.label}</td>
                    {RBAC_ROLES.map(r => {
                      const lvl = levelFor(matrix, r, row.id)
                      return (
                        <td key={r} className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => cycle(row.id, r)}
                            title={`${row.label} · ${r}`}
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-semibold min-w-[52px] transition-colors hover:opacity-80 ${LEVEL_STYLE[lvl]}`}
                          >
                            {LEVEL_LABEL[lvl]}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function fmtSync(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(getActiveLocale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Integrations() {
  const stored                = useAppStore(s => s.integrations)
  const connectIntegration    = useAppStore(s => s.connectIntegration)
  const disconnectIntegration = useAppStore(s => s.disconnectIntegration)
  const syncIntegration       = useAppStore(s => s.syncIntegration)

  const [active, setActive] = useState(null)   // catalog item being connected/configured
  const [apiKey, setApiKey] = useState('')

  // Merge catalog with persisted overrides; seedStatus is the demo default.
  const items = INTEGRATION_CATALOG.map(c => {
    const o = stored[c.id]
    return {
      ...c,
      status:   o?.status ?? c.seedStatus,
      lastSync: o?.lastSync ?? null,
      apiKey:   o?.apiKey ?? null,
    }
  })

  const connectedCount = items.filter(i => i.status === 'connected').length

  function openModal(item) {
    setActive(item)
    setApiKey(item.apiKey ?? '')
  }
  function closeModal() {
    setActive(null)
    setApiKey('')
  }
  function save() {
    if (!active) return
    connectIntegration(active.id, { apiKey: apiKey.trim() || null })
    closeModal()
  }
  function disconnect() {
    if (!active) return
    disconnectIntegration(active.id)
    closeModal()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--primary-tint)] border border-[var(--primary)]/20 text-xs text-[var(--primary)]">
        <Info size={13} />
        <span>{connectedCount} of {items.length} connectors active. Connections are simulated for the demo — credentials are stored locally, never sent anywhere.</span>
      </div>

      {INTEGRATION_CATEGORIES.map(cat => {
        const group = items.filter(i => i.category === cat)
        if (group.length === 0) return null
        return (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">{cat}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.map(item => {
                const connected = item.status === 'connected'
                return (
                  <Panel key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-[var(--text)]">{item.name}</span>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{item.desc}</p>
                        {connected && item.lastSync && (
                          <p className="text-[10px] text-[var(--faint)] mt-1 flex items-center gap-1">
                            <RefreshCw size={9} /> Last sync: {fmtSync(item.lastSync)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${connected ? 'bg-[var(--pos-tint)] text-[var(--pos)]' : 'bg-amber-50 text-amber-600'}`}>
                          {connected ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                          {connected ? 'Connected' : 'Not Connected'}
                        </span>
                        <div className="flex gap-1.5">
                          {connected && (
                            <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => syncIntegration(item.id)}>
                              Sync
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => openModal(item)}>
                            {connected ? 'Configure' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                )
              })}
            </div>
          </div>
        )
      })}

      <Modal
        open={!!active}
        onClose={closeModal}
        title={active ? `${active.status === 'connected' || stored[active.id]?.status === 'connected' ? 'Configure' : 'Connect'} ${active.name}` : ''}
        footer={
          <div className="flex items-center justify-between w-full gap-2">
            {active && (items.find(i => i.id === active.id)?.status === 'connected') ? (
              <Button variant="ghost" icon={Unlock} onClick={disconnect} className="text-[var(--neg)]">
                Disconnect
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" icon={Plug} onClick={save}>Save & Connect</Button>
            </div>
          </div>
        }
      >
        {active && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">{active.desc}</p>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">API Key / Access Token</span>
              <input
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Paste your provider API key"
                className="mt-1.5 w-full h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] font-mono focus:outline-none focus:border-[var(--primary)]"
              />
              <span className="text-[11px] text-[var(--faint)] mt-1 block">Demo only — key is kept in your browser and not transmitted.</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}

function NotificationTemplates() {
  const [selected, setSelected] = useState(TEMPLATES[0])
  const categories = [...new Set(TEMPLATES.map(t => t.category))]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
      {/* Template list */}
      <Panel padded={false} className="overflow-hidden h-fit">
        {categories.map(cat => (
          <div key={cat}>
            <div className="px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{cat}</span>
            </div>
            {TEMPLATES.filter(t => t.category === cat).map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between gap-2 ${selected.id === t.id ? 'bg-[var(--primary-tint)]' : ''}`}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{t.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{t.channel}</p>
                </div>
                {selected.id === t.id && <ChevronRight size={14} className="text-[var(--primary)] shrink-0" />}
              </button>
            ))}
          </div>
        ))}
      </Panel>

      {/* Editor */}
      <SettingsCard title={selected.name} description={`Category: ${selected.category} • Channel: ${selected.channel}`}>
        <SettingRow label="Delivery Channel" value={['Email + Push', 'Email Only', 'Push Only', 'WhatsApp', 'Email + WhatsApp']} control="select" />
        <SettingRow label="Email Subject" value={`[UnifiedTree] ${selected.name} — {{company_name}}`} />
        <SettingRow label="Days Before Due" value="3" hint="Send X days before the deadline (0 = day of)" />
        <div className="pt-3">
          <label className="block mb-1.5">
            <span className="text-sm font-medium text-[var(--text)]">Message Body</span>
            <span className="text-[11px] text-[var(--faint)] ml-2">Use {'{{'}variable{'}}'}  for merge tags</span>
          </label>
          <textarea
            rows={8}
            defaultValue={`Hi {{user_name}},\n\nThis is a reminder: ${selected.name} is due for {{period}}.\n\nCompany: {{company_name}}\nAmount / Reference: {{reference}}\nDue Date: {{due_date}}\n\nLog in to UnifiedTree Accounting to take action.\n\nThanks,\nFinance Team — {{company_name}}`}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text)] font-mono focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['{{user_name}}', '{{company_name}}', '{{period}}', '{{due_date}}', '{{reference}}', '{{amount}}'].map(tag => (
            <span key={tag} className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">{tag}</span>
          ))}
        </div>
      </SettingsCard>
    </div>
  )
}

function AuditLogs() {
  const [sevFilter, setSevFilter] = useState('All')
  const [modFilter, setModFilter] = useState('All')
  const auditEvents = useAppStore(s => s.auditEvents)

  const liveLogs = auditEvents.map((event) => ({
    id: event.id,
    ts: fmtSync(event.ts),
    user: `${event.actor}${event.role ? ` (${event.role})` : ''}`,
    module: event.module,
    action: event.type.toUpperCase(),
    entity: event.title,
    detail: event.detail,
    severity: event.severity === 'warning' ? 'warning' : event.severity === 'critical' ? 'critical' : 'info',
    ip: 'LocalStorage',
  }))
  const allLogs = [...liveLogs, ...AUDIT_LOGS]
  const modules = [...new Set(allLogs.map(l => l.module))]
  const filtered = allLogs.filter(l => {
    const matchSev = sevFilter === 'All' || l.severity === sevFilter
    const matchMod = modFilter === 'All' || l.module === modFilter
    return matchSev && matchMod
  })

  const columns = [
    {
      key: 'ts',
      label: 'Timestamp',
      render: (val) => <span className="font-mono text-[11px] text-[var(--muted)] whitespace-nowrap">{val}</span>,
    },
    {
      key: 'severity',
      label: '',
      render: (val) => {
        const c = SEV_CFG[val]
        const Icon = c.icon
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${c.bg} ${c.color}`}>
            <Icon size={9} />{c.label}
          </span>
        )
      },
    },
    {
      key: 'user',
      label: 'User',
      render: (val) => <span className="text-sm font-medium text-[var(--text)]">{val}</span>,
    },
    {
      key: 'module',
      label: 'Module',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]">
          {val}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (val) => {
        const colors = { CREATE:'text-[var(--pos)]', UPDATE:'text-[var(--warn)]', DELETE:'text-[var(--neg)]', POST:'text-[var(--primary)]', SYNC:'text-[var(--muted)]', SUBMIT:'text-[var(--pos)]', LOCK:'text-[var(--warn)]', TRIGGER:'text-[var(--muted)]' }
        return <span className={`font-mono text-xs font-bold ${colors[val] ?? 'text-[var(--muted)]'}`}>{val}</span>
      },
    },
    {
      key: 'detail',
      label: 'Detail',
      render: (val) => <span className="text-sm text-[var(--muted)]">{val}</span>,
    },
    {
      key: 'ip',
      label: 'IP',
      render: (val) => <span className="font-mono text-xs text-[var(--faint)]">{val}</span>,
    },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={sevFilter}
          onChange={e => setSevFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="All">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={modFilter}
          onChange={e => setModFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="All">All Modules</option>
          {modules.map(m => <option key={m}>{m}</option>)}
        </select>
        <span className="ml-auto text-xs text-[var(--muted)] self-center">{filtered.length} entries</span>
      </div>

      <DataTable columns={columns} data={filtered} rowKey="id" />
    </div>
  )
}

/* ─────────────────────────── MAIN EXPORT ─────────────────────────── */
export default function SettingsPanel({ tab }) {
  const cfg = CONFIG[tab] ?? CONFIG.configuration

  const content = useMemo(() => {
    switch (tab) {
      case 'company-profile': return <CompanyProfile />
      case 'fiscal-periods':  return <FiscalPeriods />
      case 'roles':           return <RolesPermissions />
      case 'integrations':    return <Integrations />
      case 'notifications':   return <NotificationTemplates />
      case 'audit-logs':      return <AuditLogs />
      default:                return <AccountingConfiguration />
    }
  }, [tab])

  const showSave = !['fiscal-periods', 'audit-logs', 'integrations', 'roles'].includes(tab)

  return (
    <div>
      <PageHeader
        title={cfg.title}
        subtitle={cfg.subtitle}
        breadcrumb={['Settings', cfg.title]}
        action={showSave
          ? <Button variant="primary" icon={Save}>Save Changes</Button>
          : null
        }
      />
      {content}
    </div>
  )
}
