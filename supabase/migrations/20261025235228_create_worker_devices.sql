-- 맥북 워커 기기 목록 — 워커가 1분마다 last_seen_at을 새로 적고, 웹은 이 시각으로 켜짐/꺼짐을 판단한다
-- 신호가 끊기면 웹이 "AI로 정제하여 저장"을 잠근다 (architecture.md 6절)
create table public.worker_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null, -- 기기 이름 (워커 설정에서 정한다)
  last_seen_at timestamptz not null default now(), -- 마지막으로 살아 있다는 신호를 보낸 시각
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create trigger set_updated_at before update on public.worker_devices
  for each row execute function public.set_updated_at();

-- 다른 표와 같이: 본인 행만 읽고 쓴다. 로그인하지 않은 사람(anon)은 아무것도 못 한다
alter table public.worker_devices enable row level security;
revoke all on public.worker_devices from anon;
create policy "본인 행만" on public.worker_devices for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
