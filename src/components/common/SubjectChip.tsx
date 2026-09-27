// 과목·카테고리 칩 — 이름에 맞는 파스텔 색을 자동으로 붙인다
import { paletteOf, type Palette } from '../../lib/subjectColor.ts'

const CLASSES: Record<Palette, string> = {
  math: 'bg-math-bg text-math border-math/25',
  science: 'bg-science-bg text-science border-science/25',
  korean: 'bg-korean-bg text-korean border-korean/25',
  english: 'bg-english-bg text-english border-english/25',
  social: 'bg-social-bg text-social border-social/25',
}

export default function SubjectChip({ name }: { name: string }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-label-md ${CLASSES[paletteOf(name)]}`}>
      {name}
    </span>
  )
}
