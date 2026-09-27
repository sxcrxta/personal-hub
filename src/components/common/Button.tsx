// 공용 버튼 — 주요(진한 바탕) / 보조(테두리) / 조용한(바탕 없음) / 위험(빨간 글자) 네 가지
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-button text-on-primary hover:bg-primary-container',
  secondary: 'border border-field-border text-primary-container hover:bg-hover-soft',
  ghost: 'text-on-surface-variant hover:bg-hover',
  danger: 'text-error hover:bg-error-container/50',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'md' | 'sm'
}

export default function Button({ variant = 'secondary', size = 'md', className = '', ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        size === 'md' ? 'h-[38px] px-4 text-body-md' : 'h-8 px-3 text-label-md'
      } ${VARIANT[variant]} ${className}`}
    />
  )
}
