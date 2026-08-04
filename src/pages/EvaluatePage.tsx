import { useCallback, useEffect, useState } from 'react'

type FolderItem = {
  folder_id: number
  name: string
}

type EvaluateMethodResult = {
  approach: string
  precision_at_k: number
  hits: number
  recommended_recipe_ids: number[]
  hit_recipe_ids: number[]
}

type EvaluateResponse = {
  folder_id: number
  k: number
  holdout_count: number
  seed_recipe_ids: number[]
  holdout_recipe_ids: number[]
  results: EvaluateMethodResult[]
}

type EvaluatePageProps = {
  token: string | null
}

import { API_BASE_URL } from '../config'

function EvaluatePage({ token }: EvaluatePageProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [folderId, setFolderId] = useState<number | null>(null)
  const [k, setK] = useState(20)
  const [holdoutCount, setHoldoutCount] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluateResponse | null>(null)

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const loadFolders = useCallback(async () => {
    if (!token) {
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        return
      }
      const data = (await response.json()) as FolderItem[]
      setFolders(data)
      setFolderId((current) => current ?? (data.length > 0 ? data[0].folder_id : null))
    } catch {
      // Non-critical for eval page.
    }
  }, [token])

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  const handleEvaluate = async () => {
    if (!token) {
      setError('Please login first.')
      return
    }
    if (!folderId) {
      setError('Please select a folder.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const query = new URLSearchParams({
        folder_id: String(folderId),
        k: String(k),
        holdout_count: String(holdoutCount),
      }).toString()

      const response = await fetch(`${API_BASE_URL}/evaluate?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to evaluate recommendation methods.'))
      }
      const data = (await response.json()) as EvaluateResponse
      setResult(data)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to evaluate recommendation methods.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-3 rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 to-purple-50/30 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-600">Evaluation</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Recommendation Evaluation</h1>
          <p className="text-slate-600">Compare recommendation methods with leave-out style Precision@K evaluation.</p>
        </header>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Folder</label>
              <select
                value={folderId ?? ''}
                onChange={(event) => setFolderId(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                disabled={folders.length === 0}
              >
                {folders.length === 0 && <option value="">No folder available</option>}
                {folders.map((folder) => (
                  <option key={folder.folder_id} value={folder.folder_id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">K (Top Items)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={k}
                onChange={(event) => setK(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Holdout Count</label>
              <input
                type="number"
                min={1}
                max={10}
                value={holdoutCount}
                onChange={(event) => setHoldoutCount(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={isLoading}
                className="h-11 w-full rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-purple-900/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Evaluating...
                  </span>
                ) : (
                  'Run Evaluation'
                )}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {result && (
          <>
            <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 shadow-lg shadow-slate-900/5 animate-scale-in">
              <h2 className="text-xl font-semibold text-slate-900">Evaluation Setup</h2>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Seed recipes:</span> {result.seed_recipe_ids.length > 0 ? result.seed_recipe_ids.join(', ') : 'None'}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Holdout recipes (ground truth):</span> {result.holdout_recipe_ids.length > 0 ? result.holdout_recipe_ids.join(', ') : 'None'}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {result.results.map((method, index) => (
                <article
                  key={method.approach}
                  className="group overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900">{method.approach.toUpperCase()}</h3>
                    <div className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                      P@{result.k}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-700">Precision@{result.k}</span>
                        <span className="text-lg font-bold text-purple-900">
                          {(method.precision_at_k * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Hits</span>
                      <span className="font-semibold text-slate-900">{method.hits} / {result.holdout_count}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                        Recommended Recipe IDs
                      </p>
                      <p className="text-sm text-slate-700 break-all">{method.recommended_recipe_ids.length > 0 ? method.recommended_recipe_ids.join(', ') : 'None'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                        Hit Recipe IDs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {method.hit_recipe_ids.length > 0 ? (
                          method.hit_recipe_ids.map((id) => (
                            <span
                              key={id}
                              className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
                            >
                              {id}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default EvaluatePage
