import { useState } from 'react'
import { toProxyImageUrl } from '../../utils/imageUrl'
import { ClockIcon, HeartIcon, StarIcon } from './icons'

export type RecipeCardData = {
  recipe_id: number
  name: string
  image_url: string | null
  score?: number
  cook_time?: number | null
  prep_time?: number | null
  rating?: number | null
  rating_count?: number | null
  aggregated_rating?: number | null
}

export type RecipeCardVariant = 'compact' | 'full' | 'minimal'

type RecipeCardProps = {
  recipe: RecipeCardData
  onOpenRecipe?: (recipeId: number) => void
  variant?: RecipeCardVariant
  showMatchScore?: boolean
  onSave?: (recipeId: number) => void
  isSaved?: boolean
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'

function RecipeCard({
  recipe,
  onOpenRecipe,
  variant = 'full',
  showMatchScore = false,
  onSave,
  isSaved = false,
}: RecipeCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHeartFilled, setIsHeartFilled] = useState(isSaved)
  const [isAnimating, setIsAnimating] = useState(false)

  const imageSrc = imageError
    ? DEFAULT_IMAGE
    : toProxyImageUrl(recipe.image_url, DEFAULT_IMAGE) ?? DEFAULT_IMAGE

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsAnimating(true)
    setIsHeartFilled(!isHeartFilled)
    setTimeout(() => setIsAnimating(false), 400)
    onSave?.(recipe.recipe_id)
  }

  const totalCookTime = recipe.cook_time && recipe.prep_time
    ? recipe.cook_time + recipe.prep_time
    : recipe.cook_time || recipe.prep_time

  const difficultyLevel = totalCookTime
    ? totalCookTime < 30
      ? 'Easy'
      : totalCookTime < 60
        ? 'Medium'
        : 'Hard'
    : null

  const displayRating = recipe.aggregated_rating ?? recipe.rating

  // Compact variant for carousels
  if (variant === 'compact') {
    return (
      <article
        className="group relative flex w-72 flex-shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 card-enter"
        onClick={() => onOpenRecipe?.(recipe.recipe_id)}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          <img
            src={imageSrc}
            alt={recipe.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Match Score Badge */}
          {showMatchScore && recipe.score && (
            <div className="absolute left-3 top-3 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-orange-600 shadow-lg">
              {Math.round(recipe.score * 100)}% match
            </div>
          )}

          {/* Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              className={`absolute right-3 top-3 rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                isHeartFilled
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white/80 text-stone-600 hover:bg-white'
              }`}
              aria-label={isHeartFilled ? 'Remove from saved' : 'Save recipe'}
            >
              <HeartIcon className={`h-4 w-4 ${isAnimating ? 'heart-burst' : ''}`} filled={isHeartFilled} />
            </button>
          )}

          {/* Quick Metadata on Image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            {totalCookTime && (
              <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-stone-700">
                <ClockIcon /> {totalCookTime}m
              </div>
            )}
            {displayRating && (
              <div className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-amber-600">
                <StarIcon /> {displayRating.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-stone-900 group-hover:text-orange-700 transition-colors">
            {recipe.name}
          </h3>
          {difficultyLevel && (
            <div className="text-xs text-stone-500">{difficultyLevel}</div>
          )}
        </div>
      </article>
    )
  }

  // Minimal variant for lists
  if (variant === 'minimal') {
    return (
      <article
        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-stone-200 bg-white p-3 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/30"
        onClick={() => onOpenRecipe?.(recipe.recipe_id)}
      >
        <img
          src={imageSrc}
          alt={recipe.name}
          className="h-16 w-16 rounded-lg object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-stone-900 group-hover:text-orange-700">
            {recipe.name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
            {totalCookTime && (
              <span className="flex items-center gap-1">
                <ClockIcon /> {totalCookTime}m
              </span>
            )}
            {displayRating && (
              <span className="flex items-center gap-1 text-amber-600">
                <StarIcon /> {displayRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            className={`rounded-full p-2 transition-all ${
              isHeartFilled
                ? 'bg-red-500 text-white'
                : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
            }`}
            aria-label={isHeartFilled ? 'Remove from saved' : 'Save recipe'}
          >
            <HeartIcon className={`h-4 w-4 ${isAnimating ? 'heart-burst' : ''}`} filled={isHeartFilled} />
          </button>
        )}
      </article>
    )
  }

  // Full variant for grids
  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/15 card-enter"
      onClick={() => onOpenRecipe?.(recipe.recipe_id)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={imageSrc}
          alt={recipe.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Match Score Badge */}
        {showMatchScore && recipe.score && (
          <div className="absolute left-3 top-3 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-orange-600 shadow-lg">
            {Math.round(recipe.score * 100)}% match
          </div>
        )}

        {/* Save Button */}
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            className={`absolute right-3 top-3 rounded-full p-2.5 backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
              isHeartFilled
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-white/80 text-stone-600 hover:bg-white'
            }`}
            aria-label={isHeartFilled ? 'Remove from saved' : 'Save recipe'}
          >
            <HeartIcon className={`h-4 w-4 ${isAnimating ? 'heart-burst' : ''}`} filled={isHeartFilled} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-stone-900 group-hover:text-orange-700 transition-colors">
          {recipe.name}
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {totalCookTime && (
            <div className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-stone-600">
              <ClockIcon />
              <span className="font-medium">{totalCookTime}m</span>
            </div>
          )}
          {difficultyLevel && (
            <div className="rounded-full bg-stone-100 px-2 py-1 font-medium text-stone-600">
              {difficultyLevel}
            </div>
          )}
          {displayRating && (
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-600">
              <StarIcon />
              <span className="font-medium">{displayRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenRecipe?.(recipe.recipe_id)
          }}
          className="mt-auto w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-700 transition-all hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
        >
          View Recipe
        </button>
      </div>
    </article>
  )
}

export default RecipeCard
