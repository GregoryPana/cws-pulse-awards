interface Props {
  variant?: 'blue' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const sizeStyles = {
  sm: {
    mark: 'h-9 w-9 p-1',
    name: 'text-[10px]',
    subtitle: 'text-[10px]',
  },
  md: {
    mark: 'h-11 w-11 p-1.5',
    name: 'text-xs',
    subtitle: 'text-[11px]',
  },
  lg: {
    mark: 'h-14 w-14 p-2',
    name: 'text-sm',
    subtitle: 'text-xs',
  },
}

const variantStyles = {
  blue: {
    mark: 'border-sky/35 shadow-[0_0_0_6px_rgba(0,112,192,.14),0_16px_38px_rgba(0,112,192,.18)]',
    name: 'text-sky',
  },
  gold: {
    mark: 'border-gold/35 shadow-[0_0_0_6px_rgba(245,166,35,.12),0_16px_38px_rgba(245,166,35,.18)]',
    name: 'text-gold',
  },
}

export default function CwsLogoMark({ variant = 'gold', size = 'md', showName = true }: Props) {
  const sizes = sizeStyles[size]
  const colours = variantStyles[variant]

  return (
    <div className="flex items-center gap-3.5">
      <div
        className={`${sizes.mark} ${colours.mark} flex shrink-0 items-center justify-center rounded-full border bg-white`}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/cws-logo.png`}
          alt="Cable & Wireless Seychelles logo"
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
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
