export type RecipeCardSkeletonVariant = 'compact' | 'full' | 'minimal'

type RecipeCardSkeletonProps = {
  variant?: RecipeCardSkeletonVariant
}

function RecipeCardSkeleton({ variant = 'full' }: RecipeCardSkeletonProps) {
  // Compact variant for carousels
  if (variant === 'compact') {
    return (
      <div className="flex w-72 flex-shrink-0 snap-start flex-col gap-3">
        <div className="aspect-[4/3] rounded-2xl skeleton" />
        <div className="space-y-2 px-1">
          <div className="h-4 w-3/4 rounded-lg skeleton" />
          <div className="h-3 w-1/2 rounded-lg skeleton" />
        </div>
      </div>
    )
  }

  // Minimal variant for lists
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-3">
        <div className="h-16 w-16 rounded-lg skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded-lg skeleton" />
          <div className="h-3 w-24 rounded-lg skeleton" />
        </div>
      </div>
    )
  }

  // Full variant for grids
  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-[4/3] rounded-2xl skeleton" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-full rounded-lg skeleton" />
        <div className="h-4 w-3/4 rounded-lg skeleton" />
        <div className="h-10 rounded-xl skeleton" />
      </div>
    </div>
  )
}

export default RecipeCardSkeleton
