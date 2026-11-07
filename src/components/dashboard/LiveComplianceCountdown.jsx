import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, ChevronRight, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { getCountryTaxConfig } from '../../lib/countryTax'

const COUNTRY_DEADLINES = {
  IN: [
    { label: 'GSTR-1 Dec Outward', category: 'GST', hoursFromNow: 11 * 24 + 4, href: '/tax/gst-returns' },
    { label: 'TDS Q3 Deposit', category: 'TDS', hoursFromNow: 18 * 24 + 9, href: '/tax/tds' },
    { label: 'GSTR-3B Dec Return', category: 'GST', hoursFromNow: 21 * 24 + 2, href: '/tax/gst-returns' },
    { label: 'Advance Tax Q3', category: 'ADV', hoursFromNow: 34 * 24 + 14, href: '/tax/tax-payments' },
  ],
  US: [
    { label: 'State Sales Tax Remittance', category: 'Sales Tax', hoursFromNow: 12 * 24 + 6, href: '/tax/gst-returns' },
    { label: 'Form 1099-NEC Filing', category: '1099', hoursFromNow: 19 * 24 + 2, href: '/tax/tds' },
    { label: 'Form 941 Quarterly Payroll', category: 'IRS', hoursFromNow: 25 * 24 + 8, href: '/tax/gst-returns' },
    { label: 'County Local Tax Return', category: 'Local', hoursFromNow: 33 * 24 + 11, href: '/tax/tax-payments' },
  ],
  GB: [
    { label: 'HMRC MTD 9-Box VAT Return', category: 'MTD VAT', hoursFromNow: 9 * 24 + 5, href: '/tax/gst-returns' },
    { label: 'PAYE / NIC RTI Submission', category: 'Payroll', hoursFromNow: 16 * 24 + 12, href: '/tax/tds' },
    { label: 'VAT Reverse Charge Audit', category: 'VAT', hoursFromNow: 24 * 24 + 3, href: '/tax/gst-returns' },
    { label: 'Corporation Tax CT600 Review', category: 'HMRC', hoursFromNow: 36 * 24 + 18, href: '/tax/tax-payments' },
  ],
  AE: [
    { label: 'FTA VAT 201 Return Q4', category: 'FTA VAT', hoursFromNow: 14 * 24 + 8, href: '/tax/gst-returns' },
    { label: 'Customs Bill of Entry BOE', category: 'Customs', hoursFromNow: 20 * 24 + 4, href: '/tax/tds' },
    { label: 'Emirate Sales Allocation Audit', category: 'FTA VAT', hoursFromNow: 28 * 24 + 10, href: '/tax/gst-returns' },
    { label: 'Corporate Tax Registration', category: 'MoF', hoursFromNow: 40 * 24 + 15, href: '/tax/tax-payments' },
  ],
}

function tokenCfg(secs) {
  const days = Math.floor(secs / 86400)
  if (days <= 3)  return { color: 'var(--neg)',  bg: 'var(--neg-tint)',  ring: '#EF4444', urgent: true  }
  if (days <= 10) return { color: 'var(--warn)', bg: 'var(--warn-tint)', ring: '#F59E0B', urgent: false }
  return               { color: 'var(--pos)',  bg: 'var(--pos-tint)',  ring: '#22C55E', urgent: false }
}

function decompose(secs) {
  return {
    d: Math.floor(secs / 86400),
    h: Math.floor((secs % 86400) / 3600),
    m: Math.floor((secs % 3600) / 60),
    s: secs % 60,
  }
}

function pad(n) { return String(n).padStart(2, '0') }

export default function LiveComplianceCountdown() {
  const navigate = useNavigate()
  const activeCompany = useAppStore(s => s.activeCompany)
  const countryCode = activeCompany?.country || 'IN'
  const countryConfig = getCountryTaxConfig(countryCode)

  const deadlines = useMemo(() => COUNTRY_DEADLINES[countryCode] || COUNTRY_DEADLINES.IN, [countryCode])

  /* compute target timestamps */
  const targets = useMemo(() => {
    const now = Date.now()
    return deadlines.map(d => now + d.hoursFromNow * 3_600_000)
  }, [deadlines])

  const calc = () => targets.map(t => Math.max(0, Math.floor((t - Date.now()) / 1000)))
  const [remaining, setRemaining] = useState(calc)

  useEffect(() => {
    setRemaining(calc())
    const id = setInterval(() => setRemaining(calc()), 1000)
    return () => clearInterval(id)
  }, [targets])

  return (
    <div
      className="bg-[var(--surface)] rounded-[var(--radius)] border border-[var(--border)] p-5 flex flex-col"
      style={{ boxShadow: 'var(--shadow)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock size={13} style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-bold text-[var(--text)]">{countryConfig.taxSystem} Statutory Countdown</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--pos)' }}>
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: 'var(--pos)', animation: 'pulse 1.5s infinite' }}
          />
          Live
        </span>
      </div>

      {/* Deadline rows */}
      <div className="space-y-2.5">
        {deadlines.map((dl, i) => {
          const secs = remaining[i] ?? 0
          const tc   = tokenCfg(secs)
          const { d, h, m, s } = decompose(secs)

          return (
            <button
              key={dl.label}
              onClick={() => navigate(dl.href)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all hover:shadow-sm active:scale-[0.99]"
              style={{ background: tc.bg, borderColor: tc.ring + '40' }}
            >
              {/* Category badge */}
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: tc.color, color: '#fff' }}
              >
                {dl.category}
              </span>

              {/* Label */}
              <span className="text-xs font-semibold text-[var(--text)] flex-1 truncate">
                {dl.label}
              </span>

              {/* Countdown timer */}
              <div className="flex items-center gap-1 tabular font-mono text-xs font-bold" style={{ color: tc.color }}>
                {d > 0 && <span>{d}d</span>}
                <span>{pad(h)}h</span>
                <span>{pad(m)}m</span>
                <span className="text-[10px] opacity-75">{pad(s)}s</span>
              </div>

              <ChevronRight size={13} className="text-[var(--faint)] flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
