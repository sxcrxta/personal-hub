-- 할 일 알림 — 할 일 하나에 알림 시각을 여러 개 건다. 미루기는 알림을 하나 더 거는 것이다 (CLAUDE.md 2-4절)
-- 흐름: 웹이 알림 시각을 적는다 → pg_cron이 1분마다 send-push를 부른다(20261116 마이그레이션)
--       → 함수가 때가 된 알림을 찾아 sent_at을 먼저 적고 그 사람의 기기로 보낸다

create table public.todo_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  todo_id uuid not null references public.todos (id) on delete cascade, -- 할 일을 지우면 알림도 지운다
  remind_at timestamptz not null, -- 알릴 시각
  sent_at timestamptz, -- 보낸 시각. 비어 있으면 아직 안 보냄
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index todo_reminders_user_id_idx on public.todo_reminders (user_id);
create index todo_reminders_todo_id_idx on public.todo_reminders (todo_id);
-- 발송 함수가 1분마다 "안 보낸 알림 중 때가 된 것"을 찾는다
create index todo_reminders_due_idx on public.todo_reminders (remind_at) where sent_at is null;

create trigger set_updated_at before update on public.todo_reminders
  for each row execute function public.set_updated_at();

alter table public.todo_reminders enable row level security;
revoke all on public.todo_reminders from anon;
create policy "본인 행만" on public.todo_reminders for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
