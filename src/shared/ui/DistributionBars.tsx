type DistributionBarsProps = {
  items: {
    label: string
    value: number
    color?: 'blue' | 'amber' | 'navy'
  }[]
}

const colors = {
  blue: 'bg-[#0C70F2]',
  amber: 'bg-amber-500',
  navy: 'bg-[#083B7A]',
}

export function DistributionBars({ items }: DistributionBarsProps) {
  const values = items.map((item) => ({
    ...item,
    value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
  }))
  const maximum = values.reduce((largest, item) => Math.max(largest, item.value), 0)

  return (
    <dl className="space-y-3">
      {values.map((item, index) => {
        const color = colors[item.color ?? 'blue']
        const width = maximum > 0 ? (item.value / maximum) * 100 : 0

        return (
          <div key={`${index}-${item.label}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 text-xs">
            <dt className="flex min-w-0 items-center gap-2 text-slate-900">
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
              <span className="break-words">{item.label}</span>
            </dt>
            <dd className="col-span-2 grid grid-cols-subgrid items-center">
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <span className={`block h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
              </span>
              <span className="text-right font-bold tabular-nums text-[#083B7A]">
                {item.value.toLocaleString('pt-BR')}
              </span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
