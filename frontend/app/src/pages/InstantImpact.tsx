import { useState, useMemo } from 'react'
import AnimatedBackground from '../components/shared/AnimatedBackground'
import Header from '../components/layout/Header'
import MonthNav from '../components/shared/MonthNav'
import HallFilters from '../components/shared/HallFilters'
import AwardCard from '../components/shared/AwardCard'
import EmptyState from '../components/shared/EmptyState'
import { useWinners } from '../hooks/useWinners'
import { useSubcategories } from '../hooks/useConfig'

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function filterYears(currentYear: number): number[] {
  const startYear = 2026
  const endYear = Math.max(currentYear, startYear)
  return Array.from({ length: endYear - startYear + 1 }, (_, index) => endYear - index)
}

export default function InstantImpact() {
  const now = new Date()
  const defaultMonth = `${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`
  const [activeMonth, setActiveMonth] = useState(defaultMonth)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedCategory, setSelectedCategory] = useState('All')

  const { winners, state } = useWinners('INSTANT_IMPACT', activeMonth, selectedYear)
  const { subcategories } = useSubcategories('INSTANT_IMPACT')

  const categories = useMemo(
    () => subcategories.map((subcategory) => subcategory.name),
    [subcategories],
  )

  const sorted = useMemo(
    () =>
      winners
        .filter(
          (winner) =>
            selectedCategory === 'All' || winner.subcategory === selectedCategory,
        )
        .sort((a, b) => {
        if (a.golden_ticket && !b.golden_ticket) return -1
        if (!a.golden_ticket && b.golden_ticket) return 1
        return 0
      }),
    [selectedCategory, winners],
  )

  const heroPeriod = activeMonth === 'All' ? `All months in ${selectedYear}` : activeMonth

  return (
    <div className="relative min-h-screen bg-deep overflow-hidden">
      <AnimatedBackground variant="gold" />

      <div className="relative z-10">
        <Header variant="gold" liveLabel="Instant Impact Wall" />

        <section className="text-center px-6 pt-[52px] pb-10">
          <p className="font-label text-[11px] font-semibold tracking-[3.5px] uppercase text-gold mb-4 animate-fadeUp opacity-0 [animation-delay:0.1s]">
            {'\u{1F3C6}'} Manager-to-Staff Recognition
          </p>
          <h1 className="font-display font-black text-[clamp(34px,5.5vw,64px)] leading-[1.05] mb-4 animate-fadeUp opacity-0 [animation-delay:0.25s]">
            Instant<br />
            <span className="bg-gradient-to-r from-gold to-gold-soft bg-clip-text text-transparent">
              Impact
            </span>
          </h1>
          <p className="font-body font-light text-base text-white/50 max-w-[520px] mx-auto mb-8 leading-relaxed animate-fadeUp opacity-0 [animation-delay:0.4s]">
            Recognising the staff members whose actions moved the needle &mdash;
            meeting the highest bar of our Customer Centric Charter.
          </p>
          <div className="inline-flex items-center gap-2 bg-gold/8 border border-gold/20 rounded-[24px] px-5 py-2 animate-fadeUp opacity-0 [animation-delay:0.55s]">
            <span className="font-body text-sm text-white/60 tracking-wide">
              Showing{' '}
              <span className="font-bold text-gold">{heroPeriod}</span>
              {selectedCategory !== 'All' && (
                <span className="hidden sm:inline"> · {selectedCategory}</span>
              )}
            </span>
          </div>
        </section>

        <div className="w-[60px] h-[2px] mx-auto mb-10 bg-gradient-to-r from-transparent via-gold to-transparent animate-fadeUp opacity-0 [animation-delay:0.65s]" />

        <MonthNav
          activeMonth={activeMonth}
          onChange={setActiveMonth}
          variant="gold"
          year={selectedYear}
        />

        <HallFilters
          variant="gold"
          selectedYear={selectedYear}
          years={filterYears(now.getFullYear())}
          onYearChange={(year) => {
            setSelectedYear(year)
            if (activeMonth !== 'All') {
              setActiveMonth(`${activeMonth.slice(0, 3)} ${year}`)
            }
          }}
          selectedCategory={selectedCategory}
          categories={categories}
          onCategoryChange={setSelectedCategory}
        />

        <section className="max-w-[1100px] mx-auto px-8 pb-20">
          {state === 'loading' && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {state === 'error' && (
            <div className="col-span-full text-center py-20 px-6">
              <div className="text-5xl mb-4 opacity-40" aria-hidden="true">
                {'\u{26A0}\u{FE0F}'}
              </div>
              <p className="text-[15px] text-red-400/70 leading-relaxed">
                Failed to load winners. Please try again later.
              </p>
            </div>
          )}

          {state === 'success' && sorted.length === 0 && (
            <EmptyState message="No Instant Impact awards match these filters yet." />
          )}

          {state === 'success' && sorted.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
              {sorted.map((w, i) => (
                <AwardCard
                  key={w.id}
                  winner={w}
                  index={i}
                  variant="gold"
                  awardTypeLabel="Instant Impact"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
