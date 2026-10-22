import { Avatar } from './Avatar'

type UserIdentityProps = {
  name: string
  role: string
}

export function UserIdentity({ name, role }: UserIdentityProps) {
  return (
    <div className="inline-flex min-w-0 max-w-64 items-center gap-2">
      <span aria-hidden="true" className="inline-flex shrink-0">
        <Avatar name={name} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-[#083B7A]" title={name}>
          {name}
        </p>
        <p className="truncate text-[11px] text-slate-500" title={role}>
          {role}
        </p>
      </div>
    </div>
  )
}
