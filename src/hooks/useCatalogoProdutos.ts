import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type {
  CatalogoItem,
  CatalogoItemLegado,
  CatalogoItemMadeiraM3,
  CatalogoItemOutroProduto,
  ComprimentoMadeiraM3,
  EspecieMadeira,
  MadeiraM3,
  OutroProduto,
} from '@/types/produto'

// Chaves exportadas para que código externo possa invalidar este cache após mutações no catálogo
export const CATALOGO_VINCULACAO_KEY = 'catalogo-vinculacao' as const
export const CATALOGO_PRODUTOS_KEY = 'catalogo-produtos' as const

interface UseCatalogoProdutosReturn {
  items: CatalogoItem[]
  isLoading: boolean
  // true após a resolução da vinculação confirmar que existe vínculo aprovado
  hasVinculacao: boolean
}

// Tipo interno para a row de madeira_m3 retornada pelo PostgREST com relações aninhadas
interface MadeiraM3Row {
  id: string
  madeireira_id: string
  especie_id: string
  nome: string
  espessura_cm: number
  largura_cm: number
  comprimento_m: number
  disponivel: boolean
  created_at: string
  updated_at: string
  especie: EspecieMadeira | null
  comprimentos: ComprimentoMadeiraM3[]
}

// Tipo mínimo retornado na query de itens legados (planilha)
interface LegadoRow {
  id: string
  nome: string
  unidade: string
  preco_unitario: number
}

// Resolve madeireira_id e tabelaId a partir da vinculação aprovada do carpinteiro.
// Executa duas queries sequenciais: vinculação → tabela de preço ativa.
// Retorna null para ambos se não houver vínculo aprovado.
async function fetchVinculacao(
  carpinteiroId: string
): Promise<{ madeireiraId: string | null; tabelaId: string | null }> {
  const { data: vinculacao } = await supabase
    .from('vinculacoes')
    .select('madeireira_id')
    .eq('carpinteiro_id', carpinteiroId)
    .eq('status', 'aprovada')
    .maybeSingle()

  if (!vinculacao) {
    return { madeireiraId: null, tabelaId: null }
  }

  // Tabela de preço ativa — pode não existir se a madeireira ainda não importou planilha
  const { data: tabela } = await supabase
    .from('tabelas_preco')
    .select('id')
    .eq('madeireira_id', vinculacao.madeireira_id)
    .eq('ativo', true)
    .maybeSingle()

  return {
    madeireiraId: vinculacao.madeireira_id as string,
    tabelaId: (tabela?.id ?? null) as string | null,
  }
}

// Busca as 3 fontes do catálogo em paralelo e retorna lista unificada de CatalogoItem.
// Ordem na lista final: madeiras m³ → outros produtos → legado planilha.
async function fetchProdutos(
  madeireiraId: string,
  tabelaId: string | null
): Promise<CatalogoItem[]> {
  // Query legada só existe se a madeireira tiver tabela de preço ativa
  const legadoPromise = tabelaId
    ? supabase
        .from('itens_preco')
        .select('id, nome, unidade, preco_unitario')
        .eq('tabela_id', tabelaId)
        .eq('disponivel', true)
        .order('nome')
    : Promise.resolve({ data: [] as LegadoRow[], error: null })

  // 3 queries em paralelo — madeiras m³ com espécie e comprimentos, outros produtos, legado
  const [madeirasResult, outrosResult, legadoResult] = await Promise.all([
    supabase
      .from('madeiras_m3')
      .select(`*, especie:especie_id(*), comprimentos:comprimentos_madeira_m3(*)`)
      .eq('madeireira_id', madeireiraId)
      .eq('disponivel', true)
      .order('nome'),
    supabase
      .from('outros_produtos')
      .select('*')
      .eq('madeireira_id', madeireiraId)
      .eq('disponivel', true)
      .order('nome'),
    legadoPromise,
  ])

  if (madeirasResult.error) throw madeirasResult.error
  if (outrosResult.error) throw outrosResult.error
  if (legadoResult.error) throw legadoResult.error

  // Mapeia madeiras_m3 para CatalogoItemMadeiraM3 — filtra comprimentos indisponíveis client-side
  const itemsMadeiras: CatalogoItemMadeiraM3[] = (
    (madeirasResult.data as MadeiraM3Row[]) ?? []
  ).map((row) => ({
    origem: 'madeira_m3' as const,
    data: {
      ...row,
      especie: row.especie ?? undefined,
      // Mantém apenas comprimentos com disponivel=true para o carpinteiro ver no Select
      comprimentos: (row.comprimentos ?? []).filter((c) => c.disponivel),
    } as MadeiraM3,
  }))

  // Mapeia outros_produtos para CatalogoItemOutroProduto
  const itemsOutros: CatalogoItemOutroProduto[] = (
    (outrosResult.data as OutroProduto[]) ?? []
  ).map((row) => ({
    origem: 'outro_produto' as const,
    data: row,
  }))

  // Mapeia itens legados (planilha) para CatalogoItemLegado — apenas os campos mínimos
  const itemsLegado: CatalogoItemLegado[] = (
    (legadoResult.data as LegadoRow[]) ?? []
  ).map((row) => ({
    origem: 'legado_planilha' as const,
    data: {
      id: row.id,
      nome: row.nome,
      unidade: row.unidade,
      preco_unitario: row.preco_unitario,
    },
  }))

  return [...itemsMadeiras, ...itemsOutros, ...itemsLegado]
}

// Hook central do carpinteiro para busca unificada do catálogo.
// Usa react-query para cache, desduplicação de requests e revalidação automática.
// A query de texto é debounced 300ms e filtrada client-side por `nome`.
export function useCatalogoProdutos(query: string): UseCatalogoProdutosReturn {
  const { carpinteiro } = useAuthStore()

  // Resolve madeireira_id e tabelaId via vinculação aprovada — staleTime maior pois muda raramente
  const vinculacaoQuery = useQuery({
    queryKey: [CATALOGO_VINCULACAO_KEY, carpinteiro?.id],
    queryFn: () => fetchVinculacao(carpinteiro!.id),
    enabled: !!carpinteiro,
    staleTime: 5 * 60_000,
  })

  const madeireiraId = vinculacaoQuery.data?.madeireiraId ?? null
  const tabelaId = vinculacaoQuery.data?.tabelaId ?? null
  const hasVinculacao = !!madeireiraId

  // Busca os produtos do catálogo — só executa após resolver o madeireiraId
  const produtosQuery = useQuery({
    queryKey: [CATALOGO_PRODUTOS_KEY, madeireiraId, tabelaId],
    queryFn: () => fetchProdutos(madeireiraId!, tabelaId),
    enabled: !!madeireiraId,
  })

  // Loga erro real em vez de suprimir silenciosamente — distinção entre "vazio" e "falha"
  useEffect(() => {
    if (produtosQuery.error) {
      console.error('[useCatalogoProdutos] Erro ao buscar produtos do catálogo:', produtosQuery.error)
    }
  }, [produtosQuery.error])

  // isLoading = true enquanto vinculação ou produtos ainda estão sendo buscados pela primeira vez
  const isLoading = vinculacaoQuery.isLoading || (!!madeireiraId && produtosQuery.isLoading)

  // Debounce de 300ms na query de texto para filtrar client-side sem re-renders a cada tecla
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const allItems = produtosQuery.data ?? []

  // Filtra client-side por nome — operação barata pois allItems já está em cache da query
  const items = useMemo(() => {
    if (!debouncedQuery.trim()) return allItems
    const lower = debouncedQuery.trim().toLowerCase()
    return allItems.filter((item) => item.data.nome.toLowerCase().includes(lower))
  }, [allItems, debouncedQuery])

  return { items, isLoading, hasVinculacao }
}
