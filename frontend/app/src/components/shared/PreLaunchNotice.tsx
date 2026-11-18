import { CalendarClock } from 'lucide-react'
import { LAUNCH_LABEL } from '../../lib/dates'

interface Props {
  period: string
  /** Jumps the wall to the programme's first month. */
  onViewLaunch?: () => void
}

export default function PreLaunchNotice({ period, onViewLaunch }: Props) {
  return (
    <div className="col-span-full mx-auto max-w-[560px] px-6 py-16 text-center animate-fadeUp opacity-0">
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/45"
        aria-hidden="true"
      >
        <CalendarClock className="h-8 w-8" strokeWidth={1.7} />
      </div>
      <h3 className="mb-2 font-display text-2xl font-bold text-white/80">
        Nothing here — and that&rsquo;s expected
      </h3>
      <p className="mx-auto max-w-[440px] text-[15px] leading-relaxed text-white/45">
        The CWS Pulse Awards programme began in{' '}
        <strong className="font-semibold text-white/70">{LAUNCH_LABEL}</strong>. There are no
        winners for <strong className="font-semibold text-white/70">{period}</strong> because
        the programme had not launched yet.
      </p>
      <p className="mt-4 text-[13px] leading-relaxed text-white/30">
        Use the year and month controls above to browse recognitions from {LAUNCH_LABEL} onwards.
      </p>
      {onViewLaunch && (
        <button
          type="button"
          onClick={onViewLaunch}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-badge border border-white/20 bg-white/[0.06] px-5 font-label text-xs font-semibold uppercase tracking-wider text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          View {LAUNCH_LABEL}
        </button>
      )}
    </div>
  )
}
