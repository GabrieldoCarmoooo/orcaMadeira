import { z } from 'zod'

// Schema de validação para o cadastro e edição de Espécies de Madeira.
// Espécie é a base de precificação — define custo/m³ e margem de lucro que
// determinam o valor de venda calculado de todas as madeiras m³ vinculadas.
export const especieSchema = z.object({
  // Nome único por madeireira (índice UNIQUE case-insensitive no banco)
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),

  // Custo por m³ da madeireira — base do cálculo de venda; não pode ser zero ou negativo
  custo_m3: z
    .number({ error: 'Informe o custo por m³' })
    .positive('O custo/m³ deve ser maior que zero'),

  // Percentual de margem de lucro aplicado sobre o custo para chegar ao preço de venda.
  // Aceita 0 (sem margem), nunca negativo.
  margem_lucro_pct: z
    .number({ error: 'Informe a margem de lucro' })
    .min(0, 'A margem não pode ser negativa'),
})

// Tipo inferido usado nos formulários e na chamada ao hook `useEspecies`
export type EspecieInput = z.infer<typeof especieSchema>
