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
      className="flex items-center gap-2 px-8 pb-12 overflow-x-auto scrollbar-none snap-x snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
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
                  : 'bg-mist border-white/12 text-white/50 hover:border-white/30 hover:text-white'
              }
            `}
            aria-pressed={isActive}
          >
            {m}
          </button>
        )
      })}
    </nav>
  )
}
