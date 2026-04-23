import type { TipoProjeto } from '@/types/common'

export interface ItemOrcamentoCalculo {
  // uid distingue linhas únicas no store: madeira m³ usa "madeira:{id}:{comprimento_id}:{acabamento_id|none}";
  // legado e outro_produto omitem uid e caem no fallback item_preco_id.
  uid?: string
  item_preco_id: string
  nome: string
  unidade: string
  preco_unitario: number
  quantidade: number

  // Campos de snapshot introduzidos na migration 002 (ISSUE-021/023).
  // Opcionais para manter compatibilidade total com itens legados existentes.
  origem?: 'legado_planilha' | 'madeira_m3' | 'outro_produto'
  madeira_m3_id?: string
  outro_produto_id?: string
  especie_nome?: string
  espessura_cm?: number
  largura_cm?: number
  comprimento_id?: string
  comprimento_real_m?: number
  acabamento_id?: string
  acabamento_nome?: string
  acabamento_percentual?: number
}

export interface DadosFinanceiros {
  mao_obra_tipo: 'fixo' | 'hora'
  mao_obra_valor: number
  mao_obra_horas: number | null
  margem_lucro: number      // percentage 0–100
  imposto: number           // percentage 0–100
  // Custos extras da migration 003 — integram a base de cálculo mas nunca aparecem no PDF
  deslocamento: number
  custos_adicionais: number
}

export interface ResumoOrcamento {
  subtotal_materiais: number
  subtotal_mao_obra: number
  valor_margem: number
  valor_imposto: number
  total: number
  // Custos extras da migration 003 — somam à base mas jamais aparecem no PDF
  deslocamento: number
  custos_adicionais: number
}

/**
 * Função pura de cálculo do orçamento.
 * Fórmula: (Materiais + Mão de Obra + Deslocamento + Custos Adicionais) * (1 + margem%) * (1 + imposto%)
 * Deslocamento e custos_adicionais compõem a base antes da margem e do imposto.
 */
export function calcularOrcamento(
  itens: ItemOrcamentoCalculo[],
  financeiro: DadosFinanceiros,
): ResumoOrcamento {
  const subtotal_materiais = itens.reduce(
    (acc, item) => acc + item.preco_unitario * item.quantidade,
    0,
  )

  const subtotal_mao_obra =
    financeiro.mao_obra_tipo === 'hora'
      ? financeiro.mao_obra_valor * (financeiro.mao_obra_horas ?? 0)
      : financeiro.mao_obra_valor

  // Base inclui custos extras: margem e imposto incidem sobre o total de entradas
  const base =
    subtotal_materiais +
    subtotal_mao_obra +
    financeiro.deslocamento +
    financeiro.custos_adicionais

  const margem = financeiro.margem_lucro / 100
  const imposto = financeiro.imposto / 100

  const valor_margem = base * margem
  const subtotal_com_margem = base + valor_margem
  const valor_imposto = subtotal_com_margem * imposto
  const total = subtotal_com_margem + valor_imposto

  return {
    subtotal_materiais,
    subtotal_mao_obra,
    valor_margem,
    valor_imposto,
    total,
    deslocamento: financeiro.deslocamento,
    custos_adicionais: financeiro.custos_adicionais,
  }
}

// ---- Step types used by the wizard ----

export interface StepProjetoData {
  tipo_projeto: TipoProjeto
  nome: string
  descricao: string
  cliente_nome: string
  cliente_telefone: string
  cliente_email: string
}

export interface StepFinanceiroData {
  mao_obra_tipo: 'fixo' | 'hora'
  mao_obra_valor: number
  mao_obra_horas: number | null
  margem_lucro: number
  imposto: number
  // Custos extras da migration 003 — UI adicionada em ISSUE-016
  deslocamento: number
  custos_adicionais: number
  validade_dias: number
  termos_condicoes: string
}
