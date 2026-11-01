type ProgressBarProps = {
  value: number
  label: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const percentage = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="text-slate-900">{label}</span>
        <span className="text-[#0C70F2]">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="h-1.5 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-[#0C70F2]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
