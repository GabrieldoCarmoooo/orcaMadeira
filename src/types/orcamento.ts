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

  // Campos de origem introduzidos na migration 002.
  // Opcionais para manter compatibilidade com itens anteriores à migration
  // (legado_planilha é o default; campos de madeira/outro_produto ficam null).
  origem?: 'legado_planilha' | 'madeira_m3' | 'outro_produto'

  // Referências relacionais — exclusivas por tipo de origem
  madeira_m3_id?: string | null
  outro_produto_id?: string | null

  // Snapshot das dimensões gravado no momento da finalização do orçamento.
  // Garante que alterações futuras na madeira não afetam orçamentos já finalizados.
  especie_nome?: string | null
  espessura_cm?: number | null
  largura_cm?: number | null

  // Comprimento selecionado pelo carpinteiro no orçamento (pré-cadastrado pela madeireira)
  comprimento_real_m?: number | null
  comprimento_id?: string | null

  // Snapshot do acabamento aplicado — gravado ao confirmar para preservar histórico
  acabamento_id?: string | null
  acabamento_nome?: string | null
  acabamento_percentual?: number | null
}

export interface Vinculacao {
  id: string
  carpinteiro_id: string
  madeireira_id: string
  status: VinculacaoStatus
  solicitado_at: string
  respondido_at: string | null
}
