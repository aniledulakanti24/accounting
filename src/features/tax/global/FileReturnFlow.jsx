import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, XCircle, Send, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '../../../components/ui/Button'
import { api } from '../../../data/api/client'
import { formatCurrency } from '../../../lib/currency'
import { toast } from '../../../lib/toast'
import { useAppStore } from '../../../store/useAppStore'
import { Chip } from './shared'
import { fmtDate } from './taxUtils'

const STEPS = ['review', 'validate', 'declare', 'ack']

const ISSUE_ICON = {
  ok:    <CheckCircle2 size={14} className="text-[var(--pos)] shrink-0 mt-0.5" />,
  info:  <Info size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />,
  warn:  <AlertTriangle size={14} className="text-[var(--warn)] shrink-0 mt-0.5" />,
  error: <XCircle size={14} className="text-[var(--neg)] shrink-0 mt-0.5" />,
}

export function BoxesTable({ ret }) {
  // Box labels are the official wording of each authority's form, so they stay untranslated
  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--surface-2)] text-left">
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] w-28">Box</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Description</th>
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {ret.boxes.map(b => {
            const isNet = ['net', 'netNoCredit', 'netWithPayg'].includes(b.kind)
            return (
              <tr key={b.box} className={`border-t border-[var(--border)] ${isNet ? 'bg-[var(--primary-tint)]' : ''}`}>
                <td className="px-3 py-2 font-mono text-xs text-[var(--muted)]">{b.box}</td>
                <td className={`px-3 py-2 ${isNet ? 'font-semibold text-[var(--text)]' : 'text-[var(--text)]'}`}>{b.label}</td>
                <td className={`px-3 py-2 text-right tabular ${isNet ? 'font-bold' : ''}`}>{formatCurrency(b.amount)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Step-by-step filing of one return against the mock tax API.
 * onFiled(updatedReturn) is called after a successful submission.
 */
export default function FileReturnFlow({ ret, catalog, onFiled }) {
  const { t } = useTranslation()
  const recordAudit = useAppStore(s => s.recordAudit)
  const [step, setStep] = useState(ret.status === 'filed' ? 3 : 0)
  const [validation, setValidation] = useState(null)
  const [declared, setDeclared] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(ret.status === 'filed' ? ret : null)

  async function runValidation() {
    setBusy(true)
    try {
      const v = await api.post(`/tax/returns/${ret.id}/validate`)
      setValidation(v)
      setStep(1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    setBusy(true)
    try {
      const filed = await api.post(`/tax/returns/${ret.id}/submit`, { declaration: true, filedBy: useAppStore.getState().currentRole })
      setResult(filed)
      setStep(3)
      toast.success(filed.message)
      recordAudit('compliance', `${filed.form} filed`, `${filed.form} for ${filed.periodLabel} submitted to ${filed.authority} (${filed.ackRef}).`, { module: 'Tax' })
      onFiled?.(filed)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2 mb-4">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
              ${i < step ? 'bg-[var(--pos)] text-white' : i === step ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
              {i < step ? '✓' : i + 1}
            </span>
            <span className={`text-xs font-medium ${i === step ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>{t(`tax.steps.${s}`)}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-[var(--border)]" />}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-sm">
        <span className="font-semibold text-[var(--text)]">{ret.name}{ret.jurisdiction ? ` · ${ret.jurisdiction}` : ''}</span>
        <span className="text-[var(--muted)]">{ret.periodLabel}</span>
        <span className="text-[var(--muted)]">Due {fmtDate(ret.dueDate)}</span>
        <Chip status={ret.status === 'filed' || result ? 'filed' : ret.status} />
      </div>

      {step === 0 && (
        <>
          <BoxesTable ret={ret} />
          <div className="flex justify-end mt-4">
            <Button variant="primary" icon={ShieldCheck} onClick={runValidation} disabled={busy}>
              {busy ? t('tax.validating') : t('tax.runValidation')}
            </Button>
          </div>
        </>
      )}

      {step === 1 && validation && (
        <>
          <ul className="space-y-2">
            {validation.issues.map((issue, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--text)]">{ISSUE_ICON[issue.level]}<span>{issue.message}</span></li>
            ))}
          </ul>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => setStep(0)}>{t('common.back')}</Button>
            <Button variant="primary" onClick={() => setStep(2)} disabled={!validation.canFile}>{t('common.continue')}</Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-sm text-[var(--text)] mb-3">
            {t('tax.netAmount')}: <strong className="tabular">{formatCurrency(ret.netPayable)}</strong>
            {ret.netPayable < 0 ? ' (refund / credit claimed)' : ' payable'} · submitted via {catalog?.portal}
          </div>
          <label className="flex items-start gap-2 text-sm text-[var(--text)] cursor-pointer">
            <input type="checkbox" className="mt-1" checked={declared} onChange={e => setDeclared(e.target.checked)} />
            <span>{t('tax.declaration', { authority: ret.authority })}</span>
          </label>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => setStep(1)}>{t('common.back')}</Button>
            <Button variant="primary" icon={Send} onClick={submit} disabled={!declared || busy}>
              {busy ? t('tax.submitting') : t('tax.submit', { form: ret.form })}
            </Button>
          </div>
        </>
      )}

      {step === 3 && result && (
        <div className="p-4 rounded-[var(--radius-sm)] border border-[var(--pos)] bg-[var(--pos-tint)]">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--pos)] mb-2"><CheckCircle2 size={16} /> {t('tax.submitted')}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-[var(--muted)]">{t('tax.steps.ack')}</dt><dd className="font-mono text-[var(--text)]">{result.ackRef}</dd>
            <dt className="text-[var(--muted)]">{t('tax.filedOn')}</dt><dd className="text-[var(--text)]">{fmtDate(result.filedAt)}</dd>
            <dt className="text-[var(--muted)]">{t('tax.col.authority')}</dt><dd className="text-[var(--text)]">{result.authority}</dd>
            <dt className="text-[var(--muted)]">{t('tax.netAmount')}</dt><dd className="tabular text-[var(--text)]">{formatCurrency(result.netPayable)}</dd>
          </dl>
        </div>
      )}
    </div>
  )
}
