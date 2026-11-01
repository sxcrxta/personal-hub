// 앱이 저장하는 데이터의 모양 — 지금은 localStorage, 3회차에 Supabase 표로 옮긴다
// 날짜만 있는 값은 'yyyy-MM-dd'(한국 날짜), 시각이 있는 값은 UTC ISO 문자열로 저장한다

/** 시험 공부 항목을 가리키는 위치 */
export type StudyRef = { examId: string; subjectId: string; itemId: string }

/** 일정 */
export type CalendarEvent = {
  id: string
  title: string
  start: string // UTC ISO
  end: string // UTC ISO
  location?: string
  category?: string
  memo?: string
  todoId?: string // 연결된 할 일 (제목이 같이 바뀐다)
  studyRef?: StudyRef // 캘린더에 배치한 공부 항목
}

/** 할 일 목록 (예: 학교, 개인) */
export type TodoList = {
  id: string
  name: string
  emoji: string
}

/** 할 일 */
export type Todo = {
  id: string
  title: string
  done: boolean
  listId?: string // 없으면 기본 목록
  category?: string
  memo?: string
  dueDate?: string // yyyy-MM-dd
  dueTime?: string // HH:mm
  parentId?: string // 하위 할 일이면 부모 id (한 단계만)
  todayDate?: string // '오늘 할 일'로 올린 날. 그날이 지나면 저절로 내려간다
  createdAt?: string // UTC ISO
  doneAt?: string // UTC ISO
}

/** 습관 */
export type Habit = {
  id: string
  name: string
  emoji: string
  days: number[] // 하는 요일 1(월)~7(일)
  alarmTime?: string // HH:mm, 알림은 7회차에 보낸다
  logs: string[] // 체크한 날짜들 yyyy-MM-dd
}

/** 시험 안의 공부 항목 */
export type StudyItem = {
  id: string
  title: string
  done: boolean
  planDate?: string // 공부하기로 한 날, yyyy-MM-dd
}

/** 시험 안의 과목 */
export type ExamSubject = {
  id: string
  name: string
  emoji?: string
  examDate: string // yyyy-MM-dd
  items: StudyItem[]
}

/** 시험 (지필평가 등) */
export type Exam = {
  id: string
  name: string
  startDate: string // yyyy-MM-dd
  endDate: string // yyyy-MM-dd
  subjects: ExamSubject[]
}

/** 수행평가·과제 */
export type Assignment = {
  id: string
  title: string
  subject: string
  dueDate: string // yyyy-MM-dd
  dueTime?: string // HH:mm
  memo?: string
  done: boolean
  steps: { id: string; title: string; done: boolean }[]
}

/** 플러그인이 볼트에서 골라 올린 예전 노트 (웹은 읽기만 한다) */
export type VaultNote = {
  id: string
  title: string
  path: string // 볼트 안쪽 경로
  tags: string[]
  createdAt: string // yyyy-MM-dd
  content: string // 마크다운 원문
}

/** Obsidian으로 보낼 메모 — 메모이자 플러그인이 가져갈 작업 */
export type MemoSaveMode = '원문' | '정제'
export type MemoStatus = '대기중' | '정제대기' | '처리중' | '완료' | '실패'

export type Memo = {
  id: number // 메모 번호. 파일 이름에 들어가 중복 생성을 막는다
  content: string
  tags: string[]
  saveMode: MemoSaveMode
  status: MemoStatus
  targetFolder: string // 저장 시점의 볼트 안쪽 폴더
  notePath?: string // 플러그인이 되돌려 적는 파일 경로
  errorMessage?: string
  createdAt: string // UTC ISO
}

/** 플러그인 기기 — 플러그인이 1분마다 마지막 신호 시각을 적는다 */
export type WorkerDevice = {
  id: string
  name: string
  lastSeenAt: string // UTC ISO
}

/** 단순 메모장 (Obsidian으로 보내지 않는다) */
export type Note = {
  id: string
  title: string
  body: string
  updatedAt: string // UTC ISO
}

/** 계정 설정 */
export type Settings = {
  vaultFolder: string // 볼트 안쪽 폴더 이름
  fileNameFormat: string
}
