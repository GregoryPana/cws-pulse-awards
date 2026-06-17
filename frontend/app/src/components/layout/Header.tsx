import { Link, useLocation } from 'react-router-dom'
import CwsLogoMark from '../shared/CwsLogoMark'

interface Props {
  variant: 'blue' | 'gold'
  liveLabel: string
}

export default function Header({ variant, liveLabel }: Props) {
  const { pathname } = useLocation()

  return (
    <header className="flex items-center justify-between flex-wrap gap-4 px-8 md:px-12 pt-8">
      <Link to="/charter-champions" className="no-underline transition duration-200 hover:scale-[1.01]">
        <CwsLogoMark variant={variant} />
      </Link>

      <nav className="flex items-center gap-3">
        <Link
          to="/charter-champions"
          className={`font-label text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-badge transition-all ${
            pathname === '/charter-champions'
              ? 'bg-blue/15 text-sky border border-sky/20'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Charter Champions
        </Link>
        <Link
          to="/instant-impact"
          className={`font-label text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-badge transition-all ${
            pathname === '/instant-impact'
              ? 'bg-gold/12 text-gold-soft border border-gold/20'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Instant Impact
        </Link>

        <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/20 rounded-badge px-3.5 py-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-gold animate-pulseDot" aria-hidden="true" />
          <span className="font-label text-[11px] font-semibold tracking-wider uppercase text-gold">
            {liveLabel}
          </span>
        </div>
      </nav>
    </header>
  )
}
