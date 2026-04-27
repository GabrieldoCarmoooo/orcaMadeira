import type { OrcamentoStatus } from '@/types/common'

// Configuração visual completa por status — label exibido ao usuário e classe Tailwind do badge
interface StatusConfig {
  value: OrcamentoStatus
  label: string
  badgeClass: string
}

// Fonte única de verdade para todos os status de orçamento.
// Adicionar ou renomear um status requer editar apenas este arquivo.
export const ORCAMENTO_STATUS = {
  rascunho: {
    value: 'rascunho',
    label: 'Rascunho',
    badgeClass: 'bg-primary/10 text-primary',
  },
  salvo: {
    value: 'salvo',
    label: 'Salvo',
    badgeClass: 'bg-secondary/10 text-secondary',
  },
  enviado: {
    value: 'enviado',
    label: 'Enviado',
    badgeClass: 'bg-on-surface-variant/10 text-on-surface-variant',
  },
  pedido_fechado: {
    value: 'pedido_fechado',
    label: 'Pedido Fechado',
    badgeClass: 'bg-green-600/10 text-green-700',
  },
  cancelado: {
    value: 'cancelado',
    label: 'Cancelado',
    badgeClass: 'bg-red-500/10 text-red-600',
  },
} as const satisfies Record<OrcamentoStatus, StatusConfig>
