import { useCallback, useEffect, useState } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import { toProxyImageUrl } from '../utils/imageUrl'

type FolderResponse = {
  folder_id: number
  user_id: number
  name: string
  created_at: string
}

type BookmarkItem = {
  bookmark_id: number
  recipe_id: number
  recipe_name: string
  image_url: string | null
  folder_id: number
  folder_name: string
  rating: number
  created_at: string
}

type RecommendationItem = {
  recipe_id: number
  name: string
  image_url: string | null
  score: number
}

type RecommendationResponse = {
  mode: string
  approach: string
  results: RecommendationItem[]
}

type FolderDetailProps = {
  token: string | null
  folderId: number
  onBack: () => void
}

const API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_TOP_K = 10

function FolderDetail({ token, folderId, onBack }: FolderDetailProps) {
  const [folder, setFolder] = useState<FolderResponse | null>(null)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [deletingBookmarkId, setDeletingBookmarkId] = useState<number | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(null)
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const loadFolderDetail = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [folderResponse, bookmarkResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/folders/${folderId}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/bookmarks?folder_id=${folderId}`, { headers: getAuthHeaders() }),
      ])

      if (!folderResponse.ok) {
        throw new Error(await getErrorMessage(folderResponse, 'Failed to load folder detail.'))
      }
      if (!bookmarkResponse.ok) {
        throw new Error(await getErrorMessage(bookmarkResponse, 'Failed to load folder bookmarks.'))
      }

      const folderData = (await folderResponse.json()) as FolderResponse
      const bookmarkData = (await bookmarkResponse.json()) as BookmarkItem[]

      setFolder(folderData)
      setBookmarks(Array.isArray(bookmarkData) ? bookmarkData : [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load folder detail.')
      setFolder(null)
      setBookmarks([])
    } finally {
      setIsLoading(false)
    }
  }, [folderId, getAuthHeaders])

  const loadFolderRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    setRecommendationError(null)
    setHasGeneratedSuggestions(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/folders/${folderId}/recommendations?top_k=${DEFAULT_TOP_K}`,
        { headers: getAuthHeaders() },
      )
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load folder suggestions.'))
      }
      const data = (await response.json()) as RecommendationResponse
      setRecommendations(data.results ?? [])
    } catch (requestError) {
      setRecommendationError(
        requestError instanceof Error ? requestError.message : 'Failed to load folder suggestions.',
      )
      setRecommendations([])
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [folderId, getAuthHeaders])

  useEffect(() => {
    if (!token) {
      return
    }
    loadFolderDetail()
  }, [token, loadFolderDetail])

  const handleDeleteBookmark = async (bookmarkId: number) => {
    setDeletingBookmarkId(bookmarkId)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to delete bookmark.'))
      }

      setBookmarks((prev) => prev.filter((bookmark) => bookmark.bookmark_id !== bookmarkId))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete bookmark.')
    } finally {
      setDeletingBookmarkId(null)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <button
          type="button"
          onClick={onBack}
          className="w-fit rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
        >
          ← Back to Folders
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-slate-600">Loading folder detail...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="space-y-3 rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 to-blue-50/30 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <span className="text-2xl">📁</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Folder Detail</p>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                {folder?.name ?? `Folder #${folderId}`}
              </h1>
            </header>

            <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                   Bookmarks ({bookmarks.length})
                </h2>
              </div>
              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  {/* <div className="rounded-full bg-slate-100 p-4">
                    <span className="text-4xl">🔖</span>
                  </div> */}
                  <p className="mt-4 text-slate-600">This folder is empty.</p>
                  <p className="mt-2 text-sm text-slate-500">Search and bookmark recipes to get started!</p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {bookmarks.map((bookmark, index) => (
                    <li
                      key={bookmark.bookmark_id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex gap-4">
                        <img
                          src={
                            toProxyImageUrl(
                              bookmark.image_url,
                            'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80'
                            ) ?? undefined
                          }
                          alt={bookmark.recipe_name}
                          className="h-28 w-28 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {bookmark.recipe_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              ⭐ {bookmark.rating}/5
                            </span>
                          </div>
                          <div className="mt-auto flex items-center gap-1 text-xs text-slate-500">
                            {/* <span>📅</span> */}
                            {new Date(bookmark.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRecipeId(bookmark.recipe_id)}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                        >
                          View Recipe
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBookmark(bookmark.bookmark_id)}
                          disabled={deletingBookmarkId === bookmark.bookmark_id}
                          aria-label={`Delete bookmark for ${bookmark.recipe_name}`}
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-all duration-200 hover:bg-red-50 hover:border-red-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingBookmarkId === bookmark.bookmark_id ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                              Deleting...
                            </span>
                          ) : (
                            'Remove'
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <span>✨</span> Generated Suggestions
                </h2>
                <button
                  type="button"
                  onClick={loadFolderRecommendations}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                >
                  {hasGeneratedSuggestions ? 'Generate Again' : '✨ Generate Suggestions'}
                </button>
              </div>

              {isLoadingRecommendations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <p className="mt-4 text-slate-600">Generating suggestions...</p>
                </div>
              ) : !hasGeneratedSuggestions ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-slate-100 p-4">
                    <span className="text-4xl">💡</span>
                  </div>
                  <p className="mt-4 text-slate-600">
                    Click <span className="font-semibold text-slate-900">Generate Suggestions</span> to get personalized recommendations based on this folder's content.
                  </p>
                </div>
              ) : recommendationError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">⚠️</span>
                    <p className="text-sm font-medium text-red-700">{recommendationError}</p>
                  </div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  {/* <div className="rounded-full bg-slate-100 p-4">
                    <span className="text-4xl">📭</span>
                  </div> */}
                  <p className="mt-4 text-slate-600">No suggestions available for this folder yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {recommendations.map((item, index) => (
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>
                      <div className="space-y-3 p-4">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            ★ {item.score.toFixed(3)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRecipeId(item.recipe_id)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                        >
                          View Recipe
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {selectedRecipeId !== null && (
        <RecipeDetailModal
          recipeId={selectedRecipeId}
          token={token}
          allowBookmark={false}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </main>
  )
}

export default FolderDetail
