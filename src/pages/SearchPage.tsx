import { useState } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import RecipeResults from '../components/search/RecipeResults'
import SearchBar from '../components/search/SearchBar'
import type { RecipeResult } from '../components/search/RecipeCard'

type SearchApiResponse = {
  query: string
  normalized_query: string
  corrected_query: string | null
  spell_corrected: boolean
  results: RecipeResult[]
}

const API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_TOP_K = 20

type SearchPageProps = {
  token: string | null
}

function SearchPage({ token }: SearchPageProps) {
  const [queryInput, setQueryInput] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [results, setResults] = useState<RecipeResult[]>([])
  const [normalizedQuery, setNormalizedQuery] = useState('')
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
          // Ignore JSON parse errors and keep fallback message.
        }
        throw new Error(message)
      }

      const data = (await response.json()) as SearchApiResponse
      setResults(data.results ?? [])
      setNormalizedQuery(data.normalized_query ?? '')
      setCorrectedQuery(data.corrected_query ?? null)
      setSpellCorrected(Boolean(data.spell_corrected))
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unexpected error while searching.'
      setResults([])
      setNormalizedQuery('')
      setCorrectedQuery(null)
      setSpellCorrected(false)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 text-left">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-3 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Recipe Search</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find your next meal idea
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Connected to backend endpoint <code>http://127.0.0.1:8000/search</code>
          </p>
        </header>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <SearchBar
            value={queryInput}
            onChange={setQueryInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>

        {submittedQuery && (
          <section className="rounded-3xl border border-white/70 bg-white/85 p-4 text-sm text-slate-700 shadow-sm">
            <p>
              Showing results for:{' '}
              <span className="font-semibold text-slate-900">"{submittedQuery}"</span>
            </p>
            {spellCorrected && correctedQuery && (
              <div className="mt-2 border-t border-slate-200 pt-2">
                <p>
                  Did you mean:{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput(correctedQuery)
                      handleSubmit(correctedQuery)
                    }}
                    className="font-semibold text-amber-700 underline hover:text-amber-800"
                  >
                    "{correctedQuery}"
                  </button>
                </p>
              </div>
            )}
            {normalizedQuery && <p className="mt-1 text-xs text-slate-500">Normalized query: {normalizedQuery}</p>}
          </section>
        )}

        {error && (
          <p className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <RecipeResults
          recipes={results}
          hasSearched={submittedQuery.length > 0}
          isLoading={isLoading}
          onOpenRecipe={setSelectedRecipeId}
        />
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
