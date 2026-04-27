import { z } from 'zod'

// Schema Zod para uma linha de item de preço (valores brutos são strings — coerce numéricos)
export const itemPrecoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  unidade: z.string().min(1, 'Unidade obrigatória'),
  preco_unitario: z.coerce.number().positive('Preço deve ser maior que zero'),
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  especie: z.string().optional(),
  espessura: z.coerce.number().optional(),
  largura: z.coerce.number().optional(),
  comprimento: z.coerce.number().optional(),
})

export type ValidatedItemPreco = z.infer<typeof itemPrecoSchema>
