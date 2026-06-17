import { CalendarDays, SlidersHorizontal } from 'lucide-react'

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
    min-w-0 rounded-btn border border-white/8 bg-[#07182A] px-3 py-2.5
    font-body text-sm text-white shadow-inner shadow-black/25 outline-none transition
    hover:border-white/15 hover:bg-[#0B1C30]
    focus:ring-4 ${focusStyles[variant]}
  `
  const optionStyle = { backgroundColor: '#07182A', color: '#fff' }

  return (
    <div className="mx-auto mb-9 grid max-w-[720px] grid-cols-1 gap-3 rounded-card border border-white/6 bg-deep/35 p-3 shadow-xl shadow-black/15 backdrop-blur sm:grid-cols-[170px_1fr]">
      <label className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 font-label text-[11px] font-semibold uppercase tracking-wider text-white/55">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.2} /> Year
        </span>
        <select
          value={selectedYear}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className={fieldClass}
          style={optionStyle}
        >
          {years.map((year) => (
            <option key={year} value={year} className="bg-[#07182A] text-white" style={optionStyle}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 font-label text-[11px] font-semibold uppercase tracking-wider text-white/55">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.2} /> Category
        </span>
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={fieldClass}
          style={optionStyle}
        >
          <option value="All" className="bg-[#07182A] text-white" style={optionStyle}>
            All categories
          </option>
          {categories.map((category) => (
            <option key={category} value={category} className="bg-[#07182A] text-white" style={optionStyle}>
              {category}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
