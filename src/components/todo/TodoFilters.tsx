// 할 일 거르기 — 목록 탭, 카테고리 칩, 정렬, 목록·카테고리 관리 버튼
import { ArrowUpDown, Settings2, Tags } from 'lucide-react'
import type { TodoSort } from '../../lib/stores.ts'
import type { TodoList } from '../../types/data.ts'

export const ALL = 'all'

type Props = {
  lists: TodoList[]
  listId: string
  onList: (id: string) => void
  categories: string[]
  category: string | null
  onCategory: (c: string | null) => void
  counts: Record<string, number>
  sort: TodoSort
  onSort: (sort: TodoSort) => void
  onManageLists: () => void
  onManageCategories: () => void
}

const chip = (active: boolean) =>
  `h-8 shrink-0 rounded-full border px-3 text-label-md transition-colors ${
    active ? 'border-button bg-button text-on-primary' : 'border-field-border text-on-surface-variant hover:bg-hover-soft'
  }`

export default function TodoFilters(p: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
          <button type="button" onClick={() => p.onList(ALL)} className={chip(p.listId === ALL)}>
            전체 <span className="tabular-nums opacity-70">{p.counts[ALL] ?? 0}</span>
          </button>
          {p.lists.map((l) => (
            <button key={l.id} type="button" onClick={() => p.onList(l.id)} className={chip(p.listId === l.id)}>
              {l.emoji} {l.name} <span className="tabular-nums opacity-70">{p.counts[l.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={p.onManageLists}
          className="flex h-8 shrink-0 items-center gap-1 rounded px-2 text-label-md text-on-surface-variant hover:bg-hover"
        >
          <Settings2 size={15} strokeWidth={1.75} />
          목록 관리
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => p.onCategory(null)} className={chip(p.category === null)}>
          모든 카테고리
        </button>
        {p.categories.map((c) => (
          <button key={c} type="button" onClick={() => p.onCategory(p.category === c ? null : c)} className={chip(p.category === c)}>
            #{c}
          </button>
        ))}
        <button
          type="button"
          onClick={p.onManageCategories}
          aria-label="카테고리 관리"
          title="카테고리 관리"
          className="flex size-8 items-center justify-center rounded text-icon hover:bg-hover"
        >
          <Tags size={16} strokeWidth={1.75} />
        </button>
        <label className="ml-auto flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <ArrowUpDown size={15} strokeWidth={1.75} />
          <select
            value={p.sort}
            onChange={(e) => p.onSort(e.target.value as TodoSort)}
            className="h-8 rounded border border-field-border bg-surface-container-lowest px-2 text-label-md focus:outline-none"
          >
            <option value="due">마감 임박순</option>
            <option value="recent">최근 추가순</option>
            <option value="name">이름순</option>
          </select>
        </label>
      </div>
    </div>
  )
}
