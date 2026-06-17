import { Sparkles } from 'lucide-react'
import type { WinnerPublic } from '../../api/winners'
import Avatar from './Avatar'
import CategoryBadge from './CategoryBadge'
import PillarTag from './PillarTag'

interface Props {
  winner: WinnerPublic
  index: number
  variant: 'blue' | 'gold'
  awardTypeLabel: string
}

const cardBarGradients: Record<string, string> = {
  peer: 'bg-gradient-to-r from-blue to-sky',
  manager: 'bg-gradient-to-r from-navy to-blue',
  gold: 'bg-gradient-to-r from-amber via-gold to-gold-soft',
}

const cardHoverGlow: Record<string, string> = {
  blue: 'hover:shadow-[0_24px_60px_rgba(0,0,0,.4),0_0_0_1px_rgba(245,166,35,.2)]',
  gold: 'hover:shadow-[0_24px_60px_rgba(0,0,0,.5),0_0_0_1px_rgba(245,166,35,.3)]',
}

const cardBg: Record<string, string> = {
  blue: 'bg-gradient-to-br from-[#0B1C30]/95 to-[#061426]/95 border-white/7 shadow-xl shadow-black/20',
  gold: 'bg-gradient-to-br from-[#0B1C30]/95 to-[#140F08]/95 border-gold/8 shadow-xl shadow-black/20',
}

const storyQuoteColor: Record<string, string> = {
  blue: 'text-blue/50',
  gold: 'text-amber/40',
}

export default function AwardCard({ winner, index, variant, awardTypeLabel }: Props) {
  const isFeatured = winner.golden_ticket
  const cardVariant = variant === 'blue' ? 'peer' : 'gold'

  if (isFeatured) {
    return (
      <article
        className={`
          col-span-full grid grid-cols-1 md:grid-cols-2 gap-0
          ${cardBg[variant]} rounded-card overflow-hidden relative
          transition-all duration-300 ease-out
          ${cardHoverGlow[variant]} hover:-translate-y-1.5
          opacity-0 animate-cardIn cursor-default
          border-gold/30
          group
        `}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className={`h-1 col-span-full ${cardBarGradients.gold}`} />

        <div className="p-8 md:border-r border-white/5">
          <CategoryBadge label={awardTypeLabel} variant="gold" />
          <div className="flex items-center gap-3.5 mt-4 mb-4">
            <Avatar
              firstName={winner.first_name}
              lastName={winner.last_name}
              photoUrl={winner.photo_url}
              variant={variant}
              featured
              goldenTicket
            />
            <div>
              <h3 className="font-display font-bold text-[28px] leading-tight text-white">
                {winner.first_name} {winner.last_name}
              </h3>
              <p className="text-xs text-white/50">
                {winner.job_title}
                {winner.department ? ` — ${winner.department}` : ''}
              </p>
            </div>
          </div>
          <PillarTag pillar={winner.charter_pillar} variant={variant} />
          <p className="text-[11.5px] text-white/35 mt-4 pt-3 border-t border-white/5">
            Nominated by{' '}
            <strong className="text-white/55 font-medium">
              {winner.nominated_by || 'a colleague'}
            </strong>{' '}
            &middot; {winner.award_month}
          </p>
        </div>

        <div className="relative p-8 flex flex-col justify-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <p className="relative mb-3 inline-flex items-center gap-2 font-label text-[10px] font-bold tracking-widest uppercase text-gold">
            <Sparkles className="h-4 w-4" aria-hidden="true" strokeWidth={2.1} /> Why This Matters
          </p>
          <blockquote className="font-display font-bold text-[22px] leading-snug text-white mb-4 relative">
            <span
              className={`absolute -top-2.5 -left-2 text-6xl leading-none ${storyQuoteColor[variant]} opacity-50`}
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <span className="pl-7">{winner.story}</span>
          </blockquote>
        </div>
      </article>
    )
  }

  return (
    <article
      className={`
        ${cardBg[variant]} rounded-card overflow-hidden relative
        transition-all duration-300 ease-out
        ${cardHoverGlow[variant]} hover:-translate-y-1.5
        opacity-0 animate-cardIn cursor-default
        group
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue via-sky to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.13),transparent_32%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className={`h-1 ${cardBarGradients[cardVariant]}`} />

      <div className="relative p-6">
        <CategoryBadge label={awardTypeLabel} variant={cardVariant} />

        <div className="flex items-center gap-3.5 mt-4 mb-4">
          <Avatar
            firstName={winner.first_name}
            lastName={winner.last_name}
            photoUrl={winner.photo_url}
            variant={variant}
          />
          <div>
            <h3 className="font-display font-bold text-xl leading-tight text-white">
              {winner.first_name} {winner.last_name}
            </h3>
            <p className="text-xs text-white/50">
              {winner.job_title}
              {winner.department ? ` — ${winner.department}` : ''}
            </p>
          </div>
        </div>

        <PillarTag pillar={winner.charter_pillar} variant={variant} />

        <div className="relative pt-3.5 mt-3.5 border-t border-white/5">
          <span
            className={`absolute top-1 -left-1 text-5xl leading-none ${storyQuoteColor[variant]} opacity-50 font-display`}
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <p className="text-sm text-white/72 italic font-light leading-relaxed pl-5">
            {winner.story}
          </p>
        </div>

        <p className="text-[11.5px] text-white/35 mt-3.5 pt-3 border-t border-white/5">
          Nominated by{' '}
          <strong className="text-white/55 font-medium">
            {winner.nominated_by || 'a colleague'}
          </strong>{' '}
          &middot; {winner.award_month}
        </p>
      </div>
    </article>
  )
}
