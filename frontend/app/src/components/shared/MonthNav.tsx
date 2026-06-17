import { useRef, useEffect } from 'react'

interface Props {
  activeMonth: string
  onChange: (month: string) => void
  variant: 'blue' | 'gold'
  year: number
}

const MONTHS = [
  'All',
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function monthLabel(m: string, currentYear: number): string {
  if (m === 'All') return 'All'
  return `${m} ${currentYear}`
}

export default function MonthNav({ activeMonth, onChange, variant, year }: Props) {
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

  const activeClass =
    variant === 'blue'
      ? '!bg-blue !border-blue !text-white shadow-lg shadow-blue/35'
      : '!bg-gradient-to-r !from-amber !to-gold !border-transparent !text-navy !font-bold shadow-lg shadow-gold/35'

  return (
    <nav
      ref={navRef}
      className="w-full overflow-x-auto px-4 pb-12 scrollbar-none snap-x snap-mandatory md:px-8"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="mx-auto flex w-max min-w-full items-center justify-center gap-2">
        {MONTHS.map((m) => {
          const label = monthLabel(m, year)
          const isActive = activeMonth === label || (m === 'All' && activeMonth === 'All')
          return (
            <button
              key={m}
              onClick={() => onChange(label)}
              className={`
                snap-start shrink-0 font-label text-xs font-semibold tracking-wide
                px-4 py-[7px] rounded-badge border
                transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? activeClass
                    : 'bg-[#07182A]/90 border-white/8 text-white/55 shadow-inner shadow-black/20 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0B1C30] hover:text-white hover:shadow-lg hover:shadow-black/20'
                }
              `}
              aria-pressed={isActive}
            >
              {m}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
