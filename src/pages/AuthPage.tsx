import { useState } from 'react'

export type AuthMode = 'register' | 'login'

type AuthPageProps = {
  mode: AuthMode
  isSubmitting: boolean
  error: string | null
  message: string | null
  onSubmit: (email: string, password: string) => void
  onSwitchMode: (mode: AuthMode) => void
}

function AuthPage({ mode, isSubmitting, error, message, onSubmit, onSwitchMode }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const title = mode === 'register' ? 'Create your account' : 'Welcome back'
  const subtitle =
    mode === 'register'
      ? 'Register first to start using the app.'
      : 'Login with your registered email and password.'

  const handleSubmit = () => {
    onSubmit(email.trim(), password)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 via-amber-50 to-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Food Bookmark App</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{subtitle}</p>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-800"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-800"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-slate-900 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mode === 'register' ? 'Register' : 'Login'}
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => onSwitchMode(mode === 'register' ? 'login' : 'register')}
            className="font-semibold text-amber-700 underline"
          >
            {mode === 'register' ? 'Go to Login' : 'Go to Register'}
          </button>
        </p>

        {message && <p className="mt-4 text-sm font-medium text-green-700">{message}</p>}
        {error && <p className="mt-4 text-sm font-medium text-red-700">{error}</p>}
      </section>
    </main>
  )
}

export default AuthPage
