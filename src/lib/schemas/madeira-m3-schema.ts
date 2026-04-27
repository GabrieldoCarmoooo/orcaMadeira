import { z } from 'zod'

// Schema de validação para cadastro e edição de Madeiras m³.
// Uma madeira m³ é um produto dimensionado (ex: Viga 5×15 Cambará) que referencia
// uma espécie para herdar o valor de venda calculado. Contém uma lista 1:N de
// comprimentos disponíveis pré-cadastrados pela madeireira.

// Sub-schema de cada comprimento disponível (tabela `comprimentos_madeira_m3`)
const comprimentoItemSchema = z.object({
  // Limite de 20 m reflete o maior comprimento comercial usual de tora serrada
  comprimento_m: z
    .number({ error: 'Informe o comprimento' })
    .positive('O comprimento deve ser maior que zero')
    .max(20, 'O comprimento não pode exceder 20 m'),

  // Permite desativar um comprimento sem excluí-lo, preservando histórico
  disponivel: z.boolean(),
})

export const madeiraM3Schema = z.object({
  // UUID da espécie vinculada — resolve o valor de venda via cálculo
  especie_id: z.string().uuid('Selecione uma espécie válida'),

  // Nome descritivo do produto (ex: "Viga 5×15 Cambará")
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),

  // Dimensões da seção transversal em cm — usadas no cálculo de volume.
  // Limites superiores refletem realidade física de madeiras serradas comerciais.
  espessura_cm: z
    .number({ error: 'Informe a espessura' })
    .positive('A espessura deve ser maior que zero')
    .max(100, 'A espessura não pode exceder 100 cm'),

  largura_cm: z
    .number({ error: 'Informe a largura' })
    .positive('A largura deve ser maior que zero')
    .max(500, 'A largura não pode exceder 500 cm'),

  // Comprimento de referência padrão em metros (base para preview de preço no formulário).
  // O default (1) é aplicado no defaultValues do form, não no schema, para evitar
  // incompatibilidade entre z.input<> (optional) e z.output<> (required) no zodResolver.
  comprimento_m: z
    .number({ error: 'Informe o comprimento de referência' })
    .positive('O comprimento deve ser maior que zero')
    .max(20, 'O comprimento não pode exceder 20 m'),

  // Lista de comprimentos reais disponíveis para seleção no orçamento.
  // Opcional no schema — o painel de comprimentos pode ser preenchido após o cadastro.
  comprimentos: z.array(comprimentoItemSchema).optional(),
})

// Tipo inferido usado nos formulários e na chamada ao hook `useMadeirasM3`
export type MadeiraM3Input = z.infer<typeof madeiraM3Schema>

// Tipo do item de comprimento, reutilizável nos componentes de sub-lista
export type ComprimentoItemInput = z.infer<typeof comprimentoItemSchema>
