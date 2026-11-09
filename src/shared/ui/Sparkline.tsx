type SparklineProps = {
  values: number[]
  label: string
}

export function Sparkline({ values, label }: SparklineProps) {
  const samples = values.filter(Number.isFinite)
  if (samples.length === 0) return null

  const minimum = Math.min(...samples)
  const maximum = Math.max(...samples)
  const range = maximum - minimum
  const points = samples.map((value, index) => {
    const x = samples.length === 1 ? 50 : 2 + (index / (samples.length - 1)) * 96
    const y = range === 0 ? 16 : 30 - ((value - minimum) / range) * 28
    return `${x},${y}`
  }).join(' ')

  return (
    <svg role="img" aria-label={label} viewBox="0 0 100 32" className="h-7 w-12 shrink-0">
      {samples.length === 1 ? (
        <circle cx="50" cy="16" r="2" fill="currentColor" />
      ) : (
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  )
}
