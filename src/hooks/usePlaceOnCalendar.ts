// 할 일을 캘린더에 배치하고, 알림 막대의 '일정 보기'나 이미 있던 일정으로 이동한다
import { useNavigate } from 'react-router'
import { fromUtc, toDateKey } from '../lib/date.ts'
import { eventsStore } from '../lib/stores.ts'
import { showToast } from '../lib/toast.ts'
import { todoActions } from './useTodos.ts'

export function usePlaceOnCalendar() {
  const navigate = useNavigate()
  return (todoId: string) => {
    const already = eventsStore.get().some((e) => e.todoId === todoId)
    const eventId = todoActions.placeOnCalendar(todoId)
    const event = eventsStore.get().find((e) => e.id === eventId)
    if (!event) return
    const go = () => navigate(`/calendar?date=${toDateKey(fromUtc(event.start))}&event=${event.id}`)
    if (already) go()
    else showToast('캘린더에 배치했어요', '일정 보기', go)
  }
}
