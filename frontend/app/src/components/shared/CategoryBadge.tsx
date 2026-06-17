import { Handshake, Sparkles, Trophy } from 'lucide-react'

interface Props {
  label: string
  variant: 'peer' | 'manager' | 'gold'
}

const styles: Record<string, string> = {
  peer: 'bg-blue/20 text-sky border-sky/30',
  manager: 'bg-blue/15 text-[#60C4F0] border-blue/30',
  gold: 'bg-gold/15 text-gold-soft border-gold/30',
}

const icons = {
  peer: Handshake,
  manager: Trophy,
  gold: Sparkles,
}

export default function CategoryBadge({ label, variant }: Props) {
  const Icon = icons[variant]

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-label text-[10.5px] font-bold tracking-wider uppercase
        px-3 py-1 rounded-badge border
        ${styles[variant]}
      `}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.2} />
      {label}
    </span>
  )
}
