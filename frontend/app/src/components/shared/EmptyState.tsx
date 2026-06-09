interface Props {
  message?: string
}

export default function EmptyState({
  message = 'No awards posted for this period yet.',
}: Props) {
  return (
    <div className="col-span-full text-center px-6 py-20">
      <div className="text-5xl mb-4 opacity-40" aria-hidden="true">
        {'\u{1F3C6}'}
      </div>
      <p className="text-[15px] text-white/30 leading-relaxed">{message}</p>
    </div>
  )
}
