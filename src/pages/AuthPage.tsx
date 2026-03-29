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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-amber-200/20 to-emerald-200/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-200/20 to-emerald-200/20 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-xl animate-scale-in">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 p-3">
            <span className="text-3xl">🍽️</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Food Bookmark App</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {mode === 'register' ? 'Registering...' : 'Logging in...'}
              </span>
            ) : (
              <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => onSwitchMode(mode === 'register' ? 'login' : 'register')}
              className="font-semibold text-emerald-600 underline decoration-emerald-600/30 underline-offset-4 transition-colors hover:text-emerald-700 hover:decoration-emerald-700/50"
            >
              {mode === 'register' ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 animate-fade-in">
            <p className="text-sm font-medium text-green-700 flex items-center gap-2">
              <span>✅</span>
              {message}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-fade-in">
            <p className="text-sm font-medium text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

export default AuthPage
