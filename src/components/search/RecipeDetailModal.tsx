import { useEffect, useState } from 'react'
import { toProxyImageUrl } from '../../utils/imageUrl'
import { stripWrappingQuotes } from '../../utils/textSanitizer'

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
  onBookmarkSaved?: () => void
  onClose: () => void
}

const API_BASE_URL = 'http://127.0.0.1:8000'

function RecipeDetailModal({
  recipeId,
  token,
  allowBookmark = true,
  onBookmarkSaved,
  onClose,
}: RecipeDetailModalProps) {
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
      onBookmarkSaved?.()
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
    ? toProxyImageUrl(
        recipe.image_url,
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80'
      )
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <section className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/20 animate-scale-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {/* <span className="text-2xl">🍽️</span> */}
            <p className="text-sm font-bold text-slate-700">Recipe Detail</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-slate-700 hover:shadow-xl active:scale-95"
          >
            Close
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
            <p className="mt-4 text-slate-600">Loading recipe detail...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                {/* <span className="text-xl">⚠️</span> */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && recipe && (
          <article>
            {imageSrc && (
              <div className="relative h-80 overflow-hidden">
                <img
                  src={imageSrc}
                  alt={recipe.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            )}

            <div className="space-y-6 p-6 text-left">
              <header className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    #{recipe.recipe_id}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{recipe.name}</h2>
                {recipe.description && <p className="text-slate-600 leading-relaxed">{recipe.description}</p>}
                {allowBookmark && (
                  <button
                    type="button"
                    onClick={handleToggleBookmarkPanel}
                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 ${
                      showBookmarkPanel
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    }`}
                  >
                    {showBookmarkPanel ? '✕ Cancel' : ' Bookmark Recipe'}
                  </button>
                )}
              </header>

              {bookmarkMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <p className="text-sm font-medium text-green-700">{bookmarkMessage}</p>
                  </div>
                </div>
              )}
              {bookmarkError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">⚠️</span>
                    <p className="text-sm font-medium text-red-700">{bookmarkError}</p>
                  </div>
                </div>
              )}

              {allowBookmark && showBookmarkPanel && (
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-5 animate-scale-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span>📁</span> Add Bookmark
                  </h3>

                  {isLoadingFolders && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                      Loading folders...
                    </div>
                  )}
                  {!isLoadingFolders && folderError && (
                    <p className="text-sm font-medium text-red-700">{folderError}</p>
                  )}
                  {!isLoadingFolders && !folderError && folders.length === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm text-amber-700">No folders found. Create a folder first.</p>
                    </div>
                  )}

                  {!isLoadingFolders && folders.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Folder</label>
                        <select
                          value={selectedFolderId ?? ''}
                          onChange={(event) => setSelectedFolderId(Number(event.target.value))}
                          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                        >
                          {folders.map((folder) => (
                            <option key={folder.folder_id} value={folder.folder_id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Rating</label>
                        <select
                          value={rating}
                          onChange={(event) => setRating(Number(event.target.value))}
                          className="h-11 w-24 rounded-lg border border-slate-300 bg-white px-3 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                        >
                          <option value={1}>⭐ 1</option>
                          <option value={2}>⭐ 2</option>
                          <option value={3}>⭐ 3</option>
                          <option value={4}>⭐ 4</option>
                          <option value={5}>⭐ 5</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateBookmark}
                        disabled={isSavingBookmark}
                        className="h-11 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-900/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSavingBookmark ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Saving...
                          </span>
                        ) : (
                          'Save Bookmark'
                        )}
                      </button>
                    </div>
                  )}
                </section>
              )}

              <section className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rating</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recipe.aggregated_rating !== null
                        ? `${recipe.aggregated_rating.toFixed(2)} / 5`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Votes</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recipe.rating_count !== null ? recipe.rating_count : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prep</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recipe.prep_time !== null ? `${recipe.prep_time} min` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cook</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recipe.cook_time !== null ? `${recipe.cook_time} min` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Servings</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recipe.servings !== null ? recipe.servings : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Calories</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recipe.calories !== null ? `${recipe.calories.toFixed(0)} kcal` : 'N/A'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                   Ingredients
                </h3>
                {recipe.ingredients.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-2 pl-6 text-slate-700 sm:grid-cols-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={`${ingredient}-${index}`} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-sm">{stripWrappingQuotes(ingredient)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="whitespace-pre-wrap text-slate-600">
                    {stripWrappingQuotes(recipe.ingredients_text)}
                  </p>
                )}
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                   Steps
                </h3>
                {recipe.steps.length > 0 ? (
                  <ol className="space-y-3 pl-6 text-slate-700">
                    {recipe.steps.map((step, index) => (
                      <li key={`${step}-${index}`} className="flex gap-4">
                        <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-bold text-white shadow-md">
                          {index + 1}
                        </span>
                        <p className="flex-1 pt-1 text-sm leading-relaxed">{stripWrappingQuotes(step)}</p>
                      </li>
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
