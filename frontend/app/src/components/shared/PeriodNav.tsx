import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import {
  LAUNCH_LABEL,
  MONTHS_SHORT,
  canGoToYear,
  monthState,
  periodLabel,
} from '../../lib/dates'

interface Props {
  activeMonth: string
  year: number
  onChange: (month: string) => void
  onYearChange: (year: number) => void
  variant: 'blue' | 'gold'
  /** Optional filter control: sits beside the year stepper on lg+, below the chips otherwise. */
  filter?: ReactNode
}

const activeChip: Record<string, string> = {
  blue: '!bg-blue !border-blue !text-white shadow-lg shadow-blue/35',
  gold: '!bg-gradient-to-r !from-impact-deep !to-impact !border-transparent !text-white !font-bold shadow-lg shadow-impact/35',
}

const stepperHover: Record<string, string> = {
  blue: 'hover:border-sky/40 hover:text-sky',
  gold: 'hover:border-impact/40 hover:text-impact-soft',
}

export default function PeriodNav({ activeMonth, year, onChange, onYearChange, variant, filter }: Props) {
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  const canPrev = canGoToYear(year - 1)
  const canNext = canGoToYear(year + 1)

  const chips = (
    <>
          <button
            type="button"
            onClick={() => onChange('All')}
            aria-pressed={activeMonth === 'All'}
            className={`snap-start shrink-0 rounded-badge border px-4 py-[7px] font-label text-xs font-semibold tracking-wide transition-all duration-200 ${
              activeMonth === 'All'
                ? activeChip[variant]
                : 'border-white/10 bg-[#07182A]/90 text-white/55 shadow-inner shadow-black/20 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#0B1C30] hover:text-white'
            }`}
          >
            Full Year
          </button>

          {MONTHS_SHORT.map((month, index) => {
            const label = periodLabel(year, index)
            const isActive = activeMonth === label
            const state = monthState(year, index)

            if (state === 'future') {
              return (
                <button
                  key={month}
                  type="button"
                  disabled
                  title="This period hasn't happened yet"
                  className="snap-start shrink-0 cursor-not-allowed rounded-badge border border-dashed border-white/[0.06] px-4 py-[7px] font-label text-xs font-semibold tracking-wide text-white/20"
                >
                  {month}
                </button>
              )
            }

            if (state === 'prelaunch') {
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => onChange(label)}
                  aria-pressed={isActive}
                  title={`Before the programme launched (${LAUNCH_LABEL})`}
                  aria-label={`${month} — before the programme launched`}
                  className={`snap-start inline-flex shrink-0 items-center gap-1 rounded-badge border border-dashed px-4 py-[7px] font-label text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'border-white/30 bg-white/[0.08] text-white/80'
                      : 'border-white/20 text-white/50 hover:border-white/30 hover:text-white/70'
                  }`}
                >
                  <Lock className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                  {month}
                </button>
              )
            }

            return (
              <button
                key={month}
                type="button"
                onClick={() => onChange(label)}
                aria-pressed={isActive}
                className={`snap-start shrink-0 rounded-badge border px-4 py-[7px] font-label text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? activeChip[variant]
                    : 'border-white/10 bg-[#07182A]/90 text-white/55 shadow-inner shadow-black/20 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#0B1C30] hover:text-white hover:shadow-lg hover:shadow-black/20'
                }`}
              >
                {month}
              </button>
            )
          })}
    </>
  )

  const rootRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  /* Once the main controls scroll out of view, a compact month bar docks to the top so you can
     switch months without scrolling back up. */
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="mx-auto mb-6 w-full max-w-[1100px] px-4 md:px-8">
      {/* Year stepper */}
      <div className="relative mb-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => canPrev && onYearChange(year - 1)}
          disabled={!canPrev}
          aria-label="Previous year"
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#07182A]/90 text-white/60 shadow-inner shadow-black/20 transition ${stepperHover[variant]} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/60`}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <div className="min-w-[120px] text-center">
          <span className="font-display text-3xl font-bold leading-none text-white">{year}</span>
          <span className="mt-0.5 block font-label text-[10px] font-semibold uppercase tracking-[2px] text-white/35">
            Award Year
          </span>
        </div>

        <button
          type="button"
          onClick={() => canNext && onYearChange(year + 1)}
          disabled={!canNext}
          aria-label="Next year"
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#07182A]/90 text-white/60 shadow-inner shadow-black/20 transition ${stepperHover[variant]} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/60`}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
        </button>

        {filter && (
          <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 lg:block">{filter}</div>
        )}
      </div>

      {/* Month chips */}
      <nav
        ref={navRef}
        className="w-full overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="mx-auto flex w-max min-w-full items-center justify-center gap-2">
          {chips}
        </div>
      </nav>

      {filter && <div className="mx-auto mt-3 max-w-[420px] lg:hidden">{filter}</div>}

      {stuck && (
        <div
          role="navigation"
          aria-label="Quick month switcher"
          className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#050E1C]/90 backdrop-blur-md animate-fadeUp"
        >
          <div className="mx-auto flex max-w-[1100px] items-center gap-3 overflow-x-auto px-4 py-2 scrollbar-none md:px-8" style={{ scrollbarWidth: 'none' }}>
            <span className="shrink-0 font-display text-lg font-bold text-white">{year}</span>
            <div className="mx-auto flex w-max min-w-0 items-center justify-center gap-2">{chips}</div>
          </div>
        </div>
      )}
    </div>
  )
}
