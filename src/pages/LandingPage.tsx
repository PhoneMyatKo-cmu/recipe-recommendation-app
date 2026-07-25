import { useCallback, useEffect, useState } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import { toProxyImageUrl } from '../utils/imageUrl'

type RecommendationItem = {
  recipe_id: number
  name: string
  image_url: string | null
  score: number
}

type RecommendationResponse = {
  mode: string
  results: RecommendationItem[]
}

type FolderItem = {
  folder_id: number
  name: string
}

type LandingPageProps = {
  token: string | null
  bookmarkCount?: number | null
}

const API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_TOP_K = 8

function LandingPage({ token, bookmarkCount = null }: LandingPageProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [hasBookmarkedThisSession, setHasBookmarkedThisSession] = useState(false)

  const [popularRecs, setPopularRecs] = useState<RecommendationItem[]>([])
  const [allRecs, setAllRecs] = useState<RecommendationItem[]>([])
  const [folderRecs, setFolderRecs] = useState<RecommendationItem[]>([])
  const [randomRecs, setRandomRecs] = useState<RecommendationItem[]>([])

  const [isLoadingPopular, setIsLoadingPopular] = useState(false)
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [isLoadingFolder, setIsLoadingFolder] = useState(false)
  const [isLoadingRandom, setIsLoadingRandom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const shouldShowPopular = bookmarkCount === 0 && !hasBookmarkedThisSession

  const getAuthHeaders = useCallback(
    (): HeadersInit => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  )

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load cookbooks.'))
      }
      const data = (await response.json()) as FolderItem[]
      setFolders(data)
      setSelectedFolderId(data.length > 0 ? data[0].folder_id : null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load cookbooks.')
      setFolders([])
      setSelectedFolderId(null)
    }
  }, [getAuthHeaders])

  const loadAllRecommendations = useCallback(async () => {
    setIsLoadingAll(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE_URL}/recommendations/all?top_k=${DEFAULT_TOP_K}&approach=tfidf`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load recommendations from all cookbooks.'))
      }
      const data = (await response.json()) as RecommendationResponse
      setAllRecs(data.results ?? [])
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load recommendations from all cookbooks.',
      )
      setAllRecs([])
    } finally {
      setIsLoadingAll(false)
    }
  }, [getAuthHeaders])

  const loadPopularRecommendations = useCallback(async () => {
    setIsLoadingPopular(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/popular?top_k=${DEFAULT_TOP_K}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load popular recommendations.'))
      }
      const data = (await response.json()) as RecommendationResponse
      setPopularRecs(data.results ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load popular recommendations.')
      setPopularRecs([])
    } finally {
      setIsLoadingPopular(false)
    }
  }, [getAuthHeaders])

  const loadFolderRecommendations = useCallback(async (folderId: number) => {
    setIsLoadingFolder(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE_URL}/recommendations/folder/${folderId}?top_k=${DEFAULT_TOP_K}&approach=tfidf`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load cookbook recommendations.'))
      }
      const data = (await response.json()) as RecommendationResponse
      setFolderRecs(data.results ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load cookbook recommendations.')
      setFolderRecs([])
    } finally {
      setIsLoadingFolder(false)
    }
  }, [getAuthHeaders])

  const loadRandomRecommendations = useCallback(async () => {
    setIsLoadingRandom(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE_URL}/recommendations/random?top_k=${DEFAULT_TOP_K}&approach=tfidf`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load random recommendations.'))
      }
      const data = (await response.json()) as RecommendationResponse
      setRandomRecs(data.results ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load random recommendations.')
      setRandomRecs([])
    } finally {
      setIsLoadingRandom(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    if (!token) {
      return
    }

    const init = async () => {
      await Promise.all([loadFolders(), loadAllRecommendations(), loadRandomRecommendations()])
    }
    init()
  }, [token, loadAllRecommendations, loadFolders, loadRandomRecommendations])

  useEffect(() => {
    if (!token) {
      return
    }
    if (!shouldShowPopular) {
      setPopularRecs([])
      return
    }
    loadPopularRecommendations()
  }, [token, shouldShowPopular, loadPopularRecommendations])

  useEffect(() => {
    if (bookmarkCount !== 0) {
      setHasBookmarkedThisSession(false)
    }
  }, [bookmarkCount])

  useEffect(() => {
    if (!token || selectedFolderId === null) {
      setFolderRecs([])
      return
    }
    loadFolderRecommendations(selectedFolderId)
  }, [token, selectedFolderId, loadFolderRecommendations])

  const renderCards = (items: RecommendationItem[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-44 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 rounded-lg bg-slate-200" />
                <div className="h-3 w-1/2 rounded-lg bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )
    }
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-slate-100 p-4">
            <span className="text-4xl">🍽️</span>
          </div>
          <p className="mt-4 text-slate-600">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <article
            key={item.recipe_id}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative overflow-hidden">
              <img
                src={
                  toProxyImageUrl(
                    item.image_url,
                  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'
                  ) ?? undefined
                }
                alt={item.name}
                className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="space-y-3 p-4">
              <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {item.name}
              </h3>
              {/* <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                  ★ {item.score.toFixed(3)}
                </span>
              </div> */}
              <button
                type="button"
                onClick={() => setSelectedRecipeId(item.recipe_id)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              >
                View Recipe
              </button>
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Recommendations</p>
          <h1 className="text-4xl font-bold text-slate-900">Food Bookmarking & Recommendation</h1>
          <p className="text-slate-600">Three recommendation categories based on your bookmarks and cookbooks.</p>
        </header>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {shouldShowPopular && (
          <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Popular Right Now</h2>
              <button
                type="button"
                onClick={loadPopularRecommendations}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
            {renderCards(popularRecs, isLoadingPopular, 'No popular recommendations available.')}
          </section>
        )}

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Based on Your Saved Recipes</h2>
            <button
              type="button"
              onClick={loadAllRecommendations}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {renderCards(allRecs, isLoadingAll, 'No recommendations from your bookmarks yet.')}
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Based on a Cookbook You Choose</h2>
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Cookbook</label>
                <select
                  value={selectedFolderId ?? ''}
                  onChange={(event) => setSelectedFolderId(Number(event.target.value))}
                  className="h-10 min-w-52 rounded-lg border border-slate-300 bg-white px-3 text-slate-800"
                  disabled={folders.length === 0}
                >
                  {folders.length === 0 && <option value="">No cookbook available</option>}
                  {folders.map((folder) => (
                    <option key={folder.folder_id} value={folder.folder_id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedFolderId !== null) {
                    loadFolderRecommendations(selectedFolderId)
                  }
                }}
                className="h-10 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>
          {renderCards(folderRecs, isLoadingFolder, 'No recommendations for this cookbook yet.')}
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Discover Something New</h2>
            <button
              type="button"
              onClick={loadRandomRecommendations}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {renderCards(randomRecs, isLoadingRandom, 'No random recommendations available.')}
        </section>
      </section>

      {selectedRecipeId !== null && (
        <RecipeDetailModal
          recipeId={selectedRecipeId}
          token={token}
          onBookmarkSaved={() => setHasBookmarkedThisSession(true)}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </main>
  )
}

export default LandingPage
