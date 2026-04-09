import type { OrcamentoStatus, TipoProjeto, VinculacaoStatus } from '@/types/common'

export interface Orcamento {
  id: string
  carpinteiro_id: string
  madeireira_id: string
  tabela_snapshot_id: string
  status: OrcamentoStatus
  tipo_projeto: TipoProjeto
  nome: string
  descricao: string | null
  cliente_nome: string
  cliente_telefone: string | null
  cliente_email: string | null
  mao_obra_tipo: 'fixo' | 'hora'
  mao_obra_valor: number
  mao_obra_horas: number | null
  margem_lucro: number
  imposto: number
  validade_dias: number
  termos_condicoes: string | null
  subtotal_materiais: number
  subtotal_mao_obra: number
  valor_margem: number
  valor_imposto: number
  total: number
  created_at: string
  updated_at: string
  finalizado_at: string | null
}

export interface ItemOrcamento {
  id: string
  orcamento_id: string
  item_preco_id: string
  nome: string
  unidade: string
  preco_unitario: number
  quantidade: number
  subtotal: number
}

export interface Vinculacao {
  id: string
  carpinteiro_id: string
  madeireira_id: string
  status: VinculacaoStatus
  solicitado_at: string
  respondido_at: string | null
}
