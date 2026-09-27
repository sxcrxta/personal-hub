// 오늘 화면(/today) — 앱을 열면 가장 먼저 보는 곳. 시작 안내, 예전 노트, 기한별 할 것을 모아 보여준다
import DueBoard from '../components/today/DueBoard.tsx'
import OnboardingCard from '../components/today/OnboardingCard.tsx'
import ResurfaceNoteCard from '../components/today/ResurfaceNoteCard.tsx'
import TodayHeader from '../components/today/TodayHeader.tsx'
import { useDueItems } from '../hooks/useDueItems.ts'

export default function TodayPage() {
  const { groups, nextExam, toggle } = useDueItems()

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <TodayHeader groups={groups} nextExam={nextExam} />
      <OnboardingCard />
      <ResurfaceNoteCard />
      <DueBoard groups={groups} onToggle={toggle} />
    </div>
  )
}
