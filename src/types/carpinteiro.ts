export interface Carpinteiro {
  id: string
  user_id: string
  nome: string
  cpf_cnpj: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  logo_url: string | null
  margem_lucro_padrao: number
  valor_hora_mao_obra: number
  imposto_padrao: number
  madeireira_id: string | null
  created_at: string
  updated_at: string
}
