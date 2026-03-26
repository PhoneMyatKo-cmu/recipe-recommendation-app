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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <img src={imageSrc} alt={recipe.name} className="h-40 w-full object-cover" />
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{recipe.name}</h3>
        <p className="text-sm text-slate-600">Recipe ID: {recipe.recipe_id}</p>
        <p className="text-sm font-medium text-amber-700">Similarity score: {recipe.score.toFixed(4)}</p>
        <button
          type="button"
          onClick={() => onOpenRecipe?.(recipe.recipe_id)}
          className="mt-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          View Detail
        </button>
      </div>
    </article>
  )
}

export default RecipeCard
