import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Range de datas em formato YYYY-MM-DD — exportado para uso no dashboard
export interface DateRange {
  from: string
  to: string
}

// Colunas financeiras necessárias para as métricas (apenas pedidos_fechados)
interface PedidoFechadoRow {
  subtotal_mao_obra: number
  valor_margem: number
  imposto: number
  custos_adicionais: number
  deslocamento: number
  total: number
}

export interface DashboardMetricas {
  // Soma da mão de obra nos pedidos fechados do período
  totalMaoObra: number
  // Soma da margem de lucro nos pedidos fechados do período
  totalMargem: number
  // Soma combinada: margem + mão de obra (rentabilidade operacional)
  totalMargemMaoObra: number
  // Soma de custos que não vão ao cliente: imposto + deslocamento + custos_adicionais
  totalCustos: number
  // Quantidade de orçamentos com status pedido_fechado no período
  countPedidosFechados: number
  // Valor total dos pedidos fechados (campo `total` do orçamento)
  valorPedidosFechados: number
  loading: boolean
  error: string | null
}

const METRICAS_ZERADAS: Omit<DashboardMetricas, 'loading' | 'error'> = {
  totalMaoObra: 0,
  totalMargem: 0,
  totalMargemMaoObra: 0,
  totalCustos: 0,
  countPedidosFechados: 0,
  valorPedidosFechados: 0,
}

/**
 * Agrega métricas financeiras exclusivamente sobre orçamentos com status `pedido_fechado`
 * no período informado. Valores refletem negócios efetivamente realizados.
 */
export function useDashboardMetricas(
  carpinteiroId: string | undefined,
  dateRange: DateRange,
): DashboardMetricas {
  const [metricas, setMetricas] = useState<Omit<DashboardMetricas, 'loading' | 'error'>>(METRICAS_ZERADAS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!carpinteiroId) return
    // Captura o id como string após o guard para que o TypeScript o trate como não-nulo
    // dentro da closure assíncrona — o compilador não consegue estreitar através de await
    const id = carpinteiroId

    let cancelled = false

    async function fetchMetricas() {
      setLoading(true)
      setError(null)

      // Converte datas YYYY-MM-DD para timestamps de início e fim do período
      const fromIso = `${dateRange.from}T00:00:00`
      const toIso = `${dateRange.to}T23:59:59`

      // Busca apenas pedidos fechados — garante que as métricas representam receita real
      const { data, error: fetchError } = await supabase
        .from('orcamentos')
        .select(
          'subtotal_mao_obra, valor_margem, imposto, custos_adicionais, deslocamento, total',
        )
        .eq('carpinteiro_id', id)
        .eq('status', 'pedido_fechado')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)

      if (cancelled) return

      if (fetchError) {
        setError('Erro ao carregar métricas de pedidos fechados.')
        setLoading(false)
        return
      }

      const rows = (data ?? []) as PedidoFechadoRow[]

      // Agrega cada dimensão financeira somando sobre todos os pedidos fechados do período
      const totalMaoObra = rows.reduce((acc, r) => acc + r.subtotal_mao_obra, 0)
      const totalMargem = rows.reduce((acc, r) => acc + r.valor_margem, 0)
      const totalCustos = rows.reduce(
        (acc, r) => acc + r.imposto + r.custos_adicionais + r.deslocamento,
        0,
      )
      const valorPedidosFechados = rows.reduce((acc, r) => acc + r.total, 0)

      setMetricas({
        totalMaoObra,
        totalMargem,
        // Rentabilidade operacional: o que o carpinteiro efetivamente ganhou por fazer o trabalho
        totalMargemMaoObra: totalMargem + totalMaoObra,
        totalCustos,
        countPedidosFechados: rows.length,
        valorPedidosFechados,
      })
      setLoading(false)
    }

    fetchMetricas()
    return () => {
      cancelled = true
    }
  }, [carpinteiroId, dateRange.from, dateRange.to])

  return { ...metricas, loading, error }
}
