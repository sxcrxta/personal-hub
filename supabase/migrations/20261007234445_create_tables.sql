-- 3회차: 앱의 모든 표를 만든다 (설계는 docs/architecture.md 6절)
-- 모든 표에 id, user_id, created_at, updated_at을 두고, 본인 행만 읽고 쓸 수 있게 RLS를 건다
-- 날짜만 있는 값은 date(한국 날짜), 시각이 있는 값은 timestamptz(UTC)로 저장한다

-- updated_at을 저절로 고치는 함수
create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────── 설정 ─────────

-- 계정 설정 (계정당 한 줄)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade default auth.uid(),
  vault_folder text not null default '0. Slip-box', -- 볼트 안쪽 폴더 이름 (절대경로는 저장하지 않는다)
  file_name_format text not null default 'yyyy-MM-dd 메모 {번호}',
  timezone text not null default 'Asia/Seoul',
  todo_sort text not null default 'due' check (todo_sort in ('due', 'recent', 'name')),
  onboarding_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── 할 일 ─────────

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.todo_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  emoji text not null default '📋',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  list_id uuid references public.todo_lists (id) on delete cascade, -- 비어 있으면 기본 목록
  parent_id uuid references public.todos (id) on delete cascade, -- 하위 할 일이면 부모 (한 단계만)
  title text not null,
  done boolean not null default false,
  category text,
  memo text,
  due_date date,
  due_time time,
  today_date date, -- '오늘 할 일'로 올린 날
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── 습관 ─────────

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  emoji text not null default '✅',
  days smallint[] not null default '{1,2,3,4,5,6,7}', -- 1(월)~7(일)
  alarm_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date) -- 하루에 한 번만
);

-- ───────── 학업 ─────────

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  name text not null,
  emoji text,
  exam_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  subject_id uuid not null references public.exam_subjects (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  plan_date date, -- 공부하기로 한 날
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  subject text not null,
  due_date date not null,
  due_time time,
  memo text,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignment_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── 일정 ─────────

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  category text,
  memo text,
  todo_id uuid references public.todos (id) on delete set null, -- 연결된 할 일
  study_item_id uuid references public.study_items (id) on delete cascade, -- 캘린더에 배치한 공부 항목
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at) -- 종료가 시작보다 빠르면 거부
);

-- ───────── 메모 ─────────

-- 메모이자 맥북 프로그램이 가져갈 작업 큐
create table public.memos (
  id bigint generated always as identity primary key, -- 메모 번호. 파일 이름에 들어가 중복 생성을 막는다
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  content text not null, -- 원본. 정제해도 지우지 않는다
  tags text[] not null default '{}',
  save_mode text not null default '원문' check (save_mode in ('원문', '정제')),
  status text not null default '대기중' check (status in ('대기중', '정제대기', '처리중', '완료', '실패')),
  target_folder text not null, -- 저장 시점의 볼트 안쪽 폴더
  note_path text, -- 만들어진 파일 경로
  claimed_by text, -- 가져간 기기 이름
  claimed_at timestamptz, -- 10분이 지나도 처리중이면 다시 집어 간다
  error_message text,
  retry_count int not null default 0 check (retry_count between 0 and 3),
  resurface_score int not null default 0,
  last_shown_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 단순 메모장 (Obsidian으로 보내지 않는다)
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── 오늘 ─────────

-- 워커가 볼트에서 골라 올린 예전 노트 (웹은 읽기만 한다)
create table public.vault_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  path text not null, -- 볼트 안쪽 경로
  tags text[] not null default '{}',
  note_date date,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, path)
);

-- 오늘 보여줄 예전 노트 (하루에 하나)
create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  note_date date not null,
  vault_note_id uuid not null references public.vault_notes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, note_date)
);

-- ───────── 모든 표 공통: 인덱스, updated_at 트리거, RLS ─────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'categories', 'todo_lists', 'todos', 'habits', 'habit_logs',
    'exams', 'exam_subjects', 'study_items', 'assignments', 'assignment_steps',
    'events', 'memos', 'notes', 'vault_notes', 'daily_notes'
  ] loop
    if t <> 'profiles' then
      execute format('create index %I on public.%I (user_id)', t || '_user_id_idx', t);
    end if;

    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);

    -- 본인 행만 읽고 쓴다. 로그인하지 않은 사람(anon)은 아무것도 못 한다
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format(
      'create policy "본인 행만" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- 외래 키로 자주 찾는 열
create index todos_list_id_idx on public.todos (list_id);
create index todos_parent_id_idx on public.todos (parent_id);
create index habit_logs_habit_id_idx on public.habit_logs (habit_id);
create index exam_subjects_exam_id_idx on public.exam_subjects (exam_id);
create index study_items_subject_id_idx on public.study_items (subject_id);
create index assignment_steps_assignment_id_idx on public.assignment_steps (assignment_id);
create index events_todo_id_idx on public.events (todo_id);
create index events_study_item_id_idx on public.events (study_item_id);
create index events_user_start_idx on public.events (user_id, start_at);
create index memos_status_idx on public.memos (status);
create index daily_notes_vault_note_id_idx on public.daily_notes (vault_note_id);

-- 가입하면 profiles 한 줄을 자동으로 만든다
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
