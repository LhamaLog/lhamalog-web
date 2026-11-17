type RankingListProps = {
  locale?: string
  items: { id: string; label: string; value: number; formattedValue?: string; color?: 'blue' | 'red' | 'amber' | 'lightBlue' }[]
}

const barColors = { blue: 'bg-[#0C70F2]', red: 'bg-red-600', amber: 'bg-amber-500', lightBlue: 'bg-blue-400' }

export function RankingList({ items, locale = 'pt-BR' }: RankingListProps) {
  const values = items.map((item) => ({
    ...item,
    value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
  }))
  const maximum = values.reduce((largest, item) => Math.max(largest, item.value), 0)

  return (
    <ol className="space-y-2">
      {values.map((item, index) => (
        <li key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_minmax(2rem,0.8fr)_auto] items-center gap-2 text-xs">
          <span aria-hidden="true" className="flex h-4 min-w-4 items-center justify-center rounded bg-blue-50 px-1 text-[10px] font-bold text-[#0C70F2]">
            {index + 1}
          </span>
          <span className="truncate text-slate-900" title={item.label}>{item.label}</span>
          <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span className={`block h-full rounded-full ${barColors[item.color ?? 'blue']}`} style={{ width: `${maximum > 0 ? (item.value / maximum) * 100 : 0}%` }} />
          </span>
          <span className="text-right font-bold tabular-nums text-[#083B7A]">
            {item.formattedValue ?? item.value.toLocaleString(locale)}
          </span>
        </li>
      ))}
    </ol>
  )
}
