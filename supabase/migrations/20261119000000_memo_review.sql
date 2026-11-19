-- 저장 전 검토 — AI 정제 결과를 바로 볼트에 넣지 않고 웹에서 원문과 비교해 고친 뒤 저장한다 (확장, 11월 19일)
-- 흐름: 정제대기 → 처리중 → 검토대기(초안이 DB에 있음) → 웹에서 고치고 저장 → 저장대기 → 처리중 → 완료 (architecture.md 2-2절)

-- 상태 두 개를 더한다
alter table public.memos drop constraint memos_status_check;
alter table public.memos add constraint memos_status_check
  check (status in ('대기중', '정제대기', '처리중', '검토대기', '저장대기', '완료', '실패'));

alter table public.memos
  add column review boolean not null default false, -- 보낼 때의 "저장 전에 검토하기" 설정을 복사해 둔다
  add column draft_title text, -- 검토할 AI 정제 제목. 웹이 고칠 수 있다
  add column draft_body text; -- 검토할 AI 정제 본문. 노트가 만들어지면 비운다

-- 계정 설정: 기본은 꺼짐이라 쓰던 사람은 지금처럼 바로 저장된다
alter table public.profiles add column review_before_save boolean not null default false;
