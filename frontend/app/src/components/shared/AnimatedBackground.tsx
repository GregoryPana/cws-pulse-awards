type Variant = 'blue' | 'gold'

interface Props {
  variant: Variant
}

const orbStyles: Record<Variant, { grid: string; orbs: { size: string; pos: string; bg: string; delay: string }[] }> = {
  blue: {
    grid: 'rgba(0,112,192,.07)',
    orbs: [
      { size: '500px', pos: 'top-[-150px] left-[-100px]', bg: 'rgba(0,112,192,.18)', delay: '0s' },
      { size: '400px', pos: 'bottom-[-100px] right-[-80px]', bg: 'rgba(245,166,35,.10)', delay: '-6s' },
      { size: '300px', pos: 'top-[40%] left-[55%]', bg: 'rgba(0,163,217,.12)', delay: '-12s' },
    ],
  },
  gold: {
    grid: 'rgba(245,166,35,.04)',
    orbs: [
      { size: '600px', pos: 'top-[-200px] right-[-150px]', bg: 'rgba(245,132,35,.10)', delay: '0s' },
      { size: '450px', pos: 'bottom-[-120px] left-[-100px]', bg: 'rgba(0,112,192,.12)', delay: '-7s' },
      { size: '250px', pos: 'top-[45%] left-[42%]', bg: 'rgba(245,166,35,.08)', delay: '-14s' },
    ],
  },
}

export default function AnimatedBackground({ variant }: Props) {
  const cfg = orbStyles[variant]

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${cfg.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${cfg.grid} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {cfg.orbs.map((orb, i) => (
        <div
          key={i}
          className={`absolute rounded-full animate-drift ${orb.pos}`}
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.bg,
            filter: 'blur(90px)',
            animationDelay: orb.delay,
          }}
        />
      ))}
    </div>
  )
}
