import { useState } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'

type RagRecipeContext = {
  recipe_id: number
  name: string
  score: number
  ingredients_text: string
  steps_text: string
  image_url: string | null
}

type RagResponse = {
  question: string
  answer: string
  model: string
  retrieved: RagRecipeContext[]
}

type RagPageProps = {
  token: string | null
}

const API_BASE_URL = 'http://127.0.0.1:8000'

function RagPage({ token }: RagPageProps) {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RagResponse | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const handleAsk = async () => {
    const trimmedQuestion = question.trim()
    if (trimmedQuestion.length < 3) {
      setError('Question must be at least 3 characters.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/rag/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          top_k: 5,
        }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to get RAG answer.'))
      }

      const data = (await response.json()) as RagResponse
      setResult(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to get RAG answer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-3 rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 to-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2">
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-600">AI-Powered Recipe Assistant</p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Ask Recipes</h1>
          <p className="text-slate-600">Get intelligent answers about recipes with supporting context from your cookbook.</p>
        </header>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What would you like to know about recipes?
              </label>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="e.g. What can I cook with garlic and chicken? How do I make pasta healthier?"
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 resize-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAsk}
              disabled={isLoading || question.trim().length < 3}
              className="h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-purple-900/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Thinking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>✨</span> Ask AI
                </span>
              )}
            </button>
          </div>
        </section>

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

        {result && (
          <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 to-purple-50/30 p-6 shadow-lg shadow-slate-900/5 animate-scale-in">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-700">
                  🧠 {result.model}
                </span>
              </div>
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-2">Answer</p>
                <p className="whitespace-pre-wrap text-slate-800 leading-relaxed">{result.answer}</p>
              </div>
              {result.retrieved.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-lg">📖</span>
                  <p className="text-sm text-slate-700">
                    Based on{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedRecipeId(result.retrieved[0].recipe_id)}
                      className="font-semibold text-purple-700 underline decoration-purple-700/30 underline-offset-4 hover:text-purple-800 hover:decoration-purple-800/50 transition-all"
                    >
                      supporting recipe context
                    </button>
                    .
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

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

export default RagPage
