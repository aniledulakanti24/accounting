import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCompact } from '../../lib/currency'

const COLORS = [
  '#5b5bef', '#16a34a', '#d97706', '#e11d48',
  '#0891b2', '#7c3aed', '#059669', '#dc2626',
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3 shadow-lg text-xs">
      <p className="text-[var(--text)] font-semibold mb-1">{d.name}</p>
      <p className="tabular text-[var(--muted)]">{formatCompact(d.value)}</p>
    </div>
  )
}

/**
 * DistributionChart — donut/pie for top debtors/creditors, expense categories, etc.
 * data: [{ name: string, value: number }]
 */
export default function DistributionChart({
  data = [],
  height = 220,
  innerRadius = 60,
  outerRadius = 90,
  showLegend = true,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }}
            iconType="circle"
            iconSize={8}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}
