import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const numberFormat = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
})

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
})

function formatTime(value) {
  return dateTimeFormat.format(new Date(value))
}

function formatMegawatts(value) {
  return `${numberFormat.format(value)} MW`
}

function EmptyChart() {
  return (
    <div className="feedback-state chart-empty">
      <span className="state-symbol empty-symbol" aria-hidden="true">—</span>
      <strong>No January data available</strong>
      <span>The API returned no wind-generation records for January 2026.</span>
    </div>
  )
}

function GenerationChart({ rows }) {
  const chartRows = rows.filter(
    (row) => Number.isFinite(row.forecast) || Number.isFinite(row.actual),
  )

  if (chartRows.length === 0) {
    return <EmptyChart />
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <LineChart data={chartRows} margin={{ top: 12, right: 14, left: 2, bottom: 4 }}>
          <CartesianGrid stroke="#e8eeeb" vertical={false} />
          <XAxis
            dataKey="startTime"
            tickFormatter={(value) => formatTime(value).replace(', ', '\n')}
            minTickGap={38}
            tick={{ fill: '#83918b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            tickFormatter={(value) => numberFormat.format(value)}
            tick={{ fill: '#83918b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={64}
            label={{
              value: 'Generation (MW)',
              angle: -90,
              position: 'insideLeft',
              fill: '#83918b',
              fontSize: 11,
              offset: -4,
              style: { textAnchor: 'middle' },
            }}
          />
          <Tooltip
            labelFormatter={(value) => formatTime(value)}
            formatter={(value, name) => [formatMegawatts(value), name]}
            contentStyle={{
              border: '1px solid #e4ebe7',
              borderRadius: 12,
              boxShadow: '0 12px 30px rgba(20, 44, 33, 0.1)',
              fontSize: 12,
            }}
          />
          <Line
            name="Forecast"
            dataKey="forecast"
            stroke="#18815b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            name="Actual"
            dataKey="actual"
            stroke="#e29a45"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GenerationChart
