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
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500">
        Searching recipes...
      </p>
    )
  }

  if (!hasSearched) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500">
        Start by typing a query and pressing search.
      </p>
    )
  }

  if (recipes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500">
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
