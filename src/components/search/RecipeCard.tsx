import { normalizeImageUrl } from '../../utils/imageUrl'

export type RecipeResult = {
  recipe_id: number
  name: string
  image_url: string | null
  score: number
}

type RecipeCardProps = {
  recipe: RecipeResult
  onOpenRecipe?: (recipeId: number) => void
}

function RecipeCard({ recipe, onOpenRecipe }: RecipeCardProps) {
  const normalizedImageUrl = normalizeImageUrl(recipe.image_url)
  const imageSrc =
    normalizedImageUrl && normalizedImageUrl.trim().length > 0
      ? normalizedImageUrl
      : 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'

  return (
    <article className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl">
      <img src={imageSrc} alt={recipe.name} className="h-44 w-full object-cover" />
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{recipe.name}</h3>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Similarity {recipe.score.toFixed(4)}
        </p>
        <button
          type="button"
          onClick={() => onOpenRecipe?.(recipe.recipe_id)}
          className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          View Detail
        </button>
      </div>
    </article>
  )
}

export default RecipeCard
