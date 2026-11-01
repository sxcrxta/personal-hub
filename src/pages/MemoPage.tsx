// 메모 화면(/memo) — 이 서비스의 핵심. 'Obsidian 메모'와 '단순 메모장' 두 탭 (?tab=notepad)
import { Info } from 'lucide-react'
import { useSearchParams } from 'react-router'
import MemoComposer from '../components/memo/MemoComposer.tsx'
import NotepadTab from '../components/memo/NotepadTab.tsx'
import RecentMemos from '../components/memo/RecentMemos.tsx'
import WorkerStatusCard from '../components/memo/WorkerStatusCard.tsx'
import { useWorkerOnline } from '../hooks/useMemos.ts'
import { useStore } from '../hooks/useStore.ts'
import { memosStore } from '../lib/stores.ts'

export default function MemoPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'notepad' ? 'notepad' : 'obsidian'
  const [memos] = useStore(memosStore)
  const workerOnline = useWorkerOnline()

  const tabs = [
    { id: 'obsidian', label: 'Obsidian 메모', sub: '볼트로 보내기' },
    { id: 'notepad', label: '단순 메모장', sub: '앱 안에만' },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      {/* 폰에서는 상단바에 화면 이름이 있어서 숨긴다 */}
      <header className="hidden items-baseline gap-3 md:flex">
        <h1 className="text-display-hero-mobile md:text-display-hero">메모</h1>
      </header>

      <div role="tablist" className="flex gap-6 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'obsidian' ? {} : { tab: t.id })}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-3 ${
              tab === t.id ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="text-headline-sm">{t.label}</span>
            <span className="hidden text-body-sm text-on-surface-variant sm:inline">{t.sub}</span>
          </button>
        ))}
      </div>

      {tab === 'obsidian' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <WorkerStatusCard online={workerOnline} />
            <MemoComposer />
            <section className="flex gap-3 rounded-lg border bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
              <Info size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <p>
                메모는 먼저 서버에 남아요. Obsidian이 열려 있으면 플러그인이 가져가 볼트 노트로 만들고, 닫혀 있어도 메모는 안전하게 기다려요.
              </p>
            </section>
          </div>
          <RecentMemos memos={memos} />
        </div>
      ) : (
        <NotepadTab />
      )}
    </div>
  )
}
