import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

// Hook central do carpinteiro para busca unificada do catálogo.
// Resolve a madeireira vinculada, busca as 3 fontes em paralelo e unifica em CatalogoItem[].
// A query de texto é debounced 300ms e filtrada client-side por `nome`.
export function useCatalogoProdutos(query: string): UseCatalogoProdutosReturn {
  const { carpinteiro } = useAuthStore()

  // IDs resolvidos a partir da vinculação aprovada do carpinteiro
  const [madeireiraId, setMadeireiraId] = useState<string | null>(null)
  const [tabelaId, setTabelaId] = useState<string | null>(null)

  // Indica se foi encontrada vinculação aprovada — false até a resolução completar
  const [hasVinculacao, setHasVinculacao] = useState(false)

  // Lista completa de itens (sem filtro de texto) — recarregada quando madeireiraId muda
  const [allItems, setAllItems] = useState<CatalogoItem[]>([])
  // Inicia true para evitar flash do estado "sem vinculação" antes da resolução terminar
  const [isLoading, setIsLoading] = useState(true)

  // Query com debounce aplicado para filtrar client-side sem disparar fetch extra
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resolve madeireira_id e tabelaId a partir da vinculação aprovada do carpinteiro logado.
  // O tabelaId é necessário para buscar os itens legados (planilha de preços).
  useEffect(() => {
    if (!carpinteiro) {
      setMadeireiraId(null)
      setTabelaId(null)
      setHasVinculacao(false)
      setIsLoading(false)
      return
    }

    async function resolveVinculacao() {
      const { data: vinculacao } = await supabase
        .from('vinculacoes')
        .select('madeireira_id')
        .eq('carpinteiro_id', carpinteiro!.id)
        .eq('status', 'aprovada')
        .maybeSingle()

      if (!vinculacao) {
        // Sem vínculo aprovado: encerra o loading e expõe o estado para a UI
        setMadeireiraId(null)
        setTabelaId(null)
        setHasVinculacao(false)
        setIsLoading(false)
        return
      }

      setHasVinculacao(true)
      setMadeireiraId(vinculacao.madeireira_id)

      // Tabela de preço ativa — pode não existir se a madeireira ainda não importou planilha
      const { data: tabela } = await supabase
        .from('tabelas_preco')
        .select('id')
        .eq('madeireira_id', vinculacao.madeireira_id)
        .eq('ativo', true)
        .maybeSingle()

      setTabelaId(tabela?.id ?? null)
      // fetchAll assume o controle do isLoading a partir daqui
    }

    resolveVinculacao()
  }, [carpinteiro])

  // Busca as 3 fontes do catálogo em paralelo e unifica em CatalogoItem[].
  // Ordem na lista final: madeiras m³ → outros produtos → legado planilha.
  const fetchAll = useCallback(async () => {
    if (!madeireiraId) {
      setAllItems([])
      return
    }

    setIsLoading(true)
    try {
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
          .select(`
            *,
            especie:especie_id(*),
            comprimentos:comprimentos_madeira_m3(*)
          `)
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

      setAllItems([...itemsMadeiras, ...itemsOutros, ...itemsLegado])
    } catch {
      // Em caso de erro, retorna lista vazia — o componente pode exibir empty state
      setAllItems([])
    } finally {
      setIsLoading(false)
    }
  }, [madeireiraId, tabelaId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Aplica debounce de 300ms na query antes de filtrar para evitar re-renders a cada tecla
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Filtra client-side por nome — operação barata pois `allItems` já está em memória
  const items = useMemo(() => {
    if (!debouncedQuery.trim()) return allItems
    const lower = debouncedQuery.trim().toLowerCase()
    return allItems.filter((item) => item.data.nome.toLowerCase().includes(lower))
  }, [allItems, debouncedQuery])

  return { items, isLoading, hasVinculacao }
}
