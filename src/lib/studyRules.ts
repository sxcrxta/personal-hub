// 학업 규칙 — 진도율, 시험 D-Day, 공부 항목 날짜 표시, 수행평가를 급한 정도로 나누기 (모두 저장된 값에서 계산)
import type { Assignment, Exam, StudyItem } from '../types/data.ts'
import { dDayLabel, daysFromToday, formatDateKey, fromDateAndTime, fromDateKey, todayKey } from './date.ts'

export function progressOf(items: StudyItem[]): { done: number; total: number; percent: number } {
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 }
}

export function examProgress(exam: Exam) {
  return progressOf(exam.subjects.flatMap((s) => s.items))
}

/** 시험까지 남은 날. 시험 기간 중이면 during */
export function examDday(exam: Exam): { days: number; label: string; during: boolean } {
  const days = daysFromToday(fromDateKey(exam.startDate))
  const during = days <= 0 && todayKey() <= exam.endDate
  return { days, label: during ? '시험 중' : dDayLabel(days), during }
}

/** 지금 보여줄 시험(아직 안 끝난 것, 가까운 순)과 지난 시험 */
export function splitExams(exams: Exam[]): { current: Exam[]; past: Exam[] } {
  const today = todayKey()
  const byStart = [...exams].sort((a, b) => a.startDate.localeCompare(b.startDate))
  return {
    current: byStart.filter((e) => e.endDate >= today),
    past: byStart.filter((e) => e.endDate < today).reverse(),
  }
}

/** 공부 항목 날짜 글자: 오늘 공부 / 2일 밀림 / 10월 1일 (목) */
export function planLabel(item: StudyItem): { text: string; tone: 'today' | 'late' | 'later' } | null {
  if (!item.planDate) return null
  const days = daysFromToday(fromDateKey(item.planDate))
  if (days === 0) return { text: '오늘 공부', tone: 'today' }
  if (days < 0) return { text: item.done ? formatDateKey(item.planDate) : `${-days}일 밀림`, tone: item.done ? 'later' : 'late' }
  return { text: formatDateKey(item.planDate), tone: 'later' }
}

export type AssignmentGroup = 'urgent' | 'soon' | 'later' | 'done'

/** 오늘·내일 마감(또는 지남) / 7일 이내 / 그 뒤 / 제출 완료 */
export function assignmentGroup(a: Assignment): AssignmentGroup {
  if (a.done) return 'done'
  const days = daysFromToday(fromDateKey(a.dueDate))
  if (days <= 1) return 'urgent'
  if (days <= 7) return 'soon'
  return 'later'
}

export function assignmentDue(a: Assignment): { dday: string; text: string; days: number } {
  const due = fromDateAndTime(a.dueDate, a.dueTime)
  const days = daysFromToday(due)
  const day = days === 0 ? '오늘' : days === 1 ? '내일' : formatDateKey(a.dueDate)
  return { dday: dDayLabel(days), text: a.dueTime ? `${day} ${a.dueTime} 마감` : `${day} 마감`, days }
}
