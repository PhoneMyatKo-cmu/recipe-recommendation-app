import { useCallback, useEffect, useState } from 'react'
import RecipeDetailModal from '../components/search/RecipeDetailModal'
import { normalizeImageUrl } from '../utils/imageUrl'

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

type FolderItem = {
  folder_id: number
  name: string
}

type LandingPageProps = {
  token: string | null
}

const API_BASE_URL = 'http://127.0.0.1:8000'
const DEFAULT_TOP_K = 8

function LandingPage({ token }: LandingPageProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)

  const [allRecs, setAllRecs] = useState<RecommendationItem[]>([])
  const [folderRecs, setFolderRecs] = useState<RecommendationItem[]>([])
  const [randomRecs, setRandomRecs] = useState<RecommendationItem[]>([])

  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [isLoadingFolder, setIsLoadingFolder] = useState(false)
  const [isLoadingRandom, setIsLoadingRandom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)

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

  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load folders.'))
      }
      const data = (await response.json()) as FolderItem[]
      setFolders(data)
      setSelectedFolderId(data.length > 0 ? data[0].folder_id : null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load folders.')
      setFolders([])
      setSelectedFolderId(null)
    }
  }, [getAuthHeaders])

  const loadAllRecommendations = useCallback(async () => {
    setIsLoadingAll(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/all?top_k=${DEFAULT_TOP_K}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load recommendations from all folders.'))
      }
      const data = (await response.json()) as RecommendationResponse
      setAllRecs(data.results ?? [])
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load recommendations from all folders.',
      )
      setAllRecs([])
    } finally {
      setIsLoadingAll(false)
    }
  }, [getAuthHeaders])

  const loadFolderRecommendations = useCallback(async (folderId: number) => {
    setIsLoadingFolder(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE_URL}/recommendations/folder/${folderId}?top_k=${DEFAULT_TOP_K}`,
        {
          headers: getAuthHeaders(),
        },
      )
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load folder recommendations.'))
      }
      const data = (await response.json()) as RecommendationResponse
      setFolderRecs(data.results ?? [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load folder recommendations.')
      setFolderRecs([])
    } finally {
      setIsLoadingFolder(false)
    }
  }, [getAuthHeaders])

  const loadRandomRecommendations = useCallback(async () => {
    setIsLoadingRandom(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/random?top_k=${DEFAULT_TOP_K}`, {
        headers: getAuthHeaders(),
      })
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
      await Promise.all([loadFolders(), loadAllRecommendations(), loadRandomRecommendations()])
    }
    init()
  }, [token, loadAllRecommendations, loadFolders, loadRandomRecommendations])

  useEffect(() => {
    if (!token || selectedFolderId === null) {
      setFolderRecs([])
      return
    }
    loadFolderRecommendations(selectedFolderId)
  }, [token, selectedFolderId, loadFolderRecommendations])

  const renderCards = (items: RecommendationItem[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return <p className="text-slate-600">Loading recommendations...</p>
    }
    if (items.length === 0) {
      return <p className="text-slate-600">{emptyMessage}</p>
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.recipe_id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <img
              src={
                normalizeImageUrl(item.image_url) ??
                'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'
              }
              alt={item.name}
              className="h-32 w-full object-cover"
            />
            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-amber-700">Score: {item.score.toFixed(4)}</p>
              <button
                type="button"
                onClick={() => setSelectedRecipeId(item.recipe_id)}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                View Detail
              </button>
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-slate-100 px-4 py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Recommendations</p>
          <h1 className="text-4xl font-bold text-slate-900">Food Bookmarking & Recommendation</h1>
          <p className="text-slate-600">Three recommendation categories based on your bookmarks and folders.</p>
        </header>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">From All Folders</h2>
            <button
              type="button"
              onClick={loadAllRecommendations}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {renderCards(allRecs, isLoadingAll, 'No recommendations from your bookmarks yet.')}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">From Specific Folder</h2>
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Folder</label>
                <select
                  value={selectedFolderId ?? ''}
                  onChange={(event) => setSelectedFolderId(Number(event.target.value))}
                  className="h-10 min-w-52 rounded-lg border border-slate-300 bg-white px-3 text-slate-800"
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
              <button
                type="button"
                onClick={() => {
                  if (selectedFolderId !== null) {
                    loadFolderRecommendations(selectedFolderId)
                  }
                }}
                className="h-10 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>
          {renderCards(folderRecs, isLoadingFolder, 'No recommendations for this folder yet.')}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Random Picks</h2>
            <button
              type="button"
              onClick={loadRandomRecommendations}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          {renderCards(randomRecs, isLoadingRandom, 'No random recommendations available.')}
        </section>
      </section>

      {selectedRecipeId !== null && (
        <RecipeDetailModal recipeId={selectedRecipeId} token={token} onClose={() => setSelectedRecipeId(null)} />
      )}
    </main>
  )
}

export default LandingPage
