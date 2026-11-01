// Obsidian 플러그인 연결 상태 — 꺼져 있어도 저장은 되고, 메모가 언제 노트가 되는지 알려준다
import { Laptop } from 'lucide-react'

export default function WorkerStatusCard({ online }: { online: boolean }) {
  return (
    <section
      className={`flex items-start gap-3 rounded-lg border border-l-[3px] bg-surface-container-lowest p-4 shadow-card ${
        online ? 'border-l-science' : 'border-l-outline-variant'
      }`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded bg-surface-container-low text-icon">
        <Laptop size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-headline-sm">
          Obsidian 연결
          <span className={`size-2 rounded-full ${online ? 'bg-science' : 'bg-outline'}`} />
          <span className={`text-label-md ${online ? 'text-science' : 'text-on-surface-variant'}`}>{online ? '켜짐' : '꺼짐'}</span>
        </p>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">
          {online
            ? '저장한 메모가 1분 안에 처리되기 시작해요. AI 정제는 몇 분 더 걸릴 수 있어요.'
            : '지금 저장해도 돼요. Obsidian이 열리면 순서대로 노트가 돼요.'}
        </p>
      </div>
    </section>
  )
}
