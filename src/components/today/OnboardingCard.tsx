// 처음 쓰는 사람에게 보여주는 시작 안내 — 설치 파일 내려받기, 플러그인 로그인, 볼트 폴더 정하기. 닫으면 다시 안 뜬다
import { Sparkles } from 'lucide-react'
import { INSTALLER_URL } from '../../lib/installer.ts'
import { onboardingStore } from '../../lib/stores.ts'
import { useStore } from '../../hooks/useStore.ts'
import { useLayout } from '../layout/layoutContext.ts'

export default function OnboardingCard() {
  const [state, setState] = useStore(onboardingStore)
  const { openSettings } = useLayout()
  if (state.dismissed) return null

  return (
    <section className="rounded-lg border bg-surface-container-lowest p-5 shadow-card">
      <div className="flex items-center gap-2 text-headline-sm">
        <Sparkles size={18} strokeWidth={1.75} className="text-icon" />
        처음 오셨다면
      </div>
      <p className="mt-1 text-body-md text-on-surface-variant">
        여기서 쓴 메모를 Obsidian 노트로 받으려면 세 가지만 해 두면 돼요.
      </p>
      <ol className="mt-4 space-y-3">
        <li className="flex items-center justify-between gap-3">
          <span className="text-body-md">
            <b className="mr-2 font-semibold tabular-nums">1</b>Mac에서 설치 파일을 받아 실행하기
            <span className="mt-0.5 block text-body-sm text-on-surface-variant">
              열리지 않으면 시스템 설정의 개인정보 보호 및 보안에서 '그래도 열기'를 눌러 주세요.
            </span>
          </span>
          <a
            href={INSTALLER_URL}
            download
            className="flex h-8 shrink-0 items-center rounded border border-field-border px-3 text-label-md text-primary-container transition-colors hover:bg-hover-soft"
          >
            내려받기
          </a>
        </li>
        <li className="text-body-md">
          <b className="mr-2 font-semibold tabular-nums">2</b>Obsidian을 다시 열고 Personal Hub 설정에서 로그인하기
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-body-md">
            <b className="mr-2 font-semibold tabular-nums">3</b>설정에서 메모를 저장할 볼트 폴더 이름 적기
          </span>
          <button
            type="button"
            onClick={openSettings}
            className="h-8 shrink-0 rounded border border-field-border px-3 text-label-md text-primary-container transition-colors hover:bg-hover-soft"
          >
            설정 열기
          </button>
        </li>
      </ol>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setState({ dismissed: true })}
          className="h-8 rounded px-3 text-label-md text-on-surface-variant transition-colors hover:bg-hover"
        >
          다 했어요, 닫기
        </button>
      </div>
    </section>
  )
}
