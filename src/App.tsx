// 주소와 화면을 연결하는 라우트 목록 — 없는 주소는 모두 /today로 보내고, 로그인 안 했으면 /login으로 보낸다
import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout.tsx'
import RequireAuth from './components/layout/RequireAuth.tsx'
import CalendarPage from './pages/CalendarPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MemoPage from './pages/MemoPage.tsx'
import StudyPage from './pages/StudyPage.tsx'
import TodayPage from './pages/TodayPage.tsx'
import TodoPage from './pages/TodoPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/today" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/memo" element={<MemoPage />} />
          <Route path="/study" element={<StudyPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  )
}
