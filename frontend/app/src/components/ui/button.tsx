import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn font-label font-semibold uppercase tracking-wide outline-none transition focus-visible:ring-4 focus-visible:ring-gold/20 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-amber to-gold font-bold text-navy shadow-lg shadow-gold/20 hover:shadow-gold/35 hover:brightness-105',
        secondary:
          'border border-white/[0.14] bg-white/[0.06] text-white/75 hover:border-white/[0.24] hover:bg-white/[0.09] hover:text-white',
        outline:
          'border border-gold/30 bg-gold/10 text-gold-soft hover:border-gold/50 hover:bg-gold/15',
        ghost: 'text-white/60 hover:bg-white/[0.06] hover:text-white',
        destructive:
          'border border-red-400/25 bg-red-400/10 text-red-200 hover:border-red-400/40 hover:bg-red-400/15',
      },
      size: {
        default: 'px-5 py-2.5 text-xs',
        sm: 'px-3 py-1.5 text-[11px]',
        lg: 'px-6 py-3.5 text-sm',
        icon: 'h-9 w-9 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
