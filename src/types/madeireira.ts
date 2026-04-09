export interface Madeireira {
  id: string
  user_id: string
  razao_social: string
  cnpj: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface TabelaPreco {
  id: string
  madeireira_id: string
  nome: string
  upload_at: string
  ativo: boolean
}

export interface ItemPreco {
  id: string
  tabela_id: string
  codigo: string | null
  nome: string
  categoria: string | null
  descricao: string | null
  unidade: string
  preco_unitario: number
  disponivel: boolean
}
