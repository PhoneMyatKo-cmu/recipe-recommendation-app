import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import { toProxyImageUrl } from '../utils/imageUrl'

// Custom hook for scroll reveal animation
function useScrollReveal(itemCount: number) {
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            const dataIndex = Number(target.dataset.index)
            setRevealedIndexes((prev) => new Set([...prev, dataIndex]))
            observerRef.current?.unobserve(target)
          }
        })
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    )

    // Observe all current elements
    elementRefs.current.forEach((element) => {
      if (element) {
        observerRef.current?.observe(element)
      }
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [itemCount])

  const setElementRef = useCallback((index: number) => (element: HTMLElement | null) => {
    elementRefs.current[index] = element
    if (element && observerRef.current) {
      observerRef.current.observe(element)
    }
  }, [])

  return { revealedIndexes, setElementRef }
}

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
  const [groupByFolder, setGroupByFolder] = useState(false)

  // Scroll reveal animation
  const { revealedIndexes, setElementRef } = useScrollReveal(items.length)

  const groupedFolders = useMemo(() => {
    const grouped = new Map<
      number,
      {
        folder_id: number
        folder_name: string
        average_user_rating: number
        bookmarks: BookmarkCommunityRankResponse[]
      }
    >()

    for (const bookmark of items) {
      const existing = grouped.get(bookmark.folder_id)
      if (existing) {
        existing.bookmarks.push(bookmark)
      } else {
        grouped.set(bookmark.folder_id, {
          folder_id: bookmark.folder_id,
          folder_name: bookmark.folder_name,
          average_user_rating: 0,
          bookmarks: [bookmark],
        })
      }
    }

    const groups = Array.from(grouped.values()).map((group) => {
      const sumRatings = group.bookmarks.reduce((sum, bookmark) => sum + bookmark.rating, 0)
      const average = group.bookmarks.length > 0 ? sumRatings / group.bookmarks.length : 0
      const sortedBookmarks = [...group.bookmarks].sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      return {
        ...group,
        average_user_rating: average,
        bookmarks: sortedBookmarks,
      }
    })

    return groups.sort((a, b) => {
      if (b.average_user_rating !== a.average_user_rating) {
        return b.average_user_rating - a.average_user_rating
      }
      return b.bookmarks.length - a.bookmarks.length
    })
  }, [items])

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
        <header className="space-y-3 rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 to-amber-50/30 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3">
            {/* <div className="rounded-full bg-amber-100 p-2">
              <span className="text-2xl">🔖</span>
            </div> */}
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Bookmarks</p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">All Bookmarks</h1>
          <p className="text-slate-600">Your saved recipes, ranked by community rating and popularity.</p>
        </header>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span>⭐</span> {groupByFolder ? 'Group By Folder' : 'Community Ranked'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGroupByFolder((prev) => !prev)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-95"
              >
                {groupByFolder ? 'Ungroup' : 'Group by Folder'}
              </button>
              <button
                type="button"
                onClick={loadBookmarks}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-95"
              >
                Refresh
              </button>
            </div>
          </div>

          {!userId ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
              <p className="mt-4 text-slate-600">Loading user profile...</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
              <p className="mt-4 text-slate-600">Loading bookmarks...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              {/* <div className="rounded-full bg-slate-100 p-4">
                <span className="text-4xl">🔖</span>
              </div> */}
              <p className="mt-4 text-slate-600">No bookmarks found yet.</p>
              <p className="mt-2 text-sm text-slate-500">Start exploring recipes and bookmark your favorites!</p>
            </div>
          ) : groupByFolder ? (
            <div className="space-y-4">
              {groupedFolders.map((folderGroup) => (
                <section
                  key={folderGroup.folder_id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{folderGroup.folder_name}</h3>
                      <p className="text-sm text-slate-600">
                        Average user rating: ⭐ {folderGroup.average_user_rating.toFixed(2)} / 5
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {folderGroup.bookmarks.length} bookmark{folderGroup.bookmarks.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {folderGroup.bookmarks.map((item) => (
                      <li key={item.bookmark_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex gap-3">
                          <img
                            src={
                              toProxyImageUrl(
                                item.image_url,
                                'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=500&q=80',
                              ) ?? undefined
                            }
                            alt={item.recipe_name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 font-semibold text-slate-900">{item.recipe_name}</p>
                            <p className="text-xs text-slate-500 mt-1">Your rating: ⭐ {item.rating}/5</p>
                            <div className="mt-1">
                              <StarRating rating={item.aggregated_rating} />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedRecipeId(item.recipe_id)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
                          >
                            View
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4">
              {items.map((item, index) => {
                const isRevealed = revealedIndexes.has(index)
                return (
                <li
                  key={item.bookmark_id}
                  ref={setElementRef(index)}
                  data-index={index}
                  className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 ${
                    isRevealed ? 'animate-fade-in' : 'scroll-reveal'
                  }`}
                  style={{ animationDelay: isRevealed ? `${index * 50}ms` : undefined }}
                >
                  <div className="flex gap-4">
                    <img
                      src={
                        toProxyImageUrl(
                          item.image_url,
                          'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=500&q=80',
                        ) ?? undefined
                      }
                      alt={item.recipe_name}
                      className="h-28 w-28 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {item.recipe_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          📁 {item.folder_name}
                        </span>
                      </div>
                      <div className="mt-auto">
                        <p className="text-xs text-slate-500">Your rating: ⭐ {item.rating}/5</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Community Rating</p>
                      <StarRating rating={item.aggregated_rating} />
                      <p className="text-xs text-slate-500 mt-1">{item.rating_count ?? 0} votes</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipeId(item.recipe_id)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
                    >
                      View Recipe
                    </button>
                  </div>
                </li>
                )
              })}
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
