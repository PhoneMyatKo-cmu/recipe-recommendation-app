import { useEffect, useState } from 'react'
import { normalizeImageUrl } from '../../utils/imageUrl'

type RecipeDetailResponse = {
  recipe_id: number
  name: string
  image_url: string | null
  ingredients_text: string
  steps_text: string
  ingredients: string[]
  steps: string[]
}

type RecipeDetailModalProps = {
  recipeId: number
  onClose: () => void
}

const API_BASE_URL = 'http://127.0.0.1:8000'

function RecipeDetailModal({ recipeId, onClose }: RecipeDetailModalProps) {
  const [recipe, setRecipe] = useState<RecipeDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadRecipe = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`)
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
  }, [recipeId])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close recipe detail"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-xl">
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
              </header>

              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900">Ingredients</h3>
                {recipe.ingredients.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-6 text-slate-700">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={`${ingredient}-${index}`}>{ingredient}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="whitespace-pre-wrap text-slate-600">{recipe.ingredients_text}</p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900">Steps</h3>
                {recipe.steps.length > 0 ? (
                  <ol className="list-decimal space-y-2 pl-6 text-slate-700">
                    {recipe.steps.map((step, index) => (
                      <li key={`${step}-${index}`}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="whitespace-pre-wrap text-slate-600">{recipe.steps_text}</p>
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
