import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: ReactNode
  description?: string
  icon?: ReactNode
  /** Highlight the card (e.g. for the primary metric) */
  highlight?: boolean
  loading?: boolean
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  highlight = false,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        {description !== undefined && <Skeleton className="h-3 w-20" />}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 space-y-1 transition-colors',
        highlight ? 'border-primary/40 bg-primary/5' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p
        className={cn(
          'text-2xl font-semibold tracking-tight',
          highlight && 'text-primary',
        )}
      >
        {value}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
