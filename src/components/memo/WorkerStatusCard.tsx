// 맥북 프로그램(워커) 연결 상태 — 꺼져 있으면 AI 정제를 못 쓰는 이유를 알려준다
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
          맥북 프로그램
          <span className={`size-2 rounded-full ${online ? 'bg-science' : 'bg-outline'}`} />
          <span className={`text-label-md ${online ? 'text-science' : 'text-on-surface-variant'}`}>{online ? '켜짐' : '꺼짐'}</span>
        </p>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">
          {online
            ? 'AI로 정제한 메모를 바로 노트로 만들 수 있어요.'
            : '지금은 AI 정제를 쓸 수 없어요. 그대로 저장한 메모는 맥북에서 Obsidian을 열면 노트가 돼요.'}
        </p>
      </div>
    </section>
  )
}
