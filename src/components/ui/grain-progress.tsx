import { cn } from '@/lib/utils'

interface GrainProgressProps {
  current: number
  total: number
  percent: number
  stepLabel?: string
  className?: string
}

export function GrainProgress({
  current,
  total,
  percent,
  stepLabel,
  className,
}: GrainProgressProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
          Passo {current} de {total}{stepLabel ? `: ${stepLabel}` : ''}
        </span>
        <span className="text-sm font-bold tracking-tight text-primary">
          {clampedPercent}% Concluído
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden bg-secondary-container/20">
        <div
          className="h-full rounded-full gradient-grain shadow-sm transition-all duration-500"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  )
}

export default GrainProgress
