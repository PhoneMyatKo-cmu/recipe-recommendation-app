import { useState } from 'react'

type AuthPanelProps = {
  token: string | null
  onTokenChange: (token: string | null) => void
}

type AuthResponse = {
  access_token?: string
  token?: string
  bearer_token?: string
}

const API_BASE_URL = 'http://127.0.0.1:8000'

function extractToken(data: AuthResponse): string | null {
  return data.access_token ?? data.token ?? data.bearer_token ?? null
}

function AuthPanel({ token, onTokenChange }: AuthPanelProps) {
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const handleRegister = async () => {
    if (!registerEmail.trim() || !registerPassword.trim()) {
      setError('Please provide email and password for register.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerEmail.trim(),
          password: registerPassword,
        }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Register failed.'))
      }

      let tokenFromRegister: string | null = null
      try {
        const data = (await response.json()) as AuthResponse
        tokenFromRegister = extractToken(data)
      } catch {
        tokenFromRegister = null
      }

      if (tokenFromRegister) {
        onTokenChange(tokenFromRegister)
        setMessage('Register success. You are now logged in.')
      } else {
        setMessage('Register success. Please login.')
      }
    } catch (registerError) {
      const message = registerError instanceof Error ? registerError.message : 'Register failed.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please provide email and password for login.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Login failed.'))
      }

      const data = (await response.json()) as AuthResponse
      const nextToken = extractToken(data)
      if (!nextToken) {
        throw new Error('Login succeeded but token was not returned by API.')
      }

      onTokenChange(nextToken)
      setMessage('Login success.')
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Login failed.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    if (!token) {
      onTokenChange(null)
      setMessage('Logged out locally.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Logout failed.'))
      }

      onTokenChange(null)
      setMessage('Logout success.')
    } catch (logoutError) {
      const message = logoutError instanceof Error ? logoutError.message : 'Logout failed.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-3 rounded-xl border border-slate-200 p-3">
          <h2 className="text-lg font-semibold text-slate-900">Register</h2>
          <input
            type="email"
            value={registerEmail}
            onChange={(event) => setRegisterEmail(event.target.value)}
            placeholder="Email"
            className="h-10 w-full rounded-lg border border-slate-300 px-3"
          />
          <input
            type="password"
            value={registerPassword}
            onChange={(event) => setRegisterPassword(event.target.value)}
            placeholder="Password"
            className="h-10 w-full rounded-lg border border-slate-300 px-3"
          />
          <button
            type="button"
            onClick={handleRegister}
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Register
          </button>
        </div>

        <div className="flex-1 space-y-3 rounded-xl border border-slate-200 p-3">
          <h2 className="text-lg font-semibold text-slate-900">Login</h2>
          <input
            type="email"
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
            placeholder="Email"
            className="h-10 w-full rounded-lg border border-slate-300 px-3"
          />
          <input
            type="password"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            placeholder="Password"
            className="h-10 w-full rounded-lg border border-slate-300 px-3"
          />
          <button
            type="button"
            onClick={handleLogin}
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Login
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-600">
          Status: {token ? 'Authenticated (Bearer token saved)' : 'Not logged in'}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Logout
        </button>
      </div>

      {message && <p className="mt-3 text-sm font-medium text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
    </section>
  )
}

export default AuthPanel
