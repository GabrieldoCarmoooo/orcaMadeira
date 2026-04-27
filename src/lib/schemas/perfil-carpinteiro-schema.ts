import { z } from 'zod'
import { validarCpfCnpj } from '@/lib/validar-cpf-cnpj'

// Schema Zod do formulário de perfil — centralizado para uso no hook e potenciais validações futuras
export const perfilCarpinteiroSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  cpf_cnpj: z.string().refine(validarCpfCnpj, 'CPF ou CNPJ inválido'),
  telefone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
  endereco: z.string().min(5, 'Endereço muito curto'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  margem_lucro_padrao: z.number().min(0).max(100),
  valor_hora_mao_obra: z.number().min(0),
  imposto_padrao: z.number().min(0).max(100),
  custos_adicionais_padrao: z.number().min(0),
  termos_condicoes_padrao: z.string(),
})

export type PerfilFormValues = z.infer<typeof perfilCarpinteiroSchema>
