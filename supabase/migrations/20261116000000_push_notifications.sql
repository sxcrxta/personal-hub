-- 푸시 알림 — 기기별 구독, 보낸 기록, 1분마다 발송 함수를 부르는 예약 실행
-- 흐름: 웹이 구독을 push_subscriptions에 남긴다 → pg_cron이 1분마다 send-push 함수를 부른다
--       → 함수가 지금 알림 시각인 습관을 찾아 그 사람의 기기로 보내고 push_log에 남긴다 (CLAUDE.md 4절 "Web Push + Supabase 예약 실행")

-- ───────── 구독 (기기·브라우저마다 한 줄) ─────────
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  endpoint text not null unique, -- 브라우저 회사(애플·구글)의 푸시 서버 주소. 기기마다 다르다
  p256dh text not null, -- 알림 내용을 암호화할 때 쓰는 이 기기의 공개 키
  auth text not null,
  device_label text not null default '', -- 설정 창에 보여줄 이름 (예: iPhone, Mac Chrome)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
create trigger set_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
create policy "본인 행만" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ───────── 보낸 기록 (같은 알림을 하루에 두 번 보내지 않게) ─────────
create table public.push_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('habit', 'todo')), -- 무엇의 알림인지
  ref_id uuid not null, -- 습관·할 일의 id
  sent_on date not null, -- 그 사람의 시간대로 본 날짜
  created_at timestamptz not null default now(),
  unique (kind, ref_id, sent_on)
);
create index push_log_user_id_idx on public.push_log (user_id);

-- 기록은 발송 함수(service_role)만 쓴다. 본인은 읽기만 한다
alter table public.push_log enable row level security;
revoke all on public.push_log from anon;
revoke insert, update, delete on public.push_log from authenticated;
create policy "본인 행 읽기" on public.push_log for select to authenticated
  using ((select auth.uid()) = user_id);

-- ───────── 1분마다 발송 함수 부르기 ─────────
-- 함수 주소와 비밀 값은 저장소에 올리지 않으려고 Supabase Vault에 따로 넣는다:
--   select vault.create_secret('https://<프로젝트>.supabase.co', 'project_url');
--   select vault.create_secret('<임의의 긴 문자열>', 'push_cron_secret');  -- 함수 비밀 값 CRON_SECRET과 같게
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-push-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
