// 처음 열었을 때 넣어 두는 예시 데이터 — 날짜는 오늘 기준으로 계산해서 언제 열어도 화면이 채워진다
// 3회차에 DB를 붙이면 지운다
import type { Assignment, CalendarEvent, Exam, Habit, Memo, Note, Todo, TodoList, VaultNote } from '../types/data.ts'
import { now, toDateKey, toUtc } from './date.ts'

/** 오늘부터 며칠 뒤의 날짜 'yyyy-MM-dd' */
function day(offset: number): string {
  return toDateKey(now().plus({ days: offset }))
}

/** 오늘부터 며칠 뒤 몇 시 몇 분을 UTC 문자열로 */
function at(offset: number, hour: number, minute = 0): string {
  return toUtc(now().plus({ days: offset }).set({ hour, minute, second: 0, millisecond: 0 }))
}

export function sampleEvents(): CalendarEvent[] {
  return [
    { id: 'e1', title: '과학탐구동아리 실험', start: at(0, 16), end: at(0, 18), location: '화학실', category: '동아리' },
    { id: 'e2', title: '수학 학원', start: at(2, 19), end: at(2, 21), category: '학원' },
    { id: 'e4', title: '수열 기출 풀기', start: at(0, 20), end: at(0, 21, 30), category: '수학', studyRef: { examId: 'x1', subjectId: 's1', itemId: 'i1' } },
    { id: 'e3', title: '진로 상담', start: at(5, 12, 30), end: at(5, 13), location: '상담실', category: '학교' },
  ]
}

export function sampleTodoLists(): TodoList[] {
  return [
    { id: 'inbox', name: '할 일', emoji: '📥' },
    { id: 'school', name: '학교', emoji: '🏫' },
    { id: 'personal', name: '개인', emoji: '🌱' },
  ]
}

export function sampleTodos(): Todo[] {
  const created = at(-3, 9)
  return [
    { id: 't1', title: '독서 비문학 기출 오답노트 정리', done: false, listId: 'school', category: '국어', dueDate: day(-1), dueTime: '23:59', createdAt: created },
    { id: 't2', title: '영어 단어 12강 외우기', done: false, listId: 'school', category: '영어', dueDate: day(0), dueTime: '21:00', todayDate: day(0), createdAt: created },
    { id: 't3', title: '동아리 보고서 초안 검토', done: false, listId: 'school', category: '동아리', dueDate: day(3), createdAt: at(-2, 9) },
    { id: 't3a', title: '실험 결과 표 확인', done: true, parentId: 't3', createdAt: at(-2, 9) },
    { id: 't3b', title: '참고문헌 형식 맞추기', done: false, parentId: 't3', createdAt: at(-2, 9) },
    { id: 't4', title: '책상 정리', done: false, listId: 'personal', category: '일상', todayDate: day(0), createdAt: at(-1, 20) },
    { id: 't5', title: '문제집 채점하기', done: true, listId: 'school', category: '수학', createdAt: at(-2, 18), doneAt: at(-1, 22, 40) },
  ]
}

export function sampleHabits(): Habit[] {
  const everyday = [1, 2, 3, 4, 5, 6, 7]
  const weekdays = [1, 2, 3, 4, 5]
  return [
    { id: 'h1', name: '물 1.5L 마시기', emoji: '💧', days: everyday, logs: [day(-3), day(-2), day(-1)] },
    { id: 'h2', name: '영단어 40개', emoji: '📖', days: weekdays, alarmTime: '07:30', logs: [day(-4), day(-3), day(-2), day(-1)] },
    { id: 'h3', name: '자기 전 오답 10분', emoji: '🌙', days: everyday, alarmTime: '23:00', logs: [day(-1)] },
  ]
}

export function sampleExams(): Exam[] {
  return [
    {
      id: 'x1',
      name: '2학기 중간고사',
      startDate: day(7),
      endDate: day(10),
      subjects: [
        {
          id: 's1',
          name: '수학',
          emoji: '📐',
          examDate: day(7),
          items: [
            { id: 'i1', title: '수열 기출 풀기', done: false, planDate: day(0) },
            { id: 'i2', title: '급수 개념 정리', done: false, planDate: day(1) },
            { id: 'i3', title: '지난 단원 복습', done: true },
          ],
        },
        {
          id: 's2',
          name: '화학Ⅰ',
          emoji: '🧪',
          examDate: day(8),
          items: [{ id: 'i4', title: '몰 농도 계산 문제', done: false, planDate: day(2) }],
        },
        {
          id: 's3',
          name: '영어',
          emoji: '🔤',
          examDate: day(9),
          items: [{ id: 'i5', title: '수능특강 3강 본문 읽기', done: false, planDate: day(-1) }],
        },
      ],
    },
  ]
}

export function sampleAssignments(): Assignment[] {
  return [
    { id: 'a1', title: '독서 감상문 제출', subject: '국어', dueDate: day(0), dueTime: '23:59', done: false, steps: [] },
    {
      id: 'a2',
      title: '역학적 에너지 발표 자료 만들기',
      subject: '물리학Ⅰ',
      dueDate: day(2),
      done: false,
      steps: [
        { id: 'p1', title: '자료 조사', done: true },
        { id: 'p2', title: 'PPT 만들기', done: false },
      ],
    },
    { id: 'a3', title: '근현대사 단원 요약', subject: '한국사', dueDate: day(6), done: false, steps: [] },
  ]
}

export function sampleVaultNotes(): VaultNote[] {
  return [
    {
      id: 'n1',
      title: '미분계수의 기하학적 의미',
      path: '0. Slip-box/2026-04-12 메모 3.md',
      tags: ['수학', '개념정리'],
      createdAt: '2026-04-12',
      content: `## 미분계수 f'(a)는 무엇인가

- 곡선 y = f(x) 위의 점 (a, f(a))에서 그은 **접선의 기울기**다.
- 평균변화율에서 x의 변화량을 0에 가깝게 보낸 극한이다.
- 그래서 접선의 방정식은 \`y - f(a) = f'(a)(x - a)\`

> 곡선 밖의 점에서 접선을 그을 때는 접점을 (t, f(t))로 두고 시작한다.

관련: [[평균변화율]], [[극한의 뜻]]`,
    },
    {
      id: 'n2',
      title: '다시 읽기보다 떠올리기가 오래 남는다',
      path: '0. Slip-box/2026-05-03 메모 8.md',
      tags: ['공부법'],
      createdAt: '2026-05-03',
      content: `## 떠올리기 연습

교과서를 한 번 더 읽는 것보다 **책을 덮고 떠올려 보는 것**이 기억에 오래 남는다.

1. 공부한 내용을 백지에 적어 본다
2. 못 적은 부분만 다시 본다
3. 며칠 뒤 한 번 더 적어 본다

읽을 때는 다 아는 것 같지만, 떠올려 보면 모르는 부분이 바로 드러난다.`,
    },
    {
      id: 'n3',
      title: '엔트로피를 무질서도라고만 외우면 헷갈린다',
      path: '0. Slip-box/2026-06-20 메모 15.md',
      tags: ['화학', '질문'],
      createdAt: '2026-06-20',
      content: `## 엔트로피

"무질서도"라고 외우면 예외에서 막힌다.
에너지가 퍼질 수 있는 **경우의 수**로 생각하는 게 더 정확하다.

- 기체 > 액체 > 고체
- 온도가 높을수록 커진다

아직 모르는 것: 왜 로그를 붙여서 정의하는지`,
    },
  ]
}

export function sampleMemos(): Memo[] {
  return [
    {
      id: 3,
      content: '미분계수 = 접선의 기울기. 곡선 밖의 점에서 접선 그을 때는 접점을 t로 두고 시작하기',
      tags: ['수학', '개념정리'],
      saveMode: '원문',
      status: '완료',
      targetFolder: '0. Slip-box',
      notePath: `0. Slip-box/${day(-2)} 메모 3.md`,
      createdAt: at(-2, 21),
    },
    {
      id: 4,
      content: '엔트로피를 무질서도로만 외우면 예외에서 막힌다. 경우의 수로 생각해 보기. 로그는 왜 붙지?',
      tags: ['화학'],
      saveMode: '원문',
      status: '대기중',
      targetFolder: '0. Slip-box',
      createdAt: at(0, 8, 10),
    },
  ]
}

export function sampleNotes(): Note[] {
  return [
    {
      id: 'm1',
      title: '수행평가 발표 순서',
      body: '1. 실험 목적\n2. 측정 방법\n3. 오차 원인\n\n#물리 #수행평가',
      updatedAt: at(-1, 22),
    },
    {
      id: 'm2',
      title: '사야 할 것',
      body: '- 형광펜\n- 인덱스 스티커\n- 수능특강 영어\n\n#일상',
      updatedAt: at(-3, 18),
    },
  ]
}
