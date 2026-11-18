import { SlidersHorizontal } from 'lucide-react'

interface Props {
  variant: 'blue' | 'gold'
  selectedCategory: string
  categories: string[]
  onCategoryChange: (category: string) => void
}

const focusStyles: Record<string, string> = {
  blue: 'focus:border-blue focus:ring-blue/20',
  gold: 'focus:border-impact focus:ring-impact/20',
}

export default function HallFilters({
  variant,
  selectedCategory,
  categories,
  onCategoryChange,
}: Props) {
  const optionStyle = { backgroundColor: '#07182A', color: '#fff' }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
      <span className="inline-flex shrink-0 items-center gap-1.5 font-label text-[11px] font-semibold uppercase tracking-wider text-white/55">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.2} /> Filter by category
      </span>
      <select
        value={selectedCategory}
        onChange={(event) => onCategoryChange(event.target.value)}
        className={`w-full sm:w-[240px] rounded-btn border border-white/10 bg-[#07182A] px-3 py-2.5 font-body text-sm text-white shadow-inner shadow-black/25 outline-none transition hover:border-white/20 hover:bg-[#0B1C30] focus:ring-4 ${focusStyles[variant]}`}
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
    </div>
  )
}
