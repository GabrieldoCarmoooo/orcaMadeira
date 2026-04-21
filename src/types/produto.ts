// Tipos do catálogo relacional de produtos da madeireira.
// Centraliza todas as interfaces do domínio de precificação e a union discriminada
// `CatalogoItem` consumida pelo hook `useCatalogoProdutos` e pelo step de materiais.

// Espécie de madeira — base de precificação por m³ (custo + margem definem o valor de venda)
export interface EspecieMadeira {
  id: string
  madeireira_id: string
  nome: string
  custo_m3: number
  margem_lucro_pct: number
  created_at: string
  updated_at: string
}

// Comprimento disponível pré-cadastrado pela madeireira para uma madeira m³.
// O carpinteiro seleciona um desses comprimentos no orçamento — não digita valor livre.
export interface ComprimentoMadeiraM3 {
  id: string
  madeira_m3_id: string
  comprimento_m: number
  disponivel: boolean
  created_at: string
}

// Produto de madeira dimensionado (ex: Viga 5×15 Cambará).
// Referencia uma espécie via `especie_id` para herdar o valor de venda calculado.
// `comprimento_m` é o comprimento de referência padrão; os comprimentos reais disponíveis
// ficam em `comprimentos[]`, carregados via JOIN quando necessário.
export interface MadeiraM3 {
  id: string
  madeireira_id: string
  especie_id: string
  nome: string
  espessura_cm: number
  largura_cm: number
  comprimento_m: number
  disponivel: boolean
  created_at: string
  updated_at: string
  // Relações opcionais — populadas via JOIN em `useMadeirasM3` e `useCatalogoProdutos`
  especie?: EspecieMadeira
  comprimentos?: ComprimentoMadeiraM3[]
}

// Produto de preço fixo (ex: parafuso, prego, telha) — sem cálculo dimensional
export interface OutroProduto {
  id: string
  madeireira_id: string
  nome: string
  unidade: string
  preco_unitario: number
  descricao: string | null
  disponivel: boolean
  created_at: string
  updated_at: string
}

// Modificador percentual aplicável a itens de madeira m³ no orçamento
// (ex: Lixamento +10%, Aparelhado +15%). Snapshot gravado no item ao confirmar.
export interface ServicoAcabamento {
  id: string
  madeireira_id: string
  nome: string
  percentual_acrescimo: number
  ativo: boolean
  created_at: string
  updated_at: string
}

// ─── Union discriminada por `origem` ────────────────────────────────────────
// Permite narrowing type-safe em todo o fluxo: `if (item.origem === 'madeira_m3')`
// garante acesso a `item.data.espessura_cm` sem cast.

export interface CatalogoItemMadeiraM3 {
  origem: 'madeira_m3'
  data: MadeiraM3
}

export interface CatalogoItemOutroProduto {
  origem: 'outro_produto'
  data: OutroProduto
}

// Item proveniente de importação de planilha (legado) — preço fixo, sem dimensões
export interface CatalogoItemLegado {
  origem: 'legado_planilha'
  data: {
    id: string
    nome: string
    unidade: string
    preco_unitario: number
  }
}

// CatalogoItem é a union consumida pelo hook `useCatalogoProdutos` e pelo step de materiais.
// O discriminante `origem` é o mesmo usado em `itens_orcamento.origem` no banco.
export type CatalogoItem =
  | CatalogoItemMadeiraM3
  | CatalogoItemOutroProduto
  | CatalogoItemLegado
