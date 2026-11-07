import { useState, useMemo } from 'react'
import {
  CheckCircle2, Circle, Sparkles, ShieldCheck, AlertTriangle,
  FileText, Send, RotateCcw, ChevronRight, ChevronLeft, Eye, Lock,
} from 'lucide-react'
import PageHeader   from '../../components/layout/PageHeader'
import Button       from '../../components/ui/Button'
import { formatCurrency } from '../../lib/currency'
import { toast }    from '../../lib/toast'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const COUNTRY_WIZARD_DATA = {
  IN: {
    title: 'GSTR-3B Summary Return Wizard',
    subtitle: 'Self-assessment of outward supplies, GSTR-2B ITC matching & GSTN filing',
    period: 'December 2024',
    breadcrumb: ['Tax Center', 'File GSTR-3B'],
    liabilityTitle: 'Outward Tax Liability (Table 3.1)',
    liabilityHeads: [
      { head: 'CGST (Central Tax)', taxable: 2840000, rate: '9%', tax: 255600 },
      { head: 'SGST (State Tax)', taxable: 2840000, rate: '9%', tax: 255600 },
      { head: 'IGST (Integrated Tax)', taxable: 980000, rate: '18%', tax: 176400 },
      { head: 'Cess (Compensation)', taxable: 120000, rate: '5%', tax: 6000 },
    ],
    creditTitle: 'Eligible ITC Claim (Table 4)',
    credits: [
      { head: 'CGST Input Credit', available: 198000, reversed: 12000, net: 186000 },
      { head: 'SGST Input Credit', available: 198000, reversed: 12000, net: 186000 },
      { head: 'IGST Input Credit', available: 145000, reversed: 8000, net: 137000 },
    ],
    aiChecks: [
      { status: 'ok', msg: 'GSTR-2B ITC matches books within 0.2% tolerance' },
      { status: 'ok', msg: 'All B2B invoices have valid GSTINs verified' },
      { status: 'warn', msg: '3 invoices flagged for possible duplicate — review before filing' },
      { status: 'ok', msg: 'No nil-rated supply discrepancy detected' },
      { status: 'ok', msg: 'HSN summary complete for all line items' },
      { status: 'warn', msg: 'ITC reversal Rule 42 — minor difference of ₹1,240 detected' },
    ],
    statutoryAct: 'Section 44 of the CGST Act, 2017 & State GST Rules',
    fileButtonText: 'File GSTR-3B with DSC / EVC',
  },
  US: {
    title: 'State & Local Sales Tax Remittance Wizard',
    subtitle: 'Multi-jurisdiction sales tax remittance, resale deductions & state filing',
    period: 'Q4 2024 / December',
    breadcrumb: ['Sales Tax Center', 'File Sales Tax Remittance'],
    liabilityTitle: 'Gross Sales & Tax Collected by District',
    liabilityHeads: [
      { head: 'California State Tax', taxable: 420000, rate: '6.00%', tax: 25200 },
      { head: 'San Francisco County Surtax', taxable: 210000, rate: '1.25%', tax: 2625 },
      { head: 'Bay Area Rapid Transit (BART)', taxable: 210000, rate: '0.50%', tax: 1050 },
      { head: 'Local City District Tax', taxable: 180000, rate: '1.00%', tax: 1800 },
    ],
    creditTitle: 'Resale Certificates & Exempt Deductions',
    credits: [
      { head: 'Wholesale Resale (Form CDTFA-230)', available: 14500, reversed: 0, net: 14500 },
      { head: 'Out-of-State Non-Nexus Delivery', available: 6200, reversed: 0, net: 6200 },
      { head: 'Government / 501(c)(3) Exempt', available: 2800, reversed: 0, net: 2800 },
    ],
    aiChecks: [
      { status: 'ok', msg: 'All customer resale certificates verified active against CDTFA portal' },
      { status: 'ok', msg: 'Economic nexus thresholds tracked across all US states' },
      { status: 'ok', msg: 'Marketplace facilitator tax collections reconciled with Shopify/Stripe' },
      { status: 'warn', msg: '2 shipping addresses in Los Angeles County flagged for district rate change' },
    ],
    statutoryAct: 'California Revenue and Taxation Code & Multistate Tax Compact',
    fileButtonText: 'Submit Sales Tax Return via EFT / ACH',
  },
  GB: {
    title: 'HMRC Making Tax Digital (MTD) VAT 9-Box Wizard',
    subtitle: 'Direct digital link submission to HMRC API under MTD regulations',
    period: 'Quarter Ending 31 Dec 2024',
    breadcrumb: ['VAT Center', 'File MTD VAT Return'],
    liabilityTitle: 'Output Tax Liabilities (Boxes 1 - 3)',
    liabilityHeads: [
      { head: 'Box 1: VAT due on sales and other outputs (20%)', taxable: 145000, rate: '20%', tax: 29000 },
      { head: 'Box 1: Reduced rate supplies (5%)', taxable: 32000, rate: '5%', tax: 1600 },
      { head: 'Box 2: VAT due on acquisitions from EU states', taxable: 18000, rate: 'Reverse', tax: 3600 },
    ],
    creditTitle: 'Input VAT Reclaimable (Box 4)',
    credits: [
      { head: 'Standard Input VAT on Business Purchases', available: 18400, reversed: 800, net: 17600 },
      { head: 'Capital Equipment VAT Reclaim', available: 4200, reversed: 0, net: 4200 },
      { head: 'Postponed Import VAT Accounting (PIVA)', available: 2100, reversed: 0, net: 2100 },
    ],
    aiChecks: [
      { status: 'ok', msg: 'Digital link audit trail intact across all ledger vouchers (Notice 700/22)' },
      { status: 'ok', msg: 'All supplier VAT registration numbers verified via HMRC VIES gateway' },
      { status: 'ok', msg: 'Post-Brexit Northern Ireland protocol declarations accounted' },
      { status: 'warn', msg: 'Minor entertainment expense excluded from Box 4 under business gift rules' },
    ],
    statutoryAct: 'Value Added Tax Act 1994 & Making Tax Digital (MTD) Regulations',
    fileButtonText: 'Submit 9-Box VAT Return to HMRC API',
  },
  AE: {
    title: 'FTA VAT 201 Return Filing Wizard',
    subtitle: 'Emirate-wise supplies, zero-rated exports & FTA EmaraTax submission',
    period: 'Q4 2024 (Oct - Dec)',
    breadcrumb: ['VAT Center', 'File FTA VAT 201'],
    liabilityTitle: 'Standard Rated Supplies by Emirate (5%)',
    liabilityHeads: [
      { head: 'Dubai Standard Rated Supplies', taxable: 650000, rate: '5%', tax: 32500 },
      { head: 'Abu Dhabi Standard Rated Supplies', taxable: 420000, rate: '5%', tax: 21000 },
      { head: 'Sharjah & Northern Emirates', taxable: 180000, rate: '5%', tax: 9000 },
      { head: 'Zero-Rated Direct & Indirect Exports', taxable: 340000, rate: '0%', tax: 0 },
    ],
    creditTitle: 'Recoverable Input Tax & Customs BOE',
    credits: [
      { head: 'Local Standard Rated Expenses', available: 24500, reversed: 1200, net: 23300 },
      { head: 'Import of Goods via Customs Bill of Entry', available: 18200, reversed: 0, net: 18200 },
    ],
    aiChecks: [
      { status: 'ok', msg: 'Supplier TRNs validated against FTA Tax Registration gateway' },
      { status: 'ok', msg: 'Customs BOE declaration numbers matched with Federal Customs Authority' },
      { status: 'ok', msg: 'Designated Zone commercial supplies treated as out-of-scope' },
      { status: 'warn', msg: '1 motor vehicle repair bill marked non-recoverable per Article 53' },
    ],
    statutoryAct: 'Federal Decree-Law No. (8) of 2017 on Value Added Tax (UAE FTA)',
    fileButtonText: 'Submit VAT 201 Return via EmaraTax',
  },
}

const STEPS = [
  { id: 'review',   label: 'Review Liability'    },
  { id: 'itc',      label: 'Input / Deductions'  },
  { id: 'ai-check', label: 'AI Verification'     },
  { id: 'declare',  label: 'Declare & Submit'    },
]

function StepDot({ step, current, index }) {
  const done    = index < STEPS.findIndex(s => s.id === current)
  const active  = step.id === current
  return (
    <div className="flex items-center gap-2 flex-1 last:flex-none">
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
          style={{
            borderColor: done || active ? 'var(--primary)' : 'var(--border)',
            background:  done ? 'var(--primary)' : active ? 'var(--primary-tint)' : 'var(--surface-2)',
          }}
        >
          {done
            ? <CheckCircle2 size={14} color="#fff" />
            : <span className="text-xs font-bold" style={{ color: active ? 'var(--primary)' : 'var(--faint)' }}>{index + 1}</span>
          }
        </div>
        <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: active ? 'var(--primary)' : done ? 'var(--muted)' : 'var(--faint)' }}>
          {step.label}
        </span>
      </div>
      {index < STEPS.length - 1 && (
        <div className="flex-1 h-px mb-5" style={{ background: done ? 'var(--primary)' : 'var(--border)' }} />
      )}
    </div>
  )
}

function StepReview({ wizard, company, config, onNext }) {
  const totalLiability = wizard.liabilityHeads.reduce((s, r) => s + r.tax, 0)
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{wizard.liabilityTitle} — {wizard.period}</span>
          <span className="text-xs text-[var(--faint)]">{config.taxIdLabel}: {company?.taxId || company?.gstin || 'Registered'}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Head / Category', 'Taxable Amount', 'Rate', 'Statutory Tax'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wizard.liabilityHeads.map(row => (
              <tr key={row.head} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.head}</td>
                <td className="px-4 py-3 tabular text-[var(--muted)]">{formatCurrency(row.taxable)}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{row.rate}</td>
                <td className="px-4 py-3 tabular font-semibold text-[var(--text)]">{formatCurrency(row.tax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--surface-2)]">
              <td colSpan={3} className="px-4 py-3 font-bold text-[var(--text)]">Total Gross Liability</td>
              <td className="px-4 py-3 tabular font-bold" style={{ color: 'var(--neg)' }}>{formatCurrency(totalLiability)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={onNext}>Review Credits & Deductions <ChevronRight size={14} /></Button>
      </div>
    </div>
  )
}

function StepITC({ wizard, onNext, onBack }) {
  const totalLiability = wizard.liabilityHeads.reduce((s, r) => s + r.tax, 0)
  const totalCredit    = wizard.credits.reduce((s, r) => s + r.net, 0)
  const netPayable     = Math.max(0, totalLiability - totalCredit)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-tint)]">
        <Sparkles size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm text-[var(--text)]">
          AI matched your purchase register and statutory certificates. Review deductions and eligible input tax credit claims below.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{wizard.creditTitle}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Category', 'Available', 'Ineligible/Reversed', 'Net Credit Claim'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wizard.credits.map(row => (
              <tr key={row.head} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.head}</td>
                <td className="px-4 py-3 tabular text-[var(--pos)]">{formatCurrency(row.available)}</td>
                <td className="px-4 py-3 tabular text-[var(--neg)]">({formatCurrency(row.reversed)})</td>
                <td className="px-4 py-3 tabular font-semibold" style={{ color: 'var(--primary)' }}>{formatCurrency(row.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--surface-2)]">
              <td colSpan={3} className="px-4 py-3 font-bold text-[var(--text)]">Total Deductions / Credits</td>
              <td className="px-4 py-3 tabular font-bold" style={{ color: 'var(--pos)' }}>{formatCurrency(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Net payable card */}
      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[var(--primary)] bg-[var(--primary-tint)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-0.5">Net Tax Remittance Due</p>
          <p className="text-xs text-[var(--muted)]">After adjusting eligible input credits and deductions</p>
        </div>
        <p className="text-2xl font-black tabular" style={{ color: 'var(--primary)' }}>{formatCurrency(netPayable)}</p>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}><ChevronLeft size={14} /> Back</Button>
        <Button variant="primary" onClick={onNext}>AI Verification <ChevronRight size={14} /></Button>
      </div>
    </div>
  )
}

function StepAICheck({ wizard, onNext, onBack }) {
  const warnings = wizard.aiChecks.filter(c => c.status === 'warn').length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-[var(--pos)]/30 bg-[var(--pos-tint)]">
          <p className="text-2xl font-black text-[var(--pos)]">{wizard.aiChecks.length - warnings}</p>
          <p className="text-xs font-semibold text-[var(--muted)] mt-0.5">Statutory Rules Passed</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--warn)]/30 bg-[var(--warn-tint)]">
          <p className="text-2xl font-black text-[var(--warn)]">{warnings}</p>
          <p className="text-xs font-semibold text-[var(--muted)] mt-0.5">Advisories (Review Recommended)</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center gap-2">
          <Sparkles size={11} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>AI Pre-Filing Integrity Checks</span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {wizard.aiChecks.map((c, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              {c.status === 'ok'
                ? <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--pos)' }} />
                : <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warn)' }} />
              }
              <p className="text-xs text-[var(--text)] leading-relaxed">{c.msg}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}><ChevronLeft size={14} /> Back</Button>
        <Button variant="primary" onClick={onNext}>Proceed to Declaration <ChevronRight size={14} /></Button>
      </div>
    </div>
  )
}

function StepDeclare({ wizard, company, config, onBack }) {
  const [declared, setDeclared] = useState(false)
  const [otp, setOtp] = useState('')
  const [filing, setFiling] = useState(false)

  const totalLiability = wizard.liabilityHeads.reduce((s, r) => s + r.tax, 0)
  const totalCredit    = wizard.credits.reduce((s, r) => s + r.net, 0)
  const netPayable     = Math.max(0, totalLiability - totalCredit)

  function handleFile() {
    if (!declared) { toast.error('Please affirm the statutory declaration'); return }
    setFiling(true)
    setTimeout(() => {
      setFiling(false)
      const ackNo = `ACK-${Date.now().toString(36).toUpperCase()}`
      toast.success(`Tax return filed successfully! Acknowledgement: ${ackNo}`)
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={14} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Statutory Sign-Off</span>
        </div>
        <p className="text-xs text-[var(--muted)] mb-3">
          Entity: <strong className="text-[var(--text)]">{company?.name}</strong> · {config.taxIdLabel}: <strong className="text-[var(--text)]">{company?.taxId || company?.gstin}</strong>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Authorized EVC / OTP"
            className="flex-1 h-10 px-3 text-sm tabular font-mono tracking-widest rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <button
            onClick={() => toast.info('Verification OTP sent to authorized signee')}
            className="h-10 px-4 text-sm font-semibold rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-tint)] transition-colors"
          >
            Send OTP
          </button>
        </div>
      </div>

      <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
        <input
          type="checkbox"
          checked={declared}
          onChange={e => setDeclared(e.target.checked)}
          className="mt-0.5 accent-[var(--primary)]"
        />
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my knowledge and belief and nothing has been concealed therefrom. I am authorized to sign and file this statutory return under <span className="text-[var(--primary)] font-semibold">{wizard.statutoryAct}</span>.
        </p>
      </label>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack} disabled={filing}><ChevronLeft size={14} /> Back</Button>
        <Button
          variant="primary"
          icon={filing ? RotateCcw : Send}
          onClick={handleFile}
          disabled={filing}
        >
          {filing ? 'Submitting to Portal…' : `${wizard.fileButtonText} · ${formatCurrency(netPayable)}`}
        </Button>
      </div>
    </div>
  )
}

export default function GstFilingWizard() {
  const [currentStep, setCurrentStep] = useState('review')
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)
  const wizard = COUNTRY_WIZARD_DATA[countryCode] || COUNTRY_WIZARD_DATA.IN

  const stepIdx = STEPS.findIndex(s => s.id === currentStep)
  function next() { if (stepIdx < STEPS.length - 1) setCurrentStep(STEPS[stepIdx + 1].id) }
  function back() { if (stepIdx > 0) setCurrentStep(STEPS[stepIdx - 1].id) }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={wizard.title}
        subtitle={`${wizard.subtitle} · ${wizard.period} (${countryConfig.flag} ${countryConfig.name})`}
        breadcrumb={wizard.breadcrumb}
      />

      {/* Step indicator */}
      <div className="flex items-start gap-0 mb-6 px-2">
        {STEPS.map((step, i) => (
          <StepDot key={step.id} step={step} current={currentStep} index={i} />
        ))}
      </div>

      {/* Step content */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        {currentStep === 'review'   && <StepReview   wizard={wizard} company={activeCompany} config={countryConfig} onNext={next} />}
        {currentStep === 'itc'      && <StepITC      wizard={wizard} onNext={next} onBack={back} />}
        {currentStep === 'ai-check' && <StepAICheck  wizard={wizard} onNext={next} onBack={back} />}
        {currentStep === 'declare'  && <StepDeclare  wizard={wizard} company={activeCompany} config={countryConfig} onBack={back} />}
      </div>
    </div>
  )
}
