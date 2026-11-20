// 설정 창의 테마 칸 — 기기 설정 따라가기 / 밝게 / 어두운 테마 세 가지 중에 고른다. 고르면 바로 바뀌고 계정에 저장된다
import { Check } from 'lucide-react'
import { useStore } from '../../hooks/useStore.ts'
import { themeStore } from '../../lib/profile.ts'
import { SYSTEM_DARK, THEME_CHOICES, THEME_SWATCH, type AppliedTheme } from '../../lib/themeRules.ts'

/** 테마 바탕·카드·글자 색을 작게 보여 주는 동그라미. 기기 설정 따라가기는 밝게와 밤 남색을 반씩 */
function Swatch({ themes }: { themes: AppliedTheme[] }) {
  return (
    <span className="flex size-9 shrink-0 overflow-hidden rounded-full border">
      {themes.map((t) => {
        const c = THEME_SWATCH[t]
        return (
          <span key={t} className="flex flex-1 items-center justify-center" style={{ background: c.background }}>
            {/* 바탕 위의 작은 카드와 글자 한 줄 */}
            <span className="flex h-3.5 w-4 items-center justify-center rounded-sm" style={{ background: c.card }}>
              <span className="h-0.5 w-2.5 rounded-full" style={{ background: c.text }} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

export default function ThemeSettings() {
  const [{ theme }, setTheme] = useStore(themeStore)

  return (
    <section className="space-y-3">
      <h3 className="text-headline-sm">테마</h3>
      <div role="radiogroup" aria-label="테마" className="grid gap-2 sm:grid-cols-2">
        {THEME_CHOICES.map((t) => {
          const selected = t.id === theme
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme({ theme: t.id })}
              className={`flex items-center gap-3 rounded border p-2.5 text-left transition-colors ${
                selected ? 'border-primary-container bg-surface-container-low' : 'hover:bg-hover-soft'
              }`}
            >
              <Swatch themes={t.id === 'system' ? ['light', SYSTEM_DARK] : [t.id]} />
              <span className="min-w-0 flex-1">
                <span className="block text-body-md font-medium">{t.label}</span>
                <span className="block text-body-sm text-on-surface-variant">{t.description}</span>
              </span>
              {selected && <Check size={16} strokeWidth={2} className="shrink-0 text-primary-container" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
