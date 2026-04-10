import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

export type VinculacaoStatus = 'pendente' | 'aprovada' | 'rejeitada'

export interface VinculacaoAtual {
  id: string
  madeireira_id: string
  status: VinculacaoStatus
  solicitado_at: string
  respondido_at: string | null
  madeireira: {
    razao_social: string
    cidade: string
    estado: string
  }
}

interface UseVinculacaoReturn {
  vinculacao: VinculacaoAtual | null
  loading: boolean
  solicitarVinculacao: (madeireiraId: string) => Promise<void>
  cancelarSolicitacao: () => Promise<void>
}

export function useVinculacao(): UseVinculacaoReturn {
  const { carpinteiro } = useAuthStore()
  const [vinculacao, setVinculacao] = useState<VinculacaoAtual | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchVinculacao = useCallback(async () => {
    if (!carpinteiro) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('vinculacoes')
        .select('id, madeireira_id, status, solicitado_at, respondido_at, madeireiras(razao_social, cidade, estado)')
        .eq('carpinteiro_id', carpinteiro.id)
        .in('status', ['pendente', 'aprovada'])
        .order('solicitado_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        const m = data.madeireiras as { razao_social: string; cidade: string; estado: string } | null
        setVinculacao({
          id: data.id,
          madeireira_id: data.madeireira_id,
          status: data.status as VinculacaoStatus,
          solicitado_at: data.solicitado_at,
          respondido_at: data.respondido_at ?? null,
          madeireira: {
            razao_social: m?.razao_social ?? '',
            cidade: m?.cidade ?? '',
            estado: m?.estado ?? '',
          },
        })
      } else {
        setVinculacao(null)
      }
    } finally {
      setLoading(false)
    }
  }, [carpinteiro])

  // Initial fetch
  useEffect(() => {
    fetchVinculacao()
  }, [fetchVinculacao])

  // Realtime subscription — listens for updates on this carpinteiro's vinculacoes
  useEffect(() => {
    if (!carpinteiro) return

    const channel = supabase
      .channel(`vinculacoes:carpinteiro:${carpinteiro.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vinculacoes',
          filter: `carpinteiro_id=eq.${carpinteiro.id}`,
        },
        () => {
          // Re-fetch to get the joined madeireira data
          fetchVinculacao()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [carpinteiro, fetchVinculacao])

  const solicitarVinculacao = useCallback(
    async (madeireiraId: string) => {
      if (!carpinteiro) return

      // Cancel any existing pending request before creating a new one
      await supabase
        .from('vinculacoes')
        .update({ status: 'rejeitada', respondido_at: new Date().toISOString() })
        .eq('carpinteiro_id', carpinteiro.id)
        .eq('status', 'pendente')

      const { error } = await supabase.from('vinculacoes').insert({
        carpinteiro_id: carpinteiro.id,
        madeireira_id: madeireiraId,
        status: 'pendente',
      })

      if (error) throw error
      // Realtime will trigger fetchVinculacao
    },
    [carpinteiro],
  )

  const cancelarSolicitacao = useCallback(async () => {
    if (!vinculacao || vinculacao.status !== 'pendente') return

    const { error } = await supabase
      .from('vinculacoes')
      .update({ status: 'rejeitada', respondido_at: new Date().toISOString() })
      .eq('id', vinculacao.id)

    if (error) throw error
    // Realtime will trigger fetchVinculacao — also clear immediately
    setVinculacao(null)
  }, [vinculacao])

  return { vinculacao, loading, solicitarVinculacao, cancelarSolicitacao }
}
