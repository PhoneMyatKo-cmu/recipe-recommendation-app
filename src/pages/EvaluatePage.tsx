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

const API_BASE_URL = 'http://127.0.0.1:8000'

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
        <header className="space-y-2 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Evaluation</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Recommendation Evaluation</h1>
          <p className="text-slate-600">Compare methods with leave-out style Precision@K against the same ground truth.</p>
        </header>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Folder</label>
              <select
                value={folderId ?? ''}
                onChange={(event) => setFolderId(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800"
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
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">K</label>
              <input
                type="number"
                min={1}
                max={100}
                value={k}
                onChange={(event) => setK(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Holdout Count
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={holdoutCount}
                onChange={(event) => setHoldoutCount(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={isLoading}
                className="h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Evaluating...' : 'Run Evaluation'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {result && (
          <>
            <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
              <h2 className="text-xl font-semibold text-slate-900">Evaluation Setup</h2>
              <p className="mt-2 text-sm text-slate-600">Seed recipes: {result.seed_recipe_ids.join(', ') || '-'}</p>
              <p className="mt-1 text-sm text-slate-600">
                Holdout recipes (ground truth): {result.holdout_recipe_ids.join(', ') || '-'}
              </p>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {result.results.map((method) => (
                <article
                  key={method.approach}
                  className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{method.approach.toUpperCase()}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Precision@{result.k}:{' '}
                    <span className="font-semibold text-emerald-700">{method.precision_at_k.toFixed(4)}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Hits: {method.hits}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Recommended Recipe IDs
                  </p>
                  <p className="text-sm text-slate-700">{method.recommended_recipe_ids.join(', ') || '-'}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">Hit Recipe IDs</p>
                  <p className="text-sm text-slate-700">{method.hit_recipe_ids.join(', ') || '-'}</p>
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
