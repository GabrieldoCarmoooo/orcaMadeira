import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { CATALOGO_PRODUTOS_KEY } from '@/hooks/useCatalogoProdutos'
import type { OutroProduto } from '@/types/produto'
import type { OutroProdutoInput } from '@/lib/schemas/outro-produto-schema'

interface UseOutrosProdutosReturn {
  outrosProdutos: OutroProduto[]
  isLoading: boolean
  create: (input: OutroProdutoInput) => Promise<void>
  update: (id: string, input: OutroProdutoInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

// Hook de CRUD para outros produtos (preço fixo) da madeireira logada.
// "Outros produtos" são itens sem cálculo dimensional: parafuso, prego, telha, etc.
export function useOutrosProdutos(): UseOutrosProdutosReturn {
  const { madeireira } = useAuthStore()
  const queryClient = useQueryClient()
  const [outrosProdutos, setOutrosProdutos] = useState<OutroProduto[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Busca todos os outros produtos da madeireira logada, ordenados por nome
  const fetchOutrosProdutos = useCallback(async () => {
    if (!madeireira) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('outros_produtos')
        .select('*')
        .eq('madeireira_id', madeireira.id)
        .order('nome')

      if (error) throw error
      setOutrosProdutos((data as OutroProduto[]) ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [madeireira])

  useEffect(() => {
    fetchOutrosProdutos()
  }, [fetchOutrosProdutos])

  // Invalida o cache do catálogo de produtos após mutações que afetam outros produtos disponíveis
  const invalidateCatalogo = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [CATALOGO_PRODUTOS_KEY] })
  }, [queryClient])

  // Cria novo produto e revalida a lista imediatamente
  const create = useCallback(
    async (input: OutroProdutoInput) => {
      if (!madeireira) throw new Error('Madeireira não autenticada')

      const { error } = await supabase.from('outros_produtos').insert({
        madeireira_id: madeireira.id,
        nome: input.nome,
        unidade: input.unidade,
        preco_unitario: input.preco_unitario,
        descricao: input.descricao ?? null,
      })

      if (error) throw error
      await fetchOutrosProdutos()
      invalidateCatalogo()
    },
    [madeireira, fetchOutrosProdutos, invalidateCatalogo],
  )

  // Atualiza campos de um produto existente e revalida a lista
  const update = useCallback(
    async (id: string, input: OutroProdutoInput) => {
      const { error } = await supabase
        .from('outros_produtos')
        .update({
          nome: input.nome,
          unidade: input.unidade,
          preco_unitario: input.preco_unitario,
          descricao: input.descricao ?? null,
        })
        .eq('id', id)

      if (error) throw error
      await fetchOutrosProdutos()
      invalidateCatalogo()
    },
    [fetchOutrosProdutos, invalidateCatalogo],
  )

  // Remove produto pelo id
  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('outros_produtos')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchOutrosProdutos()
      invalidateCatalogo()
    },
    [fetchOutrosProdutos, invalidateCatalogo],
  )

  return { outrosProdutos, isLoading, create, update, remove }
}
