// 로그인·회원가입 화면 — 유일하게 사이드바 없이 열린다. 이메일과 비밀번호로 가입하고 로그인한다
import { BookOpen } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import Button from '../components/common/Button.tsx'
import { Field, TextInput } from '../components/common/Field.tsx'
import { useStore } from '../hooks/useStore.ts'
import { authErrorMessage, authStore } from '../lib/auth.ts'
import { supabase } from '../lib/supabase.ts'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const [{ loading, session }] = useStore(authStore)
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/today'

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // 이미 로그인했으면 이 화면을 보여줄 필요가 없다
  if (loading) return null
  if (session) return <Navigate to={from} replace />

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return // 두 번 눌러도 요청은 한 번만
    setBusy(true)
    setError('')
    setNotice('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError(authErrorMessage(error.message))
      // 성공하면 authStore가 바뀌어 위의 Navigate가 원래 주소로 보낸다
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/today` },
      })
      if (error) {
        setError(authErrorMessage(error.message))
      } else if (!data.session) {
        // 이메일 인증을 켜 두면 세션 없이 돌아온다
        setNotice(`${email.trim()}로 인증 메일을 보냈어요. 메일의 링크를 누르면 로그인돼요.`)
        setMode('login')
      }
    }
    setBusy(false)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded border bg-surface-container-lowest text-primary-container">
            <BookOpen size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-headline-lg text-primary">Personal Hub</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">메모 · 일정 · 학업</p>
          </div>
        </div>

        <div className="rounded border bg-surface-container-lowest p-6">
          <div className="mb-5 grid grid-cols-2 rounded bg-surface-container-low p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`h-9 rounded text-body-md transition-colors ${
                  mode === m ? 'bg-surface-container-lowest font-medium text-on-surface shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="이메일">
              <TextInput
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="비밀번호">
              <TextInput
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '6자 이상' : ''}
              />
            </Field>

            {error && <p className="rounded bg-error-container/50 px-3 py-2 text-body-sm text-error">{error}</p>}
            {notice && <p className="rounded bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">{notice}</p>}

            <Button type="submit" variant="primary" disabled={busy} className="w-full">
              {busy ? '잠시만요…' : mode === 'login' ? '로그인' : '가입하기'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
