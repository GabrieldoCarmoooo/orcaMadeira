// Helpers para construir e parsear o uid composto de itens de madeira m³ no store/orçamento.
// Formato canônico: "madeira:{madeira_m3_id}:{comprimento_id}:{acabamento_id|none}"
// Centraliza o formato para evitar divergência entre store e componentes de UI.

const MADEIRA_PREFIX = 'madeira'
const ACABAMENTO_NONE = 'none'

export interface MadeiraKeyParams {
  id: string
  comprimentoId: string
  acabamentoId?: string | null
}

export interface ParsedMadeiraKey {
  madeira_m3_id: string
  comprimento_id: string
  // undefined quando o acabamento era 'none' (sem acabamento)
  acabamento_id: string | undefined
}

// Constrói o uid composto para um item de madeira m³.
// acabamentoId null/undefined → sentinel 'none' (sem acabamento selecionado).
export function buildMadeiraKey({ id, comprimentoId, acabamentoId }: MadeiraKeyParams): string {
  return `${MADEIRA_PREFIX}:${id}:${comprimentoId}:${acabamentoId ?? ACABAMENTO_NONE}`
}

// Parseia o uid composto e retorna as partes, ou null se o formato for inválido.
// O sentinel 'none' é convertido de volta para undefined.
export function parseMadeiraKey(key: string): ParsedMadeiraKey | null {
  const parts = key.split(':')
  if (parts.length !== 4 || parts[0] !== MADEIRA_PREFIX) return null

  const [, madeira_m3_id, comprimento_id, rawAcabamento] = parts

  // Garante que todas as partes obrigatórias existem após o split
  if (!madeira_m3_id || !comprimento_id || !rawAcabamento) return null

  return {
    madeira_m3_id,
    comprimento_id,
    acabamento_id: rawAcabamento === ACABAMENTO_NONE ? undefined : rawAcabamento,
  }
}
