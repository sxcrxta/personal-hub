-- 할 일 목록을 지워도 그 안의 할 일은 지우지 않는다 (목록만 비운다 → 화면에서는 기본 목록에 보인다)
-- 처음엔 on delete cascade였는데, 그러면 목록을 지우는 순간 할 일과 그 하위 할 일까지 DB에서 같이 사라졌다
alter table public.todos drop constraint todos_list_id_fkey;
alter table public.todos add constraint todos_list_id_fkey
  foreign key (list_id) references public.todo_lists (id) on delete set null;
