import { z } from 'zod'

// Schema de validação para Outros Produtos — itens de preço fixo com unidade livre
// (ex: parafuso, prego, telha, tinta). Não envolve cálculo dimensional.
export const outroProdutoSchema = z.object({
  // Nome do produto (ex: "Prego 17×21")
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),

  // Unidade de medida livre — determina como o carpinteiro quantifica o item no orçamento
  unidade: z.string().min(1, 'Informe a unidade de medida'),

  // Preço unitário — aceita 0 (promoção / item gratuito), nunca negativo
  preco_unitario: z
    .number({ error: 'Informe o preço unitário' })
    .min(0, 'O preço não pode ser negativo'),

  // Descrição opcional para detalhar o produto no catálogo
  descricao: z.string().optional(),
})

// Tipo inferido usado nos formulários e na chamada ao hook `useOutrosProdutos`
export type OutroProdutoInput = z.infer<typeof outroProdutoSchema>
