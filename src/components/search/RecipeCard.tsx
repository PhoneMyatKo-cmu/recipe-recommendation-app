import { useState } from 'react'
import { toProxyImageUrl } from '../../utils/imageUrl'

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
  const [imageError, setImageError] = useState(false)
  const fallbackSrc = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'

  const imageSrc = imageError
    ? fallbackSrc
    : toProxyImageUrl(
        recipe.image_url,
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
      ) ?? fallbackSrc

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-900/15">
      <div className="relative overflow-hidden">
        <img
          src={imageSrc}
          alt={recipe.name}
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <button
            type="button"
            onClick={() => onOpenRecipe?.(recipe.recipe_id)}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            View Recipe
          </button>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors duration-200">
          {recipe.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">⭐</span>
            <span className="text-sm font-semibold text-slate-700">{recipe.score.toFixed(3)}</span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Match
          </span>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onOpenRecipe?.(recipe.recipe_id)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 sm:hidden"
          >
            View Detail
          </button>
        </div>
      </div>
    </article>
  )
}

export default RecipeCard
