import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Input } from './Input'

type PasswordInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'endAction'
>

export function PasswordInput({
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      {...props}
      disabled={disabled}
      type={visible ? 'text' : 'password'}
      endAction={
        <button
          type="button"
          disabled={disabled}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-controls={props.id}
          onClick={() => setVisible(!visible)}
          className="
            flex h-8 w-8 items-center justify-center
            rounded text-slate-400
            hover:text-slate-600
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[#0C70F2]
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />

            {!visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      }
    />
  )
}