import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Portfolio, PortfolioArquivo, PortfolioArquivoTipo, PortfolioComArquivos } from '@/types/portfolio'

// Alfabeto URL-safe para geração de slug sem dependência externa.
// Usa Web Crypto API (disponível em todos os browsers modernos e Node 18+).
const SLUG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function gerarSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join('')
}

// Infere o tipo ('imagem' | 'pdf') a partir do MIME type do arquivo
function inferirTipoArquivo(file: File): PortfolioArquivoTipo {
  return file.type === 'application/pdf' ? 'pdf' : 'imagem'
}

export interface CriarPortfolioInput {
  nome: string
  files: File[]
}

interface UsePortfoliosReturn {
  portfolios: Portfolio[]
  isLoading: boolean
  create: (input: CriarPortfolioInput) => Promise<Portfolio>
  remove: (id: string) => Promise<void>
}

// ──────────────────────────────────────────────────────────────
// Helpers de Storage — derivam URL pública a partir do caminho no bucket.
// ──────────────────────────────────────────────────────────────

export function getStoragePublicUrl(storagePath: string): string {
  return supabase.storage.from('portfolios').getPublicUrl(storagePath).data.publicUrl
}

// Retorna mapa portfolio_id → URL pública da primeira imagem de cada portfólio.
// Usado para renderizar thumbnails na listagem sem carregar todos os arquivos.
export async function getPortfolioThumbnails(
  portfolioIds: string[],
): Promise<Record<string, string>> {
  if (!portfolioIds.length) return {}

  const { data } = await supabase
    .from('portfolio_arquivos')
    .select('portfolio_id, storage_path')
    .in('portfolio_id', portfolioIds)
    .eq('tipo', 'imagem')
    .order('ordem')

  if (!data) return {}

  const map: Record<string, string> = {}
  for (const arq of data) {
    if (!map[arq.portfolio_id]) {
      map[arq.portfolio_id] = getStoragePublicUrl(arq.storage_path)
    }
  }
  return map
}

// ──────────────────────────────────────────────────────────────
// Função pública — não requer autenticação.
// Usada pela página /p/{slug} (acessível sem login).
// ──────────────────────────────────────────────────────────────
export async function getPortfolioBySlug(
  slug: string,
): Promise<PortfolioComArquivos | null> {
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !portfolio) return null

  // Carrega arquivos ordenados pela coluna `ordem` para respeitar sequência visual
  const { data: arquivos } = await supabase
    .from('portfolio_arquivos')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .order('ordem')

  return {
    ...(portfolio as Portfolio),
    arquivos: (arquivos ?? []) as PortfolioArquivo[],
  }
}

// ──────────────────────────────────────────────────────────────
// Hook de CRUD — requer carpinteiro autenticado.
// ──────────────────────────────────────────────────────────────
export function usePortfolios(): UsePortfoliosReturn {
  const { carpinteiro } = useAuthStore()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Busca todos os portfólios do carpinteiro logado, mais recentes primeiro
  const fetchPortfolios = useCallback(async () => {
    if (!carpinteiro) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('carpinteiro_id', carpinteiro.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPortfolios((data as Portfolio[]) ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [carpinteiro])

  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  // Cria portfólio:
  //   1. Insere o registro (obtém ID para montar o caminho no Storage)
  //   2. Faz upload sequencial de cada arquivo no caminho {carpinteiro_id}/{portfolio_id}/{filename}
  //   3. Insere registros em portfolio_arquivos com storage_path e ordem
  const create = useCallback(
    async ({ nome, files }: CriarPortfolioInput): Promise<Portfolio> => {
      if (!carpinteiro) throw new Error('Carpinteiro não autenticado')

      const slug = gerarSlug()

      const { data: portfolio, error: insertError } = await supabase
        .from('portfolios')
        .insert({ carpinteiro_id: carpinteiro.id, nome, slug })
        .select()
        .single()

      if (insertError || !portfolio) {
        throw insertError ?? new Error('Falha ao criar portfólio')
      }

      // Faz upload e coleta metadados para inserção em lote
      const arquivosParaInserir: Array<{
        portfolio_id: string
        tipo: PortfolioArquivoTipo
        storage_path: string
        ordem: number
      }> = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // noUncheckedIndexedAccess: o loop é delimitado por files.length, portanto file sempre existe
        if (!file) continue
        // Caminho convencional do bucket: {carpinteiro_id}/{portfolio_id}/{nome_arquivo}
        const storagePath = `${carpinteiro.id}/${portfolio.id}/${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('portfolios')
          .upload(storagePath, file, { upsert: true })

        if (uploadError) throw uploadError

        arquivosParaInserir.push({
          portfolio_id: portfolio.id,
          tipo: inferirTipoArquivo(file),
          storage_path: storagePath,
          ordem: i,
        })
      }

      if (arquivosParaInserir.length > 0) {
        const { error: arquivosError } = await supabase
          .from('portfolio_arquivos')
          .insert(arquivosParaInserir)

        if (arquivosError) throw arquivosError
      }

      await fetchPortfolios()
      return portfolio as Portfolio
    },
    [carpinteiro, fetchPortfolios],
  )

  // Remove portfólio:
  //   1. Busca storage_paths antes de deletar (CASCADE do banco apaga portfolio_arquivos)
  //   2. Deleta o registro no banco
  //   3. Remove os arquivos do bucket após confirmar deleção no banco
  const remove = useCallback(
    async (id: string) => {
      if (!carpinteiro) throw new Error('Carpinteiro não autenticado')

      // Busca paths antes de deletar para limpar o bucket depois
      const { data: arquivos } = await supabase
        .from('portfolio_arquivos')
        .select('storage_path')
        .eq('portfolio_id', id)

      const { error } = await supabase.from('portfolios').delete().eq('id', id)
      if (error) throw error

      // Limpeza do Storage — falha silenciosa não bloqueia o fluxo (o bucket é público)
      if (arquivos && arquivos.length > 0) {
        const paths = arquivos.map((a) => a.storage_path)
        await supabase.storage.from('portfolios').remove(paths)
      }

      await fetchPortfolios()
    },
    [carpinteiro, fetchPortfolios],
  )

  return { portfolios, isLoading, create, remove }
}
