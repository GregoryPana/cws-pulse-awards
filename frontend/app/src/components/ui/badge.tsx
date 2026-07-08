import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-badge px-2 py-1 font-label text-[10px] font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'border border-gold/20 bg-gold/10 text-gold-soft',
        success: 'bg-emerald-400/15 text-emerald-200',
        muted: 'bg-white/[0.07] text-white/40',
        outline: 'border border-white/[0.14] bg-deep/45 text-white/55',
        destructive: 'bg-red-400/15 text-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
