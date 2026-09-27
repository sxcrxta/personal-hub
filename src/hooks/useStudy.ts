// 시험·과목·공부 항목·수행평가 읽고 쓰기 — 공부 항목을 캘린더에 배치하는 것까지
import type { Assignment, Exam, ExamSubject, StudyItem, StudyRef } from '../types/data.ts'
import { nextFullHour, now, toUtc } from '../lib/date.ts'
import { newId, type Store } from '../lib/storage.ts'
import { assignmentsStore, eventsStore, examsStore } from '../lib/stores.ts'
import { withUndo } from './undo.ts'
import { useStore } from './useStore.ts'

export function useExams() {
  const [exams] = useStore(examsStore)
  return exams
}

export function useAssignments() {
  const [assignments] = useStore(assignmentsStore)
  return assignments
}

function mapSubject(examId: string, subjectId: string, change: (s: ExamSubject) => ExamSubject) {
  examsStore.set((prev) =>
    prev.map((exam) =>
      exam.id !== examId ? exam : { ...exam, subjects: exam.subjects.map((s) => (s.id === subjectId ? change(s) : s)) },
    ),
  )
}

export const examActions = {
  addExam(exam: Omit<Exam, 'id' | 'subjects'>): string {
    const id = newId()
    examsStore.set((prev) => [...prev, { ...exam, id, subjects: [] }])
    return id
  },
  updateExam(id: string, patch: Partial<Exam>) {
    examsStore.set((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  },
  removeExam(id: string) {
    withUndo('시험을 지웠어요', [examsStore, eventsStore] as Store<unknown>[], () => {
      examsStore.set((prev) => prev.filter((e) => e.id !== id))
      eventsStore.set((prev) => prev.filter((e) => e.studyRef?.examId !== id))
    })
  },

  addSubject(examId: string, subject: Omit<ExamSubject, 'id' | 'items'>) {
    examsStore.set((prev) =>
      prev.map((e) => (e.id === examId ? { ...e, subjects: [...e.subjects, { ...subject, id: newId(), items: [] }] } : e)),
    )
  },
  updateSubject(examId: string, subjectId: string, patch: Partial<ExamSubject>) {
    mapSubject(examId, subjectId, (s) => ({ ...s, ...patch }))
  },
  removeSubject(examId: string, subjectId: string) {
    withUndo('과목을 지웠어요', [examsStore, eventsStore] as Store<unknown>[], () => {
      examsStore.set((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, subjects: e.subjects.filter((s) => s.id !== subjectId) } : e)),
      )
      eventsStore.set((prev) => prev.filter((e) => e.studyRef?.subjectId !== subjectId))
    })
  },

  addItem(examId: string, subjectId: string, title: string, planDate?: string) {
    mapSubject(examId, subjectId, (s) => ({ ...s, items: [...s.items, { id: newId(), title, done: false, planDate }] }))
  },
  updateItem(ref: StudyRef, patch: Partial<StudyItem>) {
    mapSubject(ref.examId, ref.subjectId, (s) => ({
      ...s,
      items: s.items.map((i) => (i.id === ref.itemId ? { ...i, ...patch } : i)),
    }))
    if (patch.title !== undefined) {
      const title = patch.title
      eventsStore.set((prev) => prev.map((e) => (e.studyRef?.itemId === ref.itemId ? { ...e, title } : e)))
    }
  },
  toggleItem(ref: StudyRef) {
    mapSubject(ref.examId, ref.subjectId, (s) => ({
      ...s,
      items: s.items.map((i) => (i.id === ref.itemId ? { ...i, done: !i.done } : i)),
    }))
  },
  removeItem(ref: StudyRef) {
    withUndo('공부 항목을 지웠어요', [examsStore, eventsStore] as Store<unknown>[], () => {
      mapSubject(ref.examId, ref.subjectId, (s) => ({ ...s, items: s.items.filter((i) => i.id !== ref.itemId) }))
      eventsStore.set((prev) => prev.filter((e) => e.studyRef?.itemId !== ref.itemId))
    })
  },

  /** 공부 항목들을 오늘 다음 정각부터 1시간씩 이어서 캘린더에 올린다. 이미 올린 것은 건너뛴다. 새로 올린 수를 돌려준다 */
  placeOnCalendar(items: { ref: StudyRef; title: string; subject: string }[]): number {
    const placed = new Set(eventsStore.get().flatMap((e) => (e.studyRef ? [e.studyRef.itemId] : [])))
    const todo = items.filter((i) => !placed.has(i.ref.itemId))
    let start = nextFullHour()
    // 밤 11시가 넘었으면 내일 저녁으로
    if (start.hour >= 23 || start.hour < 6) start = now().plus({ days: 1 }).set({ hour: 19, minute: 0, second: 0, millisecond: 0 })
    const added = todo.map((item, index) => {
      const s = start.plus({ hours: index })
      return {
        id: newId(),
        title: item.title,
        start: toUtc(s),
        end: toUtc(s.plus({ hours: 1 })),
        category: item.subject,
        studyRef: item.ref,
      }
    })
    eventsStore.set((prev) => [...prev, ...added])
    return added.length
  },
}

export const assignmentActions = {
  add(a: Omit<Assignment, 'id' | 'done'>) {
    assignmentsStore.set((prev) => [...prev, { ...a, id: newId(), done: false }])
  },
  update(id: string, patch: Partial<Assignment>) {
    assignmentsStore.set((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  },
  toggle(id: string) {
    assignmentsStore.set((prev) => prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a)))
  },
  toggleStep(id: string, stepId: string) {
    assignmentsStore.set((prev) =>
      prev.map((a) =>
        a.id !== id ? a : { ...a, steps: a.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)) },
      ),
    )
  },
  remove(id: string) {
    withUndo('수행평가를 지웠어요', [assignmentsStore as Store<unknown>], () => {
      assignmentsStore.set((prev) => prev.filter((a) => a.id !== id))
    })
  },
}
