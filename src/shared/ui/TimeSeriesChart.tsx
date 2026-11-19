export type TimeSeriesChartSeries = {
  id: string
  label: string
  color: string
  values: number[]
}

export type TimeSeriesChartProps = {
  labels: string[]
  series: TimeSeriesChartSeries[]
  ariaLabel: string
  occurrences?: number[]
  occurrencesPending?: boolean
  occurrencesPendingMessage?: string
  occurrencesLegendLabel?: string
}

function buildPath(values: number[], width: number, height: number, max: number): string {
  if (values.length === 0) return ''
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
    const y = max <= 0 ? height : height - (value / max) * height
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

export function TimeSeriesChart({
  labels,
  series,
  ariaLabel,
  occurrences,
  occurrencesPending = true,
  occurrencesPendingMessage = 'não implementado ainda',
  occurrencesLegendLabel = 'Ocorrências',
}: TimeSeriesChartProps) {
  const width = 640
  const height = 180
  const samples = series.flatMap((item) => item.values.filter(Number.isFinite))
  const occurrenceValues = occurrencesPending ? [] : (occurrences ?? []).filter(Number.isFinite)
  const max = Math.max(1, ...samples, ...occurrenceValues)

  return (
    <div className="space-y-3">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height + 28}`}
        className="h-56 w-full"
      >
        <line x1="0" y1={height} x2={width} y2={height} stroke="#E2E8F0" strokeWidth="1" />
        {series.map((item) => (
          <path
            key={item.id}
            d={buildPath(item.values, width, height, max)}
            fill="none"
            stroke={item.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {!occurrencesPending && occurrenceValues.length > 0 && (
          <path
            d={buildPath(occurrenceValues, width, height, max)}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {labels.length > 0 && (
          <>
            <text x="0" y={height + 18} className="fill-slate-500 text-[10px]">{labels[0]}</text>
            <text x={width} y={height + 18} textAnchor="end" className="fill-slate-500 text-[10px]">
              {labels[labels.length - 1]}
            </text>
          </>
        )}
      </svg>
      <ul className="flex flex-wrap gap-4 text-xs text-slate-600">
        {series.map((item) => (
          <li key={item.id} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-2 w-4 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
        <li className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-4 rounded-full bg-violet-600" />
          <span>
            {occurrencesLegendLabel}
            {occurrencesPending ? `: ${occurrencesPendingMessage}` : ''}
          </span>
        </li>
      </ul>
    </div>
  )
}
