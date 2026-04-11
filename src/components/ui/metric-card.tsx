import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type DotVariant = 'primary' | 'secondary' | 'outline'

interface MetricCardProps {
  label: string
  value: string | number
  description?: string
  dot?: DotVariant
  loading?: boolean
  className?: string
  children?: ReactNode
}

const dotStyles: Record<DotVariant, string> = {
  primary: 'bg-primary-container',
  secondary: 'bg-secondary',
  outline: 'bg-outline-variant border border-border',
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} />
}

export function MetricCard({
  label,
  value,
  description,
  dot = 'primary',
  loading = false,
  className,
  children,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-surface-container-highest rounded-lg pt-6 px-4 pb-4 flex flex-col gap-3',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', dotStyles[dot])} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
      </div>

      {loading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ) : (
        <div>
          <p className="text-3xl font-black tracking-tighter text-on-surface leading-none">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-on-surface-variant font-medium">{description}</p>
          )}
        </div>
      )}

      {children}
    </div>
  )
}

export default MetricCard
