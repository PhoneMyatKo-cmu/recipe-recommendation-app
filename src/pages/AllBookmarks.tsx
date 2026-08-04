import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import RecipeCard, { type RecipeCardData } from '../components/shared/RecipeCard'
import RecipeCardSkeleton from '../components/shared/RecipeCardSkeleton'
import { BookOpenIcon } from '../components/shared/icons'

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

import { API_BASE_URL } from '../config'

function StarRating({ rating }: { rating: number | null }) {
  const safeRating = rating ?? 0
  const fullStars = Math.max(0, Math.min(5, Math.round(safeRating)))

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < fullStars ? 'text-amber-500' : 'text-stone-300'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-stone-500">{rating !== null ? rating.toFixed(2) : 'N/A'}</span>
    </div>
  )
}

function AllBookmarks({ token, userId }: AllBookmarksProps) {
  const [items, setItems] = useState<BookmarkCommunityRankResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [groupByFolder, setGroupByFolder] = useState(false)

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

  const convertToCardData = (item: BookmarkCommunityRankResponse): RecipeCardData => ({
    recipe_id: item.recipe_id,
    name: item.recipe_name,
    image_url: item.image_url,
    score: item.rating / 5, // Normalize rating to 0-1
    rating: item.aggregated_rating ?? undefined,
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 space-y-4 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 p-8 text-white shadow-xl shadow-orange-500/20 animate-fade-in">
          <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
            My Bookmarks
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Your Saved Recipes
          </h1>
          <p className="max-w-2xl text-lg opacity-90">
            All your favorite recipes in one place, ranked by community ratings and popularity.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
              <span className="font-semibold">{items.length} recipes</span>
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Controls */}
        <section className="mb-6 rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-lg backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-stone-900">
              {items.length} Saved Recipes
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGroupByFolder((prev) => !prev)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  groupByFolder
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {groupByFolder ? 'Grouped by Cookbook' : 'Group by Cookbook'}
              </button>
              <button
                type="button"
                onClick={loadBookmarks}
                disabled={isLoading}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} variant="full" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/50 py-16">
            <h3 className="text-xl font-semibold text-stone-900">
              No Bookmarks Yet
            </h3>
            <p className="mt-2 text-stone-500">
              Start exploring recipes and bookmark your favorites!
            </p>
          </div>
        )}

        {/* Grouped View */}
        {!isLoading && items.length > 0 && groupByFolder && (
          <div className="space-y-8">
            {groupedFolders.map((folderGroup) => (
              <section
                key={folderGroup.folder_id}
                className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-lg backdrop-blur-xl"
              >
                <div className="mb-6 flex items-center justify-between border-b border-stone-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-3 text-white shadow-lg shadow-orange-500/20">
                      <BookOpenIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">{folderGroup.folder_name}</h3>
                      <p className="text-sm text-stone-600">
                        {folderGroup.average_user_rating.toFixed(2)} avg rating • {folderGroup.bookmarks.length} recipes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {folderGroup.bookmarks.map((item) => (
                    <RecipeCard
                      key={item.bookmark_id}
                      recipe={convertToCardData(item)}
                      variant="full"
                      showMatchScore={false}
                      onOpenRecipe={setSelectedRecipeId}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Grid View */}
        {!isLoading && items.length > 0 && !groupByFolder && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, index) => {
              const isRevealed = revealedIndexes.has(index)
              return (
                <div
                  key={item.bookmark_id}
                  ref={setElementRef(index)}
                  data-index={index}
                  className={isRevealed ? 'card-enter' : 'scroll-reveal'}
                >
                  <RecipeCard
                    recipe={convertToCardData(item)}
                    variant="full"
                    showMatchScore={false}
                    onOpenRecipe={setSelectedRecipeId}
                  />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <span className="truncate max-w-[120px]">{item.folder_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating rating={item.aggregated_rating} />
                      <span className="text-xs text-stone-400">({item.rating_count ?? 0})</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
