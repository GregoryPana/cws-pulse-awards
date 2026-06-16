interface Props {
  variant: 'blue' | 'gold'
  selectedYear: number
  years: number[]
  onYearChange: (year: number) => void
  selectedCategory: string
  categories: string[]
  onCategoryChange: (category: string) => void
}

const focusStyles: Record<string, string> = {
  blue: 'focus:border-blue focus:ring-blue/20',
  gold: 'focus:border-gold focus:ring-gold/20',
}

export default function HallFilters({
  variant,
  selectedYear,
  years,
  onYearChange,
  selectedCategory,
  categories,
  onCategoryChange,
}: Props) {
  const fieldClass = `
    min-w-0 rounded-btn border border-white/12 bg-white/7 px-3 py-2
    font-body text-sm text-white outline-none transition
    focus:ring-4 ${focusStyles[variant]}
  `

  return (
    <div className="mx-auto mb-9 grid max-w-[680px] grid-cols-1 gap-3 px-8 sm:grid-cols-[160px_1fr]">
      <label className="flex flex-col gap-1.5">
        <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Year
        </span>
        <select
          value={selectedYear}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className={fieldClass}
        >
          {years.map((year) => (
            <option key={year} value={year} className="bg-navy text-white">
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Category
        </span>
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={fieldClass}
        >
          <option value="All" className="bg-navy text-white">
            All categories
          </option>
          {categories.map((category) => (
            <option key={category} value={category} className="bg-navy text-white">
              {category}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
