import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'

interface UseOrcamentoReturn {
  orcamento: Orcamento | null
  itens: ItemOrcamento[]
  loading: boolean
  error: string | null
}

/**
 * Fetches a single orcamento by ID together with its denormalized itens_orcamento.
 * Re-fetches automatically when `id` changes.
 */
export function useOrcamento(id: string | undefined): UseOrcamentoReturn {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [itens, setItens] = useState<ItemOrcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const safeId = id
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const [orcRes, itensRes] = await Promise.all([
        supabase.from('orcamentos').select('*').eq('id', safeId).single(),
        supabase
          .from('itens_orcamento')
          .select('*')
          .eq('orcamento_id', safeId)
          .order('nome'),
      ])

      if (cancelled) return

      if (orcRes.error) {
        setError('Orçamento não encontrado.')
        setLoading(false)
        return
      }

      setOrcamento(orcRes.data as Orcamento)
      setItens((itensRes.data ?? []) as ItemOrcamento[])
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [id])

  return { orcamento, itens, loading, error }
}
