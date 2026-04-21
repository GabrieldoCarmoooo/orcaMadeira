import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Ícone Lucide (recomendado: size="h-12 w-12") */
  icon: ReactNode
  /** Título em headline-sm */
  title: string
  /** Descrição curta orientando a próxima ação */
  description: string
  /** CTA opcional (ex: <Button onClick={...}>Nova Espécie</Button>) */
  action?: ReactNode
  className?: string
}

/**
 * Estado vazio editorial no padrão Timber Grain.
 * Fundo bg-surface-container-highest sem borda 1px — separação por tonal layering.
 * Ícone em text-secondary/40 (48px), título headline-sm, CTA primary abaixo.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        // Fundo tonal prominente, cantos robustos 8px (Timber Grain "sturdy")
        'bg-surface-container-highest rounded-lg',
        // Espaçamento editorial assimétrico
        'px-6 pt-10 pb-8',
        // Layout centralizado com respiro vertical
        'flex flex-col items-center justify-center gap-3 text-center',
        className,
      )}
    >
      {/* Ícone grande em tom suave — ancora visualmente sem competir com o CTA */}
      <span className="text-secondary/40 [&>svg]:h-12 [&>svg]:w-12">
        {icon}
      </span>

      <div className="space-y-1 max-w-xs">
        {/* Título em headline-sm tracking-tight (escala editorial) */}
        <h3 className="text-base font-semibold tracking-tight text-on-surface">
          {title}
        </h3>
        {/* Corpo curto em on-surface-variant para hierarquia clara */}
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {description}
        </p>
      </div>

      {/* CTA primário abaixo — opcional */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export default EmptyState
