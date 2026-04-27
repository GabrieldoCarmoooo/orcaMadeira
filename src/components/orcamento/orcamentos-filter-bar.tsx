import { cn } from '@/lib/utils'
import { ORCAMENTO_STATUS } from '@/constants/orcamento-status'
import type { FilterStatus } from '@/types/orcamento'

// Abas de filtro: label no plural difere do badge — "Rascunhos" vs "Rascunho"
const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: ORCAMENTO_STATUS.rascunho.value, label: 'Rascunhos' },
  { value: ORCAMENTO_STATUS.salvo.value, label: 'Salvos' },
  { value: ORCAMENTO_STATUS.enviado.value, label: 'Enviados' },
  { value: ORCAMENTO_STATUS.pedido_fechado.value, label: 'Pedido Fechado' },
  { value: ORCAMENTO_STATUS.cancelado.value, label: 'Cancelados' },
]

interface OrcamentosFilterBarProps {
  filter: FilterStatus
  onFilterChange: (filter: FilterStatus) => void
}

export default function OrcamentosFilterBar({ filter, onFilterChange }: OrcamentosFilterBarProps) {
  return (
    <div className="flex border-b border-outline-variant/20 overflow-x-auto">
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onFilterChange(tab.value)}
          className={cn(
            'shrink-0 pb-3 px-4 text-sm font-bold transition-colors',
            filter === tab.value
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
