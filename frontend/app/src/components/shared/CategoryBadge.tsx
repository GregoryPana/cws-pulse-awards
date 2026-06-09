interface Props {
  label: string
  variant: 'peer' | 'manager' | 'gold'
}

const styles: Record<string, string> = {
  peer: 'bg-blue/20 text-sky border-sky/30',
  manager: 'bg-blue/15 text-[#60C4F0] border-blue/30',
  gold: 'bg-gold/15 text-gold-soft border-gold/30',
}

const icons: Record<string, string> = {
  peer: '\u{1F91D}',
  manager: '\u{1F3C6}',
  gold: '\u{2B50}',
}

export default function CategoryBadge({ label, variant }: Props) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-label text-[10.5px] font-bold tracking-wider uppercase
        px-3 py-1 rounded-badge border
        ${styles[variant]}
      `}
    >
      <span aria-hidden="true">{icons[variant]}</span>
      {label}
    </span>
  )
}
