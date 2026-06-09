import { Link, useLocation } from 'react-router-dom'

interface Props {
  variant: 'blue' | 'gold'
  liveLabel: string
}

const globeStyles: Record<string, string> = {
  blue: 'bg-blue shadow-[0_0_0_6px_rgba(0,112,192,.2),0_0_0_12px_rgba(0,112,192,.07)]',
  gold: 'bg-gradient-to-br from-amber to-gold shadow-[0_0_0_6px_rgba(245,166,35,.15),0_0_0_12px_rgba(245,166,35,.06)]',
}

const brandNameStyles: Record<string, string> = {
  blue: 'text-sky',
  gold: 'text-gold',
}

export default function Header({ variant, liveLabel }: Props) {
  const { pathname } = useLocation()
  const isCharter = pathname === '/charter-champions'

  return (
    <header className="flex items-center justify-between flex-wrap gap-4 px-8 md:px-12 pt-8">
      <Link to="/charter-champions" className="flex items-center gap-3.5 no-underline group">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-shadow duration-300 ${globeStyles[variant]}`}
          aria-hidden="true"
        >
          {isCharter ? '\u{1F310}' : '\u{1F3C6}'}
        </div>
        <div>
          <div className={`font-label text-xs font-semibold tracking-widest uppercase ${brandNameStyles[variant]}`}>
            Cable &amp; Wireless Seychelles
          </div>
          <div className="text-[11px] text-white/35 tracking-wide">
            CWS Pulse Awards
          </div>
        </div>
      </Link>

      <nav className="flex items-center gap-3">
        <Link
          to="/charter-champions"
          className={`font-label text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-badge transition-all ${
            pathname === '/charter-champions'
              ? 'bg-blue/20 text-sky border border-sky/30'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Charter Champions
        </Link>
        <Link
          to="/instant-impact"
          className={`font-label text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-badge transition-all ${
            pathname === '/instant-impact'
              ? 'bg-gold/15 text-gold-soft border border-gold/30'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Instant Impact
        </Link>

        <div className="flex items-center gap-1.5 bg-gold/12 border border-gold/30 rounded-badge px-3.5 py-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-gold animate-pulseDot" aria-hidden="true" />
          <span className="font-label text-[11px] font-semibold tracking-wider uppercase text-gold">
            {liveLabel}
          </span>
        </div>
      </nav>
    </header>
  )
}
