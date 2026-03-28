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
  const [topK, setTopK] = useState(5)
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
          top_k: topK,
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
        <header className="space-y-2 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">RAG</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Ask Recipes</h1>
          <p className="text-slate-600">Ask a question and retrieve supporting recipe contexts.</p>
        </header>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="e.g. What can I cook with garlic and chicken?"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800"
              />
            </div>
            {/* <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Top K
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800"
              />
            </div> */}
          </div>
          <button
            type="button"
            onClick={handleAsk}
            disabled={isLoading}
            className="mt-4 h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Asking...' : 'Ask'}
          </button>
        </section>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {result && (
          <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Model</p>
            <p className="text-sm text-slate-700">{result.model}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Answer</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-800">{result.answer}</p>
            {result.retrieved.length > 0 && (
              <p className="mt-3 text-sm text-slate-700">
                You can check the full{' '}
                <button
                  type="button"
                  onClick={() => setSelectedRecipeId(result.retrieved[0].recipe_id)}
                  className="font-semibold text-emerald-700 underline hover:text-emerald-800"
                >
                  recipe here
                </button>
                .
              </p>
            )}
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
