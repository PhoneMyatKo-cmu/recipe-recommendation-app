import { useCallback, useEffect, useState } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import { toProxyImageUrl } from '../utils/imageUrl'

type BookmarkCommunityRankResponse = {
  bookmark_id: number
  recipe_id: number
  recipe_name: string
  image_url: string | null
  folder_id: number
  folder_name: string
  rating: number
  aggregated_rating: number | null
  rating_count: number | null
  created_at: string
}

type AllBookmarksProps = {
  token: string | null
  userId: number | null
}

const API_BASE_URL = 'http://127.0.0.1:8000'

function StarRating({ rating }: { rating: number | null }) {
  const safeRating = rating ?? 0
  const fullStars = Math.max(0, Math.min(5, Math.round(safeRating)))

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < fullStars ? 'text-amber-500' : 'text-slate-300'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-slate-500">{rating !== null ? rating.toFixed(2) : 'N/A'}</span>
    </div>
  )
}

function AllBookmarks({ token, userId }: AllBookmarksProps) {
  const [items, setItems] = useState<BookmarkCommunityRankResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const loadBookmarks = useCallback(async () => {
    if (!token || !userId) {
      setItems([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/bookmarks/user/${userId}/community-ranked`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load bookmarks.'))
      }
      const data = (await response.json()) as BookmarkCommunityRankResponse[]
      setItems(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load bookmarks.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [token, userId])

  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Bookmarks</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">All Bookmarks</h1>
          <p className="text-slate-600">Sorted by community rating and recipe popularity.</p>
        </header>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Community Ranked</h2>
            <button
              type="button"
              onClick={loadBookmarks}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {!userId ? (
            <p className="text-slate-600">Loading user profile...</p>
          ) : isLoading ? (
            <p className="text-slate-600">Loading bookmarks...</p>
          ) : items.length === 0 ? (
            <p className="text-slate-600">No bookmarks found.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.bookmark_id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <img
                      src={
                        toProxyImageUrl(
                          item.image_url,
                          'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=500&q=80',
                        ) ?? undefined
                      }
                      alt={item.recipe_name}
                      className="h-24 w-full rounded-xl object-cover sm:w-40"
                    />
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">{item.recipe_name}</h3>
                      <p className="text-sm text-slate-600">Folder: {item.folder_name}</p>
                      <p className="text-sm text-slate-600">Your rating: {item.rating}/5</p>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Community Rating
                        </p>
                        <StarRating rating={item.aggregated_rating} />
                        <p className="text-xs text-slate-500">Votes: {item.rating_count ?? 0}</p>
                      </div>
                    </div>
                    <div className="sm:self-end">
                      <button
                        type="button"
                        onClick={() => setSelectedRecipeId(item.recipe_id)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View Detail
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

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

export default AllBookmarks
