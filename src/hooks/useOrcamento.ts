import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'

// Chave exportada para que o wizard possa invalidar o cache após salvar
export const ORCAMENTO_QUERY_KEY = 'orcamento' as const

interface UseOrcamentoReturn {
  orcamento: Orcamento | null
  itens: ItemOrcamento[]
  loading: boolean
  error: string | null
}

// Busca orçamento e seus itens em paralelo — única source of truth por ID
async function fetchOrcamento(id: string): Promise<{ orcamento: Orcamento; itens: ItemOrcamento[] }> {
  const [orcRes, itensRes] = await Promise.all([
    supabase.from('orcamentos').select('*').eq('id', id).single(),
    supabase
      .from('itens_orcamento')
      .select('*')
      .eq('orcamento_id', id)
      .order('nome'),
  ])

  if (orcRes.error) throw orcRes.error

  return {
    orcamento: orcRes.data as Orcamento,
    itens: (itensRes.data ?? []) as ItemOrcamento[],
  }
}

/**
 * Busca um único orçamento e seus itens pelo ID.
 * Usa react-query para cache — navegar para a tela de detalhe não refaz o fetch
 * enquanto os dados estiverem dentro do staleTime global (60s).
 */
export function useOrcamento(id: string | undefined): UseOrcamentoReturn {
  const query = useQuery({
    queryKey: [ORCAMENTO_QUERY_KEY, id],
    queryFn: () => fetchOrcamento(id!),
    enabled: !!id,
  })

  return {
    orcamento: query.data?.orcamento ?? null,
    itens: query.data?.itens ?? [],
    loading: query.isLoading,
    error: query.isError ? 'Orçamento não encontrado.' : null,
  }
}
