import { Milestone } from 'lucide-react'

interface Props {
  pillar: string
  variant: 'blue' | 'gold' | 'golden'
}

/* 'golden' is the full-brightness gold treatment reserved for Golden Ticket cards.
   'gold' (used on standard Instant Impact cards) is the wall's own coral/crimson accent —
   named for historical reasons but deliberately not gold-coloured, so it reads distinct. */
const styles: Record<string, string> = {
  blue: 'bg-gold/10 border-gold/25 text-gold-soft',
  gold: 'bg-impact/[0.08] border-impact/25 text-impact-soft',
  golden: 'bg-gold/15 border-gold/40 text-gold-soft',
}

export default function PillarTag({ pillar, variant }: Props) {
  return (
    <span
      className={`
        inline-flex max-w-full items-start gap-1.5
        font-label text-[10.5px] font-semibold leading-snug tracking-wide
        px-2 py-1 rounded-tag border
        ${styles[variant]}
      `}
    >
      <Milestone className="mt-px h-3 w-3 shrink-0" aria-hidden="true" strokeWidth={2.2} />
      {pillar}
    </span>
  )
}

const MAX_VISIBLE = 3

/** Compact pillar list: shows up to three tags and collapses any extras into a "+N" chip. */
export function PillarTagList({ pillars, variant }: { pillars: string[]; variant: Props['variant'] }) {
  const visible = pillars.slice(0, MAX_VISIBLE)
  const hidden = pillars.slice(MAX_VISIBLE)
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((pillar) => (
        <PillarTag key={pillar} pillar={pillar} variant={variant} />
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.join(', ')}
          aria-label={`Also: ${hidden.join(', ')}`}
          className={`inline-flex items-center rounded-tag border px-2 py-1 font-label text-[10.5px] font-semibold ${styles[variant]}`}
        >
          +{hidden.length}
        </span>
      )}
    </div>
  )
}
