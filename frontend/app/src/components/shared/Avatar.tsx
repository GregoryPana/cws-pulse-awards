interface Props {
  firstName: string
  lastName: string
  photoUrl?: string | null
  variant: 'blue' | 'gold'
  featured?: boolean
  goldenTicket?: boolean
}

const initials = (first: string, last: string) =>
  (first.charAt(0) + last.charAt(0)).toUpperCase()

const gradients: Record<string, string> = {
  blue: 'bg-gradient-to-br from-blue to-sky',
  gold: 'bg-gradient-to-br from-impact-deep to-impact',
}

const textColors: Record<string, string> = {
  blue: 'text-white',
  gold: 'text-white',
}

export default function Avatar({
  firstName,
  lastName,
  photoUrl,
  variant,
  featured,
  goldenTicket,
}: Props) {
  const size = featured ? 'w-[72px] h-[72px] text-[28px]' : 'w-14 h-14 text-[22px]'
  const ring = goldenTicket
    ? 'shadow-[0_0_0_3px_#F5A623,0_4px_20px_rgba(245,166,35,.3)]'
    : 'shadow-md shadow-blue/40'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={`${size} rounded-full object-cover flex-shrink-0 ${ring}`}
        loading={featured ? 'eager' : 'lazy'}
        decoding="async"
      />
    )
  }

  return (
    <div
      className={`
        ${size} ${gradients[variant]} ${textColors[variant]}
        rounded-full flex items-center justify-center font-display font-bold flex-shrink-0 ${ring}
      `}
      aria-hidden="true"
    >
      {initials(firstName, lastName)}
    </div>
  )
}
