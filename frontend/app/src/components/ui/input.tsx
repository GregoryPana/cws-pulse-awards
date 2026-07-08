import * as React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full rounded-btn border border-white/[0.14] bg-[#0B1C30] px-3.5 py-2.5 text-sm text-white shadow-inner shadow-black/20 outline-none transition [color-scheme:dark] placeholder:text-white/30 hover:border-white/[0.22] focus:border-gold/70 focus:ring-4 focus:ring-gold/10 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
