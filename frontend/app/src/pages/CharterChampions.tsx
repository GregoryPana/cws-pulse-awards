import { useState, useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Agreement01Icon } from '@hugeicons/core-free-icons'
import { useStaggerReveal } from '../lib/animations'
import { MONTHS_SHORT, currentMonthIndex, currentYear, isPreLaunch } from '../lib/dates'
import AnimatedBackground from '../components/shared/AnimatedBackground'
import Header from '../components/layout/Header'
import PeriodNav from '../components/shared/PeriodNav'
import HallFilters from '../components/shared/HallFilters'
import AwardCard from '../components/shared/AwardCard'
import EmptyState from '../components/shared/EmptyState'
import PreLaunchNotice from '../components/shared/PreLaunchNotice'
import { useWinners } from '../hooks/useWinners'
import { useSubcategories } from '../hooks/useConfig'

export default function CharterChampions() {
  const defaultMonth = `${MONTHS_SHORT[currentMonthIndex()]} ${currentYear()}`
  const [activeMonth, setActiveMonth] = useState(defaultMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear())
  const [selectedCategory, setSelectedCategory] = useState('All')

  const preLaunch = isPreLaunch(activeMonth)
  const { winners, state } = useWinners('CHARTER_CHAMPION', activeMonth, selectedYear)
  const { subcategories } = useSubcategories('CHARTER_CHAMPION')

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
  const gridRef = useStaggerReveal<HTMLDivElement>('[data-card]', [sorted])

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    if (activeMonth !== 'All') {
      setActiveMonth(`${activeMonth.slice(0, 3)} ${year}`)
    }
  }

  return (
    <div className="relative min-h-screen bg-navy-deep overflow-hidden">
      <AnimatedBackground variant="blue" />

      <div className="relative z-10">
        <Header variant="blue" liveLabel="Charter Champions Wall" />

        <section className="text-center px-6 pt-[52px] pb-10">
          <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-badge border border-gold/25 bg-gold/10 px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[3px] text-gold animate-fadeUp opacity-0 [animation-delay:0.1s]">
            <HugeiconsIcon icon={Agreement01Icon} size={16} strokeWidth={2} aria-hidden="true" /> Peer-to-Peer Recognition
          </p>
          <h1 className="font-display font-black text-[clamp(36px,6vw,68px)] leading-[1.05] tracking-tight mb-4 animate-fadeUp opacity-0 [animation-delay:0.25s]">
            Charter<br />
            <span className="text-gold">Champions</span>
          </h1>
          <p className="font-body font-light text-base text-white/55 max-w-[520px] mx-auto mb-8 leading-relaxed animate-fadeUp opacity-0 [animation-delay:0.4s]">
            Celebrating the colleagues who go the extra mile &mdash; living our
            Customer Centric Charter every single day.
          </p>
          <div className="inline-flex items-center gap-2 rounded-badge border border-white/[0.08] bg-[#07182A]/90 px-5 py-2 shadow-xl shadow-black/20 backdrop-blur animate-fadeUp opacity-0 [animation-delay:0.55s]">
            <span className="font-body text-sm text-white/70 tracking-wide">
              Showing{' '}
              <span className="font-bold text-gold">{heroPeriod}</span>
              {selectedCategory !== 'All' && (
                <span className="hidden sm:inline"> · {selectedCategory}</span>
              )}
            </span>
          </div>
        </section>

        <div className="w-[60px] h-[2px] mx-auto mb-10 bg-gradient-to-r from-transparent via-gold to-transparent animate-fadeUp opacity-0 [animation-delay:0.65s]" />

        <PeriodNav
          activeMonth={activeMonth}
          year={selectedYear}
          onChange={setActiveMonth}
          onYearChange={handleYearChange}
          variant="blue"
        />

        <HallFilters
          variant="blue"
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
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-300/70" aria-hidden="true">
                <TriangleAlert className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <p className="text-[15px] text-red-400/70 leading-relaxed">
                Failed to load winners. Please try again later.
              </p>
            </div>
          )}

          {state === 'success' && sorted.length === 0 && preLaunch && (
            <PreLaunchNotice period={activeMonth} />
          )}

          {state === 'success' && sorted.length === 0 && !preLaunch && (
            <EmptyState message="No Champions match these filters yet." />
          )}

          {state === 'success' && sorted.length > 0 && (
            <div ref={gridRef} className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
              {sorted.map((w) => (
                <AwardCard
                  key={w.id}
                  winner={w}
                  variant="blue"
                  awardTypeLabel="Charter Champion"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
