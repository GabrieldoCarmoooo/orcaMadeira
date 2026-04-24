// Tipo discriminante para arquivos do portfólio — espelha o CHECK do banco
export type PortfolioArquivoTipo = 'imagem' | 'pdf'

export interface Portfolio {
  id: string
  carpinteiro_id: string
  nome: string
  // Slug curto gerado no cliente (ex.: 8 chars URL-safe) para URL pública /p/{slug}
  slug: string | null
  created_at: string
}

export interface PortfolioArquivo {
  id: string
  portfolio_id: string
  tipo: PortfolioArquivoTipo
  // Caminho no bucket: {carpinteiro_id}/{portfolio_id}/{nome_arquivo}
  storage_path: string
  ordem: number
  created_at: string
}

// Portfólio com arquivos já carregados — usado na página pública e na listagem com preview
export interface PortfolioComArquivos extends Portfolio {
  arquivos: PortfolioArquivo[]
}
