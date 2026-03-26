import type { FormEvent } from 'react'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
}

function SearchBar({ value, onChange, onSubmit, isLoading = false }: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) {
      return
    }
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search recipes, ingredients, or dishes"
          disabled={isLoading}
          className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-2xl bg-amber-500 px-6 font-medium text-slate-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  )
}

export default SearchBar
