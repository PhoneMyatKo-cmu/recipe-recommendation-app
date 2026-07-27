import { useCallback, useEffect, useState, useRef } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import RecipeCard, { type RecipeCardData } from '../components/shared/RecipeCard'
import RecipeCardSkeleton from '../components/shared/RecipeCardSkeleton'

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

type LandingPageProps = {
  token: string | null
  bookmarkCount?: number | null
}

import { API_BASE_URL } from '../config'
const DEFAULT_TOP_K = 12 // Increased for horizontal carousels

function LandingPage({ token, bookmarkCount = null }: LandingPageProps) {
  const [hasBookmarkedThisSession, setHasBookmarkedThisSession] = useState(false)

  const [popularRecs, setPopularRecs] = useState<RecommendationItem[]>([])
  const [allRecs, setAllRecs] = useState<RecommendationItem[]>([])
  const [randomRecs, setRandomRecs] = useState<RecommendationItem[]>([])

  const [isLoadingPopular, setIsLoadingPopular] = useState(false)
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [isLoadingRandom, setIsLoadingRandom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const shouldShowPopular = bookmarkCount === 0 && !hasBookmarkedThisSession

  // Get user greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

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
      await Promise.all([loadAllRecommendations(), loadRandomRecommendations()])
    }
    init()
  }, [token, loadAllRecommendations, loadRandomRecommendations])

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

  // Horizontal Carousel Component
  const Carousel = ({
    title,
    items,
    isLoading,
    emptyMessage,
    showMatchScore = false,
    onRefresh,
  }: {
    title: string
    items: RecommendationItem[]
    isLoading: boolean
    emptyMessage: string
    showMatchScore?: boolean
    onRefresh?: () => void
  }) => {
    const [scrollPosition, setScrollPosition] = useState(0)
    const carouselRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
      if (carouselRef.current) {
        const scrollAmount = 300
        const newPosition =
          direction === 'left'
            ? scrollPosition - scrollAmount
            : scrollPosition + scrollAmount
        carouselRef.current.scrollTo({
          left: newPosition,
          behavior: 'smooth',
        })
        setScrollPosition(newPosition)
      }
    }

    const convertToRecipeCardData = (item: RecommendationItem): RecipeCardData => ({
      recipe_id: item.recipe_id,
      name: item.name,
      image_url: item.image_url,
      score: item.score,
    })

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-stone-900">{title}</h2>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
              >
                🔄
              </button>
            )}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="rounded-full border border-stone-300 p-2 hover:bg-stone-100 disabled:opacity-30"
                disabled={scrollPosition <= 0}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="rounded-full border border-stone-300 p-2 hover:bg-stone-100 disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto hide-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <RecipeCardSkeleton key={i} variant="compact" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 py-12">
            <span className="text-4xl">🍽️</span>
            <p className="mt-3 text-stone-500">{emptyMessage}</p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto hide-scrollbar snap-x-mandatory pb-4"
            onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
          >
            {items.map((item) => (
              <RecipeCard
                key={item.recipe_id}
                recipe={convertToRecipeCardData(item)}
                variant="compact"
                showMatchScore={showMatchScore}
                onOpenRecipe={setSelectedRecipeId}
              />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 p-8 text-white shadow-2xl shadow-orange-500/20 animate-fade-in">
          <div className="relative z-10">
            <p className="mb-2 text-lg font-medium opacity-90">
              {getGreeting()}! Ready to cook something amazing?
            </p>
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
              Your Personal Recipe Collection
            </h1>
            <p className="max-w-2xl text-lg opacity-90">
              Discover recipes tailored to your taste. Save your favorites and get personalized
              recommendations every time you visit.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <span className="text-xl">📖</span>
                <span className="font-semibold">{bookmarkCount ?? 0} recipes saved</span>
              </div>
              <button
                type="button"
                onClick={() => window.location.href = '/search'}
                className="rounded-full bg-white px-6 py-2.5 font-semibold text-orange-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Explore Recipes →
              </button>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
            <span className="text-[200px]">🍳</span>
          </div>
        </section>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Carousels */}
        <div className="space-y-8">
          {shouldShowPopular && (
            <Carousel
              title="🔥 Trending This Week"
              items={popularRecs}
              isLoading={isLoadingPopular}
              emptyMessage="No trending recipes available."
              showMatchScore={false}
              onRefresh={loadPopularRecommendations}
            />
          )}

          <Carousel
            title="✨ Picked For You"
            items={allRecs}
            isLoading={isLoadingAll}
            emptyMessage="Start saving recipes to get personalized recommendations!"
            showMatchScore={true}
            onRefresh={loadAllRecommendations}
          />

          <Carousel
            title="🎲 Discover Something New"
            items={randomRecs}
            isLoading={isLoadingRandom}
            emptyMessage="No recipes available."
            showMatchScore={false}
            onRefresh={loadRandomRecommendations}
          />
        </div>
      </div>

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
