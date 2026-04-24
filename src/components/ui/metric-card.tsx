import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'

type DotVariant = 'primary' | 'secondary' | 'outline'

interface MetricCardProps {
  label: string
  value: string | number
  description?: string
  dot?: DotVariant
  loading?: boolean
  className?: string
  children?: ReactNode
  // Quando true, o valor começa oculto (desfocado) e só aparece após clique no ícone de olho.
  hideable?: boolean
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
  hideable = false,
}: MetricCardProps) {
  // Estado local por card — permite ocultar/exibir cada métrica individualmente
  const [revealed, setRevealed] = useState(false)
  const oculto = hideable && !revealed

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
        {hideable && !loading && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={oculto ? 'Exibir valor' : 'Ocultar valor'}
            aria-pressed={!oculto}
            className="ml-auto -mr-1 -mt-1 p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            {oculto ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ) : (
        <div>
          <p
            className={cn(
              'text-3xl font-black tracking-tighter text-on-surface leading-none transition-all',
              oculto && 'blur-md select-none pointer-events-none',
            )}
            aria-hidden={oculto}
          >
            {value}
          </p>
          {description && (
            <p
              className={cn(
                'mt-1 text-xs text-on-surface-variant font-medium transition-all',
                oculto && 'blur-sm select-none pointer-events-none',
              )}
              aria-hidden={oculto}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  )
}

export default MetricCard
