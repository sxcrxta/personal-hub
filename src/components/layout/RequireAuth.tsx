// 로그인 문지기 — 로그인하지 않았으면 /login으로 보내고, 로그인 뒤 원래 가려던 주소로 돌아오게 한다
import { Navigate, Outlet, useLocation } from 'react-router'
import { useStore } from '../../hooks/useStore.ts'
import { authStore } from '../../lib/auth.ts'

export default function RequireAuth() {
  const [{ loading, session }] = useStore(authStore)
  const location = useLocation()

  // 세션을 확인하는 짧은 순간에는 아무것도 그리지 않는다 (로그인 화면이 깜빡이지 않게)
  if (loading) return null
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
