import { useEffect, useState } from 'react'
import AllBookmarks from './pages/AllBookmarks'
import AuthPage, { type AuthMode } from './pages/AuthPage'
import EvaluatePage from './pages/EvaluatePage'
import Folder from './pages/Folder'
import FolderDetail from './pages/FolderDetail'
import LandingPage from './pages/LandingPage'
import RagPage from './pages/RagPage'
import SearchPage from './pages/SearchPage'

type AuthResponse = {
  access_token?: string
  token?: string
  bearer_token?: string
}

type UserDetailResponse = {
  user_id: number
  email: string
  created_at: string
  folder_count: number
  bookmark_count: number
}

const API_BASE_URL = 'http://127.0.0.1:8000'

export function extractToken(data: AuthResponse): string | null {
  return data.access_token ?? data.token ?? data.bearer_token ?? null
}

export function getFolderIdFromPath(pathname: string): number | null {
  const match = pathname.match(/^\/folders\/(\d+)$/)
  if (!match) {
    return null
  }
  const folderId = Number(match[1])
  return Number.isNaN(folderId) ? null : folderId
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [pathname, setPathname] = useState(window.location.pathname)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserDetailResponse | null>(null)

  const isAuthenticated = Boolean(token)

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
      setCurrentUser(null)
    }
  }, [token])

  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      const requestUrl =
        typeof args[0] === 'string'
          ? args[0]
          : args[0] instanceof Request
            ? args[0].url
            : ''

      const isAuthRoute =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/logout')

      if (token && response.status === 401 && !isAuthRoute) {
        setToken(null)
        setAuthError('Session expired. Please login again.')
        setAuthMessage(null)
        window.history.pushState({}, '', '/login')
        setPathname('/login')
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    const loadCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          return
        }
        const data = (await response.json()) as UserDetailResponse
        setCurrentUser(data)
      } catch {
        // Ignore non-critical profile fetch errors.
      }
    }

    loadCurrentUser()
  }, [token])

  const navigate = (path: string) => {
    if (window.location.pathname === path) {
      setPathname(path)
      return
    }
    window.history.pushState({}, '', path)
    setPathname(path)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      if (pathname !== '/register' && pathname !== '/login') {
        navigate('/register')
      }
      return
    }

    if (pathname === '/register' || pathname === '/login') {
      navigate('/')
    }
  }, [isAuthenticated, pathname])

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const handleRegister = async (email: string, password: string) => {
    if (!email || !password) {
      setAuthError('Please provide email and password.')
      return
    }

    setIsSubmitting(true)
    setAuthError(null)
    setAuthMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Register failed.'))
      }

      setAuthMessage('Register successful. Please login.')
      navigate('/login')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Register failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      setAuthError('Please provide email and password.')
      return
    }

    setIsSubmitting(true)
    setAuthError(null)
    setAuthMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Login failed.'))
      }

      const data = (await response.json()) as AuthResponse
      const nextToken = extractToken(data)
      if (!nextToken) {
        throw new Error('Login succeeded but token was not returned by API.')
      }

      setToken(nextToken)
      setAuthMessage(null)
      navigate('/')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setIsSubmitting(true)
    setAuthError(null)
    setAuthMessage(null)

    try {
      if (token) {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, 'Logout failed.'))
        }
      }
      setToken(null)
      navigate('/register')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Logout failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const authMode: AuthMode = pathname === '/login' ? 'login' : 'register'
  const folderId = getFolderIdFromPath(pathname)
  const displayName =
    currentUser?.email?.split('@')[0]?.trim() || currentUser?.email || 'User'

  let authenticatedPage = <LandingPage token={token} />
  if (folderId !== null) {
    authenticatedPage = <FolderDetail token={token} folderId={folderId} onBack={() => navigate('/folders')} />
  } else if (pathname === '/search') {
    authenticatedPage = <SearchPage token={token} />
  } else if (pathname === '/folders') {
    authenticatedPage = <Folder token={token} onOpenFolder={(id) => navigate(`/folders/${id}`)} />
  } else if (pathname === '/bookmarks') {
    authenticatedPage = <AllBookmarks token={token} userId={currentUser?.user_id ?? null} />
  } else if (pathname === '/evaluate') {
    authenticatedPage = <EvaluatePage token={token} />
  } else if (pathname === '/rag') {
    authenticatedPage = <RagPage token={token} />
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        mode={authMode}
        isSubmitting={isSubmitting}
        error={authError}
        message={authMessage}
        onSubmit={authMode === 'register' ? handleRegister : handleLogin}
        onSwitchMode={(mode) => {
          setAuthError(null)
          setAuthMessage(null)
          navigate(mode === 'register' ? '/register' : '/login')
        }}
      />
    )
  }

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/search', label: 'Search', icon: '🔍' },
    { path: '/folders', label: 'Folders', icon: '📁' },
    { path: '/bookmarks', label: 'Bookmarks', icon: '🔖' },
    // { path: '/evaluate', label: 'Evaluate', icon: '📊' },
    { path: '/rag', label: 'Ask AI', icon: '🤖' },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/90 backdrop-blur-xl shadow-sm">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`group relative rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {/* <span className="mr-1.5">{item.icon}</span> */}
                <span className="relative z-10">{item.label}</span>
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm sm:inline-flex">
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
              className="rounded-full bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl hover:shadow-slate-900/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      {authenticatedPage}
    </div>
  )
}

export default App
