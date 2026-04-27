import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { CATALOGO_PRODUTOS_KEY } from '@/hooks/useCatalogoProdutos'
import type { EspecieMadeira } from '@/types/produto'
import type { EspecieInput } from '@/lib/schemas/especie-schema'

interface UseEspeciesReturn {
  especies: EspecieMadeira[]
  isLoading: boolean
  create: (input: EspecieInput) => Promise<void>
  update: (id: string, input: EspecieInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

// Hook de CRUD para espécies de madeira da madeireira logada.
// Segue o padrão de resolução de madeireira_id via auth store (não via query extra),
// pois a madeireira está sempre disponível após o login.
export function useEspecies(): UseEspeciesReturn {
  const { madeireira } = useAuthStore()
  const queryClient = useQueryClient()
  const [especies, setEspecies] = useState<EspecieMadeira[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Busca todas as espécies da madeireira logada, ordenadas por nome
  const fetchEspecies = useCallback(async () => {
    if (!madeireira) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('especies_madeira')
        .select('*')
        .eq('madeireira_id', madeireira.id)
        .order('nome')

      if (error) throw error
      setEspecies((data as EspecieMadeira[]) ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [madeireira])

  useEffect(() => {
    fetchEspecies()
  }, [fetchEspecies])

  // Invalida o cache do catálogo de produtos — chamado após mutações que afetam preços das madeiras
  const invalidateCatalogo = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [CATALOGO_PRODUTOS_KEY] })
  }, [queryClient])

  // Cria nova espécie e revalida a lista imediatamente
  const create = useCallback(
    async (input: EspecieInput) => {
      if (!madeireira) throw new Error('Madeireira não autenticada')

      const { error } = await supabase.from('especies_madeira').insert({
        madeireira_id: madeireira.id,
        nome: input.nome,
        custo_m3: input.custo_m3,
        margem_lucro_pct: input.margem_lucro_pct,
      })

      if (error) throw error
      await fetchEspecies()
      invalidateCatalogo()
    },
    [madeireira, fetchEspecies, invalidateCatalogo],
  )

  // Atualiza campos de uma espécie existente e revalida a lista
  const update = useCallback(
    async (id: string, input: EspecieInput) => {
      const { error } = await supabase
        .from('especies_madeira')
        .update({
          nome: input.nome,
          custo_m3: input.custo_m3,
          margem_lucro_pct: input.margem_lucro_pct,
        })
        .eq('id', id)

      if (error) throw error
      await fetchEspecies()
      invalidateCatalogo()
    },
    [fetchEspecies, invalidateCatalogo],
  )

  // Remove espécie pelo id — o CASCADE no banco apaga as madeiras_m3 filhas
  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('especies_madeira')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchEspecies()
      invalidateCatalogo()
    },
    [fetchEspecies, invalidateCatalogo],
  )

  return { especies, isLoading, create, update, remove }
}
