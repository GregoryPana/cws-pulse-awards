interface Props {
  pillar: string
  variant: 'blue' | 'gold'
}

const styles: Record<string, string> = {
  blue: 'bg-gold/10 border-gold/25 text-gold-soft',
  gold: 'bg-gold/8 border-gold/20 text-gold-soft',
}

export default function PillarTag({ pillar, variant }: Props) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-label text-[11px] font-semibold tracking-wide
        px-2.5 py-1.5 rounded-tag border
        ${styles[variant]}
      `}
    >
      <span aria-hidden="true">{'\u{1F4CC}'}</span>
      {pillar}
    </span>
  )
}
