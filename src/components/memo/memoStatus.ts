// 메모 처리 상태를 화면 글자와 색으로 — 대기 중 / 정제 대기 / 처리 중 / 노트 생성됨 / 실패
import type { MemoStatus } from '../../types/data.ts'

export const STATUS_LABEL: Record<MemoStatus, string> = {
  대기중: '대기 중',
  정제대기: '정제 대기',
  처리중: '처리 중',
  완료: '노트 생성됨',
  실패: '실패',
}

export const STATUS_CLASS: Record<MemoStatus, string> = {
  대기중: 'border-secondary/20 bg-secondary-container/60 text-secondary',
  정제대기: 'border-english/25 bg-english-bg text-english',
  처리중: 'border-social/25 bg-social-bg text-social',
  완료: 'border-science/25 bg-science-bg text-science',
  실패: 'border-urgent/25 bg-urgent-bg text-urgent',
}
