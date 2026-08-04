import { useState } from 'react'
import type { RecipeCardData } from '../components/shared/RecipeCard'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import RecipeCard from '../components/shared/RecipeCard'
import RecipeCardSkeleton from '../components/shared/RecipeCardSkeleton'
import SearchBar from '../components/search/SearchBar'

type SearchApiResponse = {
  query: string
  normalized_query: string
  corrected_query: string | null
  spell_corrected: boolean
  results: RecipeResult[]
}

type RecipeResult = {
  recipe_id: number
  name: string
  image_url: string | null
  score: number
  rating?: number
  cook_time?: number
  prep_time?: number
}

import { API_BASE_URL } from '../config'
const DEFAULT_TOP_K = 20

type SearchPageProps = {
  token: string | null
}

function SearchPage({ token }: SearchPageProps) {
  const [queryInput, setQueryInput] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [results, setResults] = useState<RecipeResult[]>([])
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null)
  const [spellCorrected, setSpellCorrected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (queryOverride?: string) => {
    const trimmedQuery = (queryOverride ?? queryInput).trim()
    if (!trimmedQuery) {
      setSubmittedQuery('')
      setResults([])
      setError('Please enter a search query.')
      return
    }

    setSubmittedQuery(trimmedQuery)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: trimmedQuery,
          top_k: DEFAULT_TOP_K,
        }),
      })

      if (!response.ok) {
        let message = 'Search failed. Please try again.'
        try {
          const data: { detail?: string } = await response.json()
          if (data.detail) {
            message = data.detail
          }
        } catch {
          // Keep fallback message.
        }
        throw new Error(message)
      }

      const data = (await response.json()) as SearchApiResponse
      setResults(data.results ?? [])
      setCorrectedQuery(data.corrected_query ?? null)
      setSpellCorrected(Boolean(data.spell_corrected))
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unexpected error while searching.'
      setResults([])
      setCorrectedQuery(null)
      setSpellCorrected(false)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const convertToCardData = (item: RecipeResult): RecipeCardData => ({
    recipe_id: item.recipe_id,
    name: item.name,
    image_url: item.image_url,
    score: item.score,
    rating: item.rating,
    cook_time: item.cook_time,
    prep_time: item.prep_time,
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Header */}
        <header className="mb-8 space-y-4 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 p-8 text-white shadow-xl shadow-orange-500/20 animate-fade-in">
          <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
            Recipe Search
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Find your next meal idea
          </h1>
          <p className="max-w-2xl text-lg opacity-90">
            Search through thousands of recipes with smart filtering and ranking
          </p>
        </header>

        {/* Search Bar Section */}
        <section className="mb-8 rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <SearchBar
            value={queryInput}
            onChange={setQueryInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>

        {/* Search Results Info */}
        {submittedQuery && !isLoading && (
          <section className="mb-6 space-y-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-md animate-slide-in">
            <div className="flex items-center gap-2">
              <p className="text-stone-700">
                <span className="font-semibold text-stone-900">{results.length} recipes</span>{' '}
                found for{' '}
                <span className="font-semibold text-orange-700">"{submittedQuery}"</span>
              </p>
            </div>
            {spellCorrected && correctedQuery && (
              <div className="border-t border-orange-200/50 pt-3">
                <div className="flex items-center gap-2">
                  <p className="text-stone-600">
                    Did you mean:{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setQueryInput(correctedQuery)
                        handleSubmit(correctedQuery)
                      }}
                      className="font-semibold text-orange-700 underline decoration-orange-700/30 underline-offset-4 hover:text-orange-800 hover:decoration-orange-800/50 transition-all"
                    >
                      "{correctedQuery}"
                    </button>
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <p className="text-sm font-semibold text-red-700">Search Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} variant="full" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !submittedQuery && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white/80 py-16 text-center">
            <h3 className="text-xl font-semibold text-stone-900">
              Search for recipes
            </h3>
            <p className="mt-2 text-stone-500">
              Enter ingredients, dish names, or cuisines to discover recipes
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && submittedQuery && results.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white/80 py-16">
            <h3 className="text-xl font-semibold text-stone-900">
              No recipes found
            </h3>
            <p className="mt-2 text-stone-500">
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {/* Recipe Results */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((recipe) => (
              <RecipeCard
                key={recipe.recipe_id}
                recipe={convertToCardData(recipe)}
                variant="full"
                showMatchScore={true}
                onOpenRecipe={setSelectedRecipeId}
              />
            ))}
          </div>
        )}
      </div>

      {selectedRecipeId !== null && (
        <RecipeDetailModal
          recipeId={selectedRecipeId}
          token={token}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </main>
  )
}

export default SearchPage
