import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TonalCardProps {
  children: ReactNode
  className?: string
  /**
   * 'default'  — surface-container-highest (prominent card)
   * 'low'      — surface-container-low (secondary info)
   * 'base'     — surface-container (nested/subtle)
   */
  variant?: 'default' | 'low' | 'base'
  asymmetric?: boolean
}

const variantStyles = {
  default: 'bg-surface-container-highest',
  low: 'bg-surface-container-low',
  base: 'bg-surface-container',
}

export function TonalCard({
  children,
  className,
  variant = 'default',
  asymmetric = false,
}: TonalCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg',
        variantStyles[variant],
        asymmetric ? 'pt-6 px-4 pb-4' : 'p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default TonalCard
