import type { CSSProperties } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon, TicketStarIcon } from '@hugeicons/core-free-icons'
import type { WinnerPublic } from '../../api/winners'
import Avatar from './Avatar'
import CategoryBadge from './CategoryBadge'
import PillarTag from './PillarTag'

interface Props {
  winner: WinnerPublic
  variant: 'blue' | 'gold'
  awardTypeLabel: string
}

/*
 * Standard Instant Impact cards deliberately sit in a deeper amber/bronze register.
 * The bright gold-soft foil treatment is reserved for Golden Ticket cards only,
 * so they remain unmistakable on the gold wall.
 */
const cardBarGradients: Record<string, string> = {
  peer: 'bg-gradient-to-r from-blue to-sky',
  manager: 'bg-gradient-to-r from-navy to-blue',
  impact: 'bg-gradient-to-r from-[#8A5A08] to-amber',
  goldenTicket: 'bg-gradient-to-r from-amber via-gold to-gold-soft',
}

/* Hover glow is themed to the wall the card sits on: sky for Charter Champions, muted amber for Instant Impact. */
const cardHoverGlow: Record<string, string> = {
  blue: 'hover:shadow-[0_26px_64px_rgba(0,0,0,.45),0_0_36px_rgba(0,163,217,.22),0_0_0_1px_rgba(0,163,217,.35)]',
  gold: 'hover:shadow-[0_26px_64px_rgba(0,0,0,.5),0_0_26px_rgba(232,135,10,.14),0_0_0_1px_rgba(232,135,10,.26)]',
}

const cardHoverStrip: Record<string, string> = {
  blue: 'bg-gradient-to-r from-blue via-sky to-gold',
  gold: 'bg-gradient-to-r from-[#8A5A08] via-amber to-gold',
}

const cardBg: Record<string, string> = {
  blue: 'bg-gradient-to-br from-[#0B1C30]/95 to-[#061426]/95 border border-white/[0.07] shadow-xl shadow-black/20',
  gold: 'bg-gradient-to-br from-[#0B1C30]/95 to-[#140F08]/95 border border-amber/[0.10] shadow-xl shadow-black/20',
}

const storyQuoteColor: Record<string, string> = {
  blue: 'text-blue/50',
  gold: 'text-amber/40',
}

/* Constant border-trace beam, themed per wall. */
const traceStyle: Record<string, CSSProperties> = {
  blue: { '--trace-color': 'rgba(0,163,217,0.75)', '--trace-duration': '9s' } as CSSProperties,
  gold: { '--trace-color': 'rgba(232,135,10,0.65)', '--trace-duration': '9s' } as CSSProperties,
}

/** Light band that sweeps across a card once on hover. */
function HoverSheen() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 -translate-x-[160%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-[420%]"
    />
  )
}

/** Slow, endless light band for the Golden Ticket card. */
function FoilSheen() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-gold-soft/[0.10] to-transparent"
    />
  )
}

function FloatingSparkles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <span className="absolute right-6 top-5 animate-floaty text-gold-soft/80">
        <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={1.6} />
      </span>
      <span className="absolute right-16 top-12 animate-floaty text-gold/60 [animation-delay:1.4s]">
        <HugeiconsIcon icon={SparklesIcon} size={12} strokeWidth={1.6} />
      </span>
      <span className="absolute bottom-6 left-8 animate-floaty text-gold/50 [animation-delay:2.6s]">
        <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={1.6} />
      </span>
    </div>
  )
}

export default function AwardCard({ winner, variant, awardTypeLabel }: Props) {
  const isFeatured = winner.golden_ticket
  const cardVariant = variant === 'blue' ? 'peer' : 'impact'

  if (isFeatured) {
    /* Golden Ticket: animated foil border, breathing gold glow, endless sheen, floating sparkles. */
    return (
      <div
        data-card
        className="group col-span-full rounded-card bg-[linear-gradient(120deg,#A87E1F,#F7D88C,#D6A933,#F7D88C,#A87E1F)] bg-[length:240%_240%] p-[1.5px] animate-foilShift transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.005]"
      >
        <article className="relative grid grid-cols-1 gap-0 overflow-hidden rounded-[9px] bg-gradient-to-br from-[#0E1A2C] to-[#151006] animate-glowGold cursor-default md:grid-cols-2">
          <span
            aria-hidden="true"
            className="border-trace border-trace--golden z-20"
            style={{ '--trace-duration': '5.5s' } as CSSProperties}
          />
          <FoilSheen />
          <FloatingSparkles />
          <div className={`col-span-full h-1 ${cardBarGradients.goldenTicket}`} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.16),transparent_42%)]"
          />

          <div className="relative p-8 md:border-r md:border-gold/15">
            <div className="mb-4 inline-flex items-center gap-2 rounded-badge border border-gold/40 bg-gold/[0.12] px-3.5 py-1.5 font-label text-[10px] font-bold uppercase tracking-[2px] text-gold-soft">
              <HugeiconsIcon icon={TicketStarIcon} size={14} strokeWidth={2} aria-hidden="true" />
              Golden Ticket Winner
            </div>
            <div>
              <CategoryBadge label={awardTypeLabel} variant="gold" />
            </div>
            <div className="mb-4 mt-4 flex items-center gap-3.5">
              <Avatar
                firstName={winner.first_name}
                lastName={winner.last_name}
                photoUrl={winner.photo_url}
                variant={variant}
                featured
                goldenTicket
              />
              <div>
                <h3 className="font-display text-[28px] font-bold leading-tight text-white">
                  {winner.first_name} {winner.last_name}
                </h3>
                <p className="text-xs text-gold-soft/70">
                  {winner.job_title}
                  {winner.department ? ` — ${winner.department}` : ''}
                </p>
              </div>
            </div>
            <PillarTag pillar={winner.charter_pillar} variant="golden" />
            <p className="mt-4 border-t border-gold/15 pt-3 text-[11.5px] text-white/35">
              Nominated by{' '}
              <strong className="font-medium text-gold-soft/80">
                {winner.nominated_by || 'a colleague'}
              </strong>{' '}
              &middot; {winner.award_month}
            </p>
          </div>

          <div className="relative flex flex-col justify-center p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/[0.14] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <p className="relative mb-3 inline-flex items-center gap-2 font-label text-[10px] font-bold uppercase tracking-widest text-gold">
              <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} aria-hidden="true" /> Why This Matters
            </p>
            <blockquote className="relative mb-4 font-display text-[22px] font-bold leading-snug text-white">
              <span
                className="absolute -left-2 -top-2.5 text-6xl leading-none text-gold/40"
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <span className="pl-7">{winner.story}</span>
            </blockquote>
          </div>
        </article>
      </div>
    )
  }

  return (
    <article
      data-card
      className={`
        ${cardBg[variant]} rounded-card overflow-hidden relative
        transition-all duration-300 ease-out
        ${cardHoverGlow[variant]} hover:-translate-y-1.5 hover:scale-[1.015]
        cursor-default
        group
      `}
    >
      <span aria-hidden="true" className="border-trace z-20" style={traceStyle[variant]} />
      <HoverSheen />
      <div
        aria-hidden="true"
        className={`absolute top-0 left-0 right-0 h-[3px] ${cardHoverStrip[variant]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          variant === 'blue'
            ? 'bg-[radial-gradient(circle_at_top_right,rgba(0,163,217,0.13),transparent_36%)]'
            : 'bg-[radial-gradient(circle_at_top_right,rgba(232,135,10,0.11),transparent_36%)]'
        }`}
      />
      <div className={`h-1 ${cardBarGradients[cardVariant]}`} />

      <div className="relative p-6">
        <CategoryBadge label={awardTypeLabel} variant={cardVariant} />

        <div className="mb-4 mt-4 flex items-center gap-3.5">
          <Avatar
            firstName={winner.first_name}
            lastName={winner.last_name}
            photoUrl={winner.photo_url}
            variant={variant}
          />
          <div>
            <h3 className="font-display text-xl font-bold leading-tight text-white">
              {winner.first_name} {winner.last_name}
            </h3>
            <p className="text-xs text-white/50">
              {winner.job_title}
              {winner.department ? ` — ${winner.department}` : ''}
            </p>
          </div>
        </div>

        <PillarTag pillar={winner.charter_pillar} variant={variant} />

        <div className="relative mt-3.5 border-t border-white/5 pt-3.5">
          <span
            className={`absolute -left-1 top-1 font-display text-5xl leading-none ${storyQuoteColor[variant]} opacity-50`}
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <p className="pl-5 text-sm font-light italic leading-relaxed text-white/72">
            {winner.story}
          </p>
        </div>

        <p className="mt-3.5 border-t border-white/5 pt-3 text-[11.5px] text-white/35">
          Nominated by{' '}
          <strong className="font-medium text-white/55">
            {winner.nominated_by || 'a colleague'}
          </strong>{' '}
          &middot; {winner.award_month}
        </p>
      </div>
    </article>
  )
}
