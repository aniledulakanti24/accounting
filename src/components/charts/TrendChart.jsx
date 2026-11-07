import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { formatCompact } from '../../lib/currency'

/**
 * TrendChart — line/area/bar chart for cash-flow, P&L, etc.
 * type: 'area' | 'bar'
 * data: [{ label: string, ...series }]
 * series: [{ key, label, color }]
 */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] p-3 shadow-lg text-xs">
      <p className="text-[var(--muted)] font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-[var(--muted)]">{p.name}</span>
          </span>
          <span className="tabular font-medium text-[var(--text)]">{formatCompact(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({
  data = [],
  series = [],
  type = 'area',
  height = 220,
  showLegend = true,
  showGrid = true,
}) {
  const Chart = type === 'bar' ? BarChart : AreaChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--faint)', fontFamily: 'Plus Jakarta Sans' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCompact}
          tick={{ fontSize: 11, fill: 'var(--faint)', fontFamily: 'IBM Plex Mono' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }}
            iconType="circle"
            iconSize={8}
          />
        )}
        {type === 'area'
          ? series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                fill={`${s.color}18`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: s.color }}
                isAnimationActive={false}
              />
            ))
          : series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                isAnimationActive={false}
              />
            ))
        }
      </Chart>
    </ResponsiveContainer>
  )
}
