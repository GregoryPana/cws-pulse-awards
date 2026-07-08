import { useEffect, useRef } from 'react'
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
}

const activeChip: Record<string, string> = {
  blue: '!bg-blue !border-blue !text-white shadow-lg shadow-blue/35',
  gold: '!bg-gradient-to-r !from-amber !to-gold !border-transparent !text-navy !font-bold shadow-lg shadow-gold/35',
}

const stepperHover: Record<string, string> = {
  blue: 'hover:border-sky/40 hover:text-sky',
  gold: 'hover:border-gold/40 hover:text-gold',
}

export default function PeriodNav({ activeMonth, year, onChange, onYearChange, variant }: Props) {
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

  return (
    <div className="mx-auto mb-8 w-full max-w-[960px] px-4 md:px-8">
      {/* Year stepper */}
      <div className="mb-4 flex items-center justify-center gap-3">
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
      </div>

      {/* Month chips */}
      <nav
        ref={navRef}
        className="w-full overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="mx-auto flex w-max min-w-full items-center justify-center gap-2">
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
                  className={`snap-start inline-flex shrink-0 items-center gap-1 rounded-badge border border-dashed px-4 py-[7px] font-label text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'border-white/25 bg-white/[0.06] text-white/70'
                      : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50'
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
        </div>
      </nav>
    </div>
  )
}
