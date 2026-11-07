import { Link } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import { useAppStore } from '../../../store/useAppStore'
import { getCountryTaxConfig } from '../../../lib/countryTax'

/**
 * Renders the India-specific page for Indian companies and the
 * jurisdiction-driven page (backed by the mock tax API) for every other country.
 */
export default function CountryTaxRoute({ india: IndiaPage, global }) {
  const country = useAppStore(s => s.activeCompany?.country || 'IN')
  if (country === 'IN') return IndiaPage ? <IndiaPage /> : null
  return global ?? <NotApplicable />
}

export function NotApplicable({ feature = 'This feature' }) {
  const country = useAppStore(s => s.activeCompany?.country || 'IN')
  const config = getCountryTaxConfig(country)
  return (
    <div>
      <PageHeader title="Not applicable" breadcrumb={['Tax']} />
      <div className="flex items-start gap-3 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-sm">
        <Globe2 size={18} className="text-[var(--primary)] mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-[var(--text)]">{feature} does not apply in {config.flag} {config.name}.</p>
          <p className="text-[var(--muted)] mt-1">
            The tax menu only shows what applies under {config.taxSystemName}.{' '}
            <Link to="/tax/gst-returns" className="text-[var(--primary)]">Go to returns</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
