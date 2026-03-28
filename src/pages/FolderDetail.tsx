import { useCallback, useEffect, useState } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import { normalizeImageUrl } from '../utils/imageUrl'

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
const DEFAULT_TOP_K = 8

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
          className="w-fit rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Folders
        </button>

        {isLoading ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">Loading folder detail...</p>
        ) : error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : (
          <>
            <header className="space-y-2 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Folder Detail</p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                {folder?.name ?? `Folder #${folderId}`}
              </h1>
            </header>

            <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Bookmarks</h2>
              {bookmarks.length === 0 ? (
                <p className="text-slate-600">This folder is empty.</p>
              ) : (
                <ul className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <li
                      key={bookmark.bookmark_id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <img
                          src={
                            normalizeImageUrl(bookmark.image_url) ??
                            'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={bookmark.recipe_name}
                          className="h-20 w-full rounded-lg object-cover sm:w-32"
                        />
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-slate-900">{bookmark.recipe_name}</p>
                          <p>Rating: {bookmark.rating}/5</p>
                          <p className="text-xs text-slate-500">
                            Added: {new Date(bookmark.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 sm:self-end">
                          <button
                            type="button"
                            onClick={() => setSelectedRecipeId(bookmark.recipe_id)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            View Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBookmark(bookmark.bookmark_id)}
                            disabled={deletingBookmarkId === bookmark.bookmark_id}
                            aria-label={`Delete bookmark for ${bookmark.recipe_name}`}
                            className="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-4 w-4"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Generated Suggestions (LSA)</h2>
                <button
                  type="button"
                  onClick={loadFolderRecommendations}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {hasGeneratedSuggestions ? 'Generate Again' : 'Generate Suggestions'}
                </button>
              </div>

              {isLoadingRecommendations ? (
                <p className="text-slate-600">Generating suggestions...</p>
              ) : !hasGeneratedSuggestions ? (
                <p className="text-slate-600">
                  Click <span className="font-medium">Generate Suggestions</span> to get folder-based recommendations.
                </p>
              ) : recommendationError ? (
                <p className="text-sm font-medium text-red-700">{recommendationError}</p>
              ) : recommendations.length === 0 ? (
                <p className="text-slate-600">No suggestions yet for this folder.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {recommendations.map((item) => (
                    <article
                      key={item.recipe_id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <img
                        src={
                          normalizeImageUrl(item.image_url) ??
                          'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={item.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="space-y-2 p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-xs text-amber-700">Score: {item.score.toFixed(4)}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedRecipeId(item.recipe_id)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View Detail
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
