-- 테마 — 설정 창에서 고른 테마를 계정에 저장해서 폰과 컴퓨터가 같은 테마로 보이게 한다 (CLAUDE.md 2-6절, 2-7절)
-- system은 기기 설정 따라가기(어두운 모드면 밤 남색). 나머지는 src/styles/theme.css의 data-theme 이름과 같다
alter table public.profiles
  add column theme text not null default 'system'
  check (theme in ('system', 'light', 'slate', 'ink', 'black'));
