// 마감 알약 — 지났으면 빨강, 3일 안이면 주황, 그 밖은 회색
type Props = { dday: string; text: string; days: number }

export default function DueChip({ dday, text, days }: Props) {
  const tone =
    days < 0
      ? 'border-due-overdue/25 bg-urgent-bg text-due-overdue'
      : days <= 3
        ? 'border-due-soon/25 bg-social-bg text-due-soon'
        : 'border-outline-variant bg-surface-container-low text-on-surface-variant'
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2 text-label-md tabular-nums ${tone}`}>
      {dday} · {text}
    </span>
  )
}
