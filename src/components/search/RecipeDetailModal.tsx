import { useEffect, useState } from 'react'
import { normalizeImageUrl } from '../../utils/imageUrl'

type RecipeDetailResponse = {
  recipe_id: number
  name: string
  description: string | null
  image_url: string | null
  aggregated_rating: number | null
  rating_count: number | null
  cook_time: number | null
  prep_time: number | null
  servings: number | null
  calories: number | null
  ingredients_text: string
  steps_text: string
  ingredients: string[]
  steps: string[]
}

type FolderResponse = {
  folder_id: number
  name: string
}

type RecipeDetailModalProps = {
  recipeId: number
  token?: string | null
  allowBookmark?: boolean
  onClose: () => void
}

const API_BASE_URL = 'http://127.0.0.1:8000'

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function RecipeDetailModal({ recipeId, token, allowBookmark = true, onClose }: RecipeDetailModalProps) {
  const [recipe, setRecipe] = useState<RecipeDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false)
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [isSavingBookmark, setIsSavingBookmark] = useState(false)
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null)
  const [bookmarkError, setBookmarkError] = useState<string | null>(null)

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const loadFolders = async () => {
    if (!token) {
      setFolders([])
      setFolderError('Please login first to bookmark.')
      return
    }

    setIsLoadingFolders(true)
    setFolderError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load folders.'))
      }

      const data = (await response.json()) as FolderResponse[]
      setFolders(data)
      if (data.length > 0) {
        setSelectedFolderId(data[0].folder_id)
      } else {
        setSelectedFolderId(null)
      }
    } catch (requestError) {
      setFolders([])
      setSelectedFolderId(null)
      setFolderError(requestError instanceof Error ? requestError.message : 'Failed to load folders.')
    } finally {
      setIsLoadingFolders(false)
    }
  }

  const handleToggleBookmarkPanel = async () => {
    const nextOpen = !showBookmarkPanel
    setShowBookmarkPanel(nextOpen)
    setBookmarkMessage(null)
    setBookmarkError(null)
    if (nextOpen) {
      await loadFolders()
    }
  }

  const handleCreateBookmark = async () => {
    if (!token) {
      setBookmarkError('Please login first to bookmark.')
      return
    }
    if (!recipe) {
      setBookmarkError('Recipe detail is not loaded yet.')
      return
    }
    if (!selectedFolderId) {
      setBookmarkError('Please select a folder.')
      return
    }

    setIsSavingBookmark(true)
    setBookmarkError(null)
    setBookmarkMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipe_id: recipe.recipe_id,
          folder_id: selectedFolderId,
          rating,
        }),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to create bookmark.'))
      }

      setShowBookmarkPanel(false)
      setBookmarkMessage('Bookmark added successfully.')
    } catch (requestError) {
      setBookmarkError(
        requestError instanceof Error ? requestError.message : 'Failed to create bookmark.',
      )
    } finally {
      setIsSavingBookmark(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadRecipe = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!response.ok) {
          let message = 'Failed to load recipe details.'
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

        const data = (await response.json()) as RecipeDetailResponse
        if (isMounted) {
          setRecipe(data)
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : 'Unexpected error while loading recipe details.'
          setError(message)
          setRecipe(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRecipe()
    return () => {
      isMounted = false
    }
  }, [recipeId, token])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const imageSrc = recipe
    ? normalizeImageUrl(recipe.image_url) ??
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80'
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close recipe detail"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/20">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">Recipe Detail</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        {isLoading && <p className="p-6 text-slate-600">Loading recipe detail...</p>}
        {!isLoading && error && <p className="p-6 text-red-700">{error}</p>}

        {!isLoading && !error && recipe && (
          <article>
            {imageSrc && <img src={imageSrc} alt={recipe.name} className="h-72 w-full object-cover" />}

            <div className="space-y-6 p-6 text-left">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                  Recipe #{recipe.recipe_id}
                </p>
                <h2 className="text-3xl font-bold text-slate-900">{recipe.name}</h2>
                {recipe.description && <p className="text-slate-600">{recipe.description}</p>}
                {allowBookmark && (
                  <button
                    type="button"
                    onClick={handleToggleBookmarkPanel}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
                  >
                    {showBookmarkPanel ? 'Hide Bookmark' : 'Bookmark'}
                  </button>
                )}
              </header>

              {bookmarkMessage && (
                <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                  {bookmarkMessage}
                </p>
              )}
              {bookmarkError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {bookmarkError}
                </p>
              )}

              {allowBookmark && showBookmarkPanel && (
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Add Bookmark</h3>

                  {isLoadingFolders && <p className="text-sm text-slate-600">Loading folders...</p>}
                  {!isLoadingFolders && folderError && (
                    <p className="text-sm font-medium text-red-700">{folderError}</p>
                  )}
                  {!isLoadingFolders && !folderError && folders.length === 0 && (
                    <p className="text-sm text-slate-600">No folders found. Create a folder first.</p>
                  )}

                  {!isLoadingFolders && folders.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium text-slate-700">Folder</label>
                        <select
                          value={selectedFolderId ?? ''}
                          onChange={(event) => setSelectedFolderId(Number(event.target.value))}
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800"
                        >
                          {folders.map((folder) => (
                            <option key={folder.folder_id} value={folder.folder_id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Rating</label>
                        <select
                          value={rating}
                          onChange={(event) => setRating(Number(event.target.value))}
                          className="h-10 w-24 rounded-lg border border-slate-300 bg-white px-3 text-slate-800"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateBookmark}
                        disabled={isSavingBookmark}
                        className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </section>
              )}

              <section className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Community Rating</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {recipe.aggregated_rating !== null
                      ? `${recipe.aggregated_rating.toFixed(2)} / 5`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rating Count</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {recipe.rating_count !== null ? recipe.rating_count : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prep Time</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {recipe.prep_time !== null ? `${recipe.prep_time} min` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cook Time</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {recipe.cook_time !== null ? `${recipe.cook_time} min` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Servings</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {recipe.servings !== null ? recipe.servings : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Calories</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {recipe.calories !== null ? `${recipe.calories.toFixed(0)} kcal` : 'N/A'}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900">Ingredients</h3>
                {recipe.ingredients.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-6 text-slate-700">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={`${ingredient}-${index}`}>{stripWrappingQuotes(ingredient)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="whitespace-pre-wrap text-slate-600">
                    {stripWrappingQuotes(recipe.ingredients_text)}
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900">Steps</h3>
                {recipe.steps.length > 0 ? (
                  <ol className="list-decimal space-y-2 pl-6 text-slate-700">
                    {recipe.steps.map((step, index) => (
                      <li key={`${step}-${index}`}>{stripWrappingQuotes(step)}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="whitespace-pre-wrap text-slate-600">
                    {stripWrappingQuotes(recipe.steps_text)}
                  </p>
                )}
              </section>
            </div>
          </article>
        )}
      </section>
    </div>
  )
}

export default RecipeDetailModal
