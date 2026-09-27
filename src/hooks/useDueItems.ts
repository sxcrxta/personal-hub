// 오늘 화면의 기한별 항목을 만들고, 체크하면 원래 데이터(할 일·공부 항목·수행평가)를 고친다
import { useMemo } from 'react'
import { collectDueItems, groupByBucket, type DueItem } from '../lib/due.ts'
import { assignmentsStore, eventsStore, examsStore, todosStore } from '../lib/stores.ts'
import { useStore } from './useStore.ts'

export function useDueItems() {
  const [events] = useStore(eventsStore)
  const [todos, setTodos] = useStore(todosStore)
  const [exams, setExams] = useStore(examsStore)
  const [assignments, setAssignments] = useStore(assignmentsStore)

  const groups = useMemo(
    () => groupByBucket(collectDueItems({ events, todos, exams, assignments })),
    [events, todos, exams, assignments],
  )

  // 가장 가까운(아직 안 지난) 시험
  const nextExam = useMemo(() => {
    const items = collectDueItems({ events: [], todos: [], exams, assignments: [] })
    return items.filter((i) => i.kind === 'exam' && i.days >= 0).sort((a, b) => a.days - b.days)[0]
  }, [exams])

  function toggle(item: DueItem) {
    const ref = item.ref
    if (ref.kind === 'todo') {
      setTodos((prev) => prev.map((t) => (t.id === ref.id ? { ...t, done: !t.done } : t)))
    } else if (ref.kind === 'assignment') {
      setAssignments((prev) => prev.map((a) => (a.id === ref.id ? { ...a, done: !a.done } : a)))
    } else if (ref.kind === 'study') {
      setExams((prev) =>
        prev.map((exam) =>
          exam.id !== ref.examId
            ? exam
            : {
                ...exam,
                subjects: exam.subjects.map((s) =>
                  s.id !== ref.subjectId
                    ? s
                    : { ...s, items: s.items.map((i) => (i.id === ref.itemId ? { ...i, done: !i.done } : i)) },
                ),
              },
        ),
      )
    }
  }

  return { groups, nextExam, toggle }
}
