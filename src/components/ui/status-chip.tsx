import { cn } from '@/lib/utils'
import type { OrcamentoStatus } from '@/types/common'

const STATUS_LABELS: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  salvo: 'Salvo',
  enviado: 'Enviado',
  pedido_fechado: 'Pedido Fechado',
  cancelado: 'Cancelado',
}

// Cores: cancelado vermelho discreto, pedido_fechado verde, salvo neutro positivo
const STATUS_STYLES: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-primary/10 text-primary',
  salvo: 'bg-secondary/10 text-secondary',
  enviado: 'bg-on-surface-variant/10 text-on-surface-variant',
  pedido_fechado: 'bg-green-600/10 text-green-700',
  cancelado: 'bg-red-500/10 text-red-600',
}

interface StatusChipProps {
  status: OrcamentoStatus
  className?: string
}

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5',
        'text-[10px] font-bold uppercase tracking-widest',
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export default StatusChip
