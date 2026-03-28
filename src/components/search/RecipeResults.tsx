import RecipeCard, { type RecipeResult } from './RecipeCard'

type RecipeResultsProps = {
  recipes: RecipeResult[]
  hasSearched: boolean
  isLoading?: boolean
  onOpenRecipe?: (recipeId: number) => void
}

function RecipeResults({
  recipes,
  hasSearched,
  isLoading = false,
  onOpenRecipe,
}: RecipeResultsProps) {
  if (isLoading) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-slate-500 shadow-sm">
        Searching recipes...
      </p>
    )
  }

  if (!hasSearched) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-slate-500 shadow-sm">
        Start by typing a query and pressing search.
      </p>
    )
  }

  if (recipes.length === 0) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-slate-500 shadow-sm">
        No recipes found. Try different keywords.
      </p>
    )
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.recipe_id} recipe={recipe} onOpenRecipe={onOpenRecipe} />
      ))}
    </section>
  )
}

export default RecipeResults
