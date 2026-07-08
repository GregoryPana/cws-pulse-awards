import { HugeiconsIcon } from '@hugeicons/react'
import { Award01Icon } from '@hugeicons/core-free-icons'

interface Props {
  message?: string
}

export default function EmptyState({
  message = 'No awards posted for this period yet.',
}: Props) {
  return (
    <div className="col-span-full text-center px-6 py-20 animate-fadeUp opacity-0">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold/60" aria-hidden="true">
        <HugeiconsIcon icon={Award01Icon} size={28} strokeWidth={1.8} />
      </div>
      <p className="text-[15px] text-white/30 leading-relaxed">{message}</p>
    </div>
  )
}
