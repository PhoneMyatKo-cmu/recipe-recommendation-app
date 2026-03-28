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
          className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 text-slate-800 placeholder:text-slate-400 outline-none ring-emerald-200 transition focus:ring-4"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-2xl bg-slate-900 px-6 font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  )
}

export default SearchBar
