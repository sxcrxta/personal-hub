// 입력칸 공용 모양 — 이름표 + 입력칸. 창(Dialog) 안의 폼에서 쓴다
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export const inputClass =
  'h-[38px] w-full rounded border border-field-border bg-surface-container-lowest px-3 text-body-md placeholder:text-placeholder focus:border-icon focus:ring-2 focus:ring-hover focus:outline-none'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-label-md text-on-surface-variant">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} h-auto min-h-24 py-2 leading-[22px] ${props.className ?? ''}`}
    />
  )
}
