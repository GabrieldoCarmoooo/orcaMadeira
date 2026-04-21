import { z } from 'zod'

// Schema de validação para Serviços de Acabamento — modificadores percentuais
// aplicáveis a itens de madeira m³ no orçamento (ex: Lixamento +10%, Aparelhado +15%).
// Equivale à "Apresentação da Madeira" do SISMASTER.
export const acabamentoSchema = z.object({
  // Nome do serviço (ex: "Lixamento", "Aparelhado", "Verniz")
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),

  // Percentual de acréscimo sobre o preço base da madeira.
  // Aceita 0 (sem acréscimo), nunca negativo.
  percentual_acrescimo: z
    .number({ error: 'Informe o percentual de acréscimo' })
    .min(0, 'O percentual não pode ser negativo'),
})

// Tipo inferido usado nos formulários e na chamada ao hook `useAcabamentos`
export type AcabamentoInput = z.infer<typeof acabamentoSchema>
