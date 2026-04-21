import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ServicoAcabamento } from '@/types/produto'
import type { AcabamentoInput } from '@/lib/schemas/acabamento-schema'

interface UseAcabamentosReturn {
  acabamentos: ServicoAcabamento[]
  isLoading: boolean
  create: (input: AcabamentoInput) => Promise<void>
  update: (id: string, input: AcabamentoInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

// Hook de CRUD para serviços de acabamento da madeireira logada.
// Acabamentos são modificadores percentuais aplicados a itens de madeira m³
// no orçamento (ex: Lixamento +10%, Aparelhado +15%).
export function useAcabamentos(): UseAcabamentosReturn {
  const { madeireira } = useAuthStore()
  const [acabamentos, setAcabamentos] = useState<ServicoAcabamento[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Busca todos os acabamentos da madeireira logada, ordenados por nome
  const fetchAcabamentos = useCallback(async () => {
    if (!madeireira) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('servicos_acabamento')
        .select('*')
        .eq('madeireira_id', madeireira.id)
        .order('nome')

      if (error) throw error
      setAcabamentos((data as ServicoAcabamento[]) ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [madeireira])

  useEffect(() => {
    fetchAcabamentos()
  }, [fetchAcabamentos])

  // Cria novo acabamento e revalida a lista imediatamente
  const create = useCallback(
    async (input: AcabamentoInput) => {
      if (!madeireira) throw new Error('Madeireira não autenticada')

      const { error } = await supabase.from('servicos_acabamento').insert({
        madeireira_id: madeireira.id,
        nome: input.nome,
        percentual_acrescimo: input.percentual_acrescimo,
      })

      if (error) throw error
      await fetchAcabamentos()
    },
    [madeireira, fetchAcabamentos],
  )

  // Atualiza campos de um acabamento existente e revalida a lista.
  // Permite também ativar/desativar via campo `ativo` passando-o no input —
  // mas o campo `ativo` é gerenciado separadamente no painel (toggle).
  const update = useCallback(
    async (id: string, input: AcabamentoInput & { ativo?: boolean }) => {
      const { error } = await supabase
        .from('servicos_acabamento')
        .update({
          nome: input.nome,
          percentual_acrescimo: input.percentual_acrescimo,
          ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
        })
        .eq('id', id)

      if (error) throw error
      await fetchAcabamentos()
    },
    [fetchAcabamentos],
  )

  // Remove acabamento pelo id
  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('servicos_acabamento')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchAcabamentos()
    },
    [fetchAcabamentos],
  )

  return { acabamentos, isLoading, create, update, remove }
}
