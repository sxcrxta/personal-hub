// 공용 체크박스 — 18px, 체크하면 진한 슬레이트로 채워진다
import { Check } from 'lucide-react'

type Props = {
  checked: boolean
  onChange: () => void
  label: string // 화면 읽기 프로그램용 이름
}

export default function Checkbox({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-sm border transition-colors ${
        checked ? 'border-primary-container bg-primary-container text-on-primary' : 'border-field-border bg-surface-container-lowest hover:border-icon'
      }`}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </button>
  )
}
