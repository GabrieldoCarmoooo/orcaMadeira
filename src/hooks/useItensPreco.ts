import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ItemPreco } from '@/types/madeireira'

interface UseItensPrecoReturn {
  itens: ItemPreco[]
  loading: boolean
  query: string
  setQuery: (q: string) => void
  tabelaId: string | null
}

/**
 * Searches itens_preco from the active tabela of the carpinteiro's linked madeireira.
 * Debounces the search query by 300ms.
 */
export function useItensPreco(): UseItensPrecoReturn {
  const { carpinteiro } = useAuthStore()
  const [tabelaId, setTabelaId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [itens, setItens] = useState<ItemPreco[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resolve active tabela_id from carpinteiro's approved vinculacao
  useEffect(() => {
    if (!carpinteiro) return

    async function resolveTabela() {
      const { data: vinculacao } = await supabase
        .from('vinculacoes')
        .select('madeireira_id')
        .eq('carpinteiro_id', carpinteiro!.id)
        .eq('status', 'aprovada')
        .maybeSingle()

      if (!vinculacao) {
        setTabelaId(null)
        return
      }

      const { data: tabela } = await supabase
        .from('tabelas_preco')
        .select('id')
        .eq('madeireira_id', vinculacao.madeireira_id)
        .eq('ativo', true)
        .maybeSingle()

      setTabelaId(tabela?.id ?? null)
    }

    resolveTabela()
  }, [carpinteiro])

  const search = useCallback(
    async (q: string, tabela: string) => {
      setLoading(true)
      try {
        let queryBuilder = supabase
          .from('itens_preco')
          .select('*')
          .eq('tabela_id', tabela)
          .eq('disponivel', true)
          .order('nome')
          .limit(30)

        if (q.trim()) {
          queryBuilder = queryBuilder.ilike('nome', `%${q.trim()}%`)
        }

        const { data } = await queryBuilder
        setItens((data as ItemPreco[]) ?? [])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Debounced search whenever query or tabelaId changes
  useEffect(() => {
    if (!tabelaId) {
      setItens([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      search(query, tabelaId)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, tabelaId, search])

  return { itens, loading, query, setQuery, tabelaId }
}
