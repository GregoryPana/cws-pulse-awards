interface Props {
  variant?: 'blue' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const sizeStyles = {
  sm: {
    mark: 'h-9 w-16 text-lg',
    name: 'text-[10px]',
    subtitle: 'text-[10px]',
  },
  md: {
    mark: 'h-11 w-[76px] text-xl',
    name: 'text-xs',
    subtitle: 'text-[11px]',
  },
  lg: {
    mark: 'h-14 w-24 text-2xl',
    name: 'text-sm',
    subtitle: 'text-xs',
  },
}

const variantStyles = {
  blue: {
    mark: 'border-sky/35 bg-blue/20 text-sky shadow-[0_0_0_6px_rgba(0,112,192,.14),0_16px_38px_rgba(0,112,192,.18)]',
    name: 'text-sky',
  },
  gold: {
    mark: 'border-gold/35 bg-gold/15 text-gold shadow-[0_0_0_6px_rgba(245,166,35,.12),0_16px_38px_rgba(245,166,35,.18)]',
    name: 'text-gold',
  },
}

export default function CwsLogoMark({ variant = 'gold', size = 'md', showName = true }: Props) {
  const sizes = sizeStyles[size]
  const colours = variantStyles[variant]

  return (
    <div className="flex items-center gap-3.5">
      <div
        className={`${sizes.mark} ${colours.mark} flex shrink-0 items-center justify-center rounded-btn border font-display font-black tracking-[-0.08em]`}
        aria-label="CWS logo"
      >
        CWS
      </div>
      {showName && (
        <div className="min-w-0">
          <div className={`${sizes.name} ${colours.name} font-label font-semibold uppercase tracking-widest`}>
            Cable &amp; Wireless Seychelles
          </div>
          <div className={`${sizes.subtitle} text-white/35 tracking-wide`}>
            CWS Pulse Awards
          </div>
        </div>
      )}
    </div>
  )
}
