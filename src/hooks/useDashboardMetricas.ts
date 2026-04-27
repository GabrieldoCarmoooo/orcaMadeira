import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ORCAMENTO_STATUS } from '@/constants/orcamento-status'

// Chave exportada para invalidação caso mutações afetem os pedidos fechados
export const DASHBOARD_METRICAS_QUERY_KEY = 'dashboard-metricas' as const

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

// Busca e agrega métricas de pedidos fechados no período — lança exceção em caso de erro
async function fetchMetricas(
  carpinteiroId: string,
  dateRange: DateRange,
): Promise<Omit<DashboardMetricas, 'loading' | 'error'>> {
  // Converte datas YYYY-MM-DD para timestamps de início e fim do período
  const fromIso = `${dateRange.from}T00:00:00`
  const toIso = `${dateRange.to}T23:59:59`

  // Busca apenas pedidos fechados — garante que as métricas representam receita real
  const { data, error } = await supabase
    .from('orcamentos')
    .select(
      'subtotal_mao_obra, valor_margem, imposto, custos_adicionais, deslocamento, total',
    )
    .eq('carpinteiro_id', carpinteiroId)
    .eq('status', ORCAMENTO_STATUS.pedido_fechado.value)
    .gte('created_at', fromIso)
    .lte('created_at', toIso)

  if (error) throw error

  const rows = (data ?? []) as PedidoFechadoRow[]

  // Agrega cada dimensão financeira somando sobre todos os pedidos fechados do período
  const totalMaoObra = rows.reduce((acc, r) => acc + r.subtotal_mao_obra, 0)
  const totalMargem = rows.reduce((acc, r) => acc + r.valor_margem, 0)
  const totalCustos = rows.reduce(
    (acc, r) => acc + r.imposto + r.custos_adicionais + r.deslocamento,
    0,
  )
  const valorPedidosFechados = rows.reduce((acc, r) => acc + r.total, 0)

  return {
    totalMaoObra,
    totalMargem,
    // Rentabilidade operacional: o que o carpinteiro efetivamente ganhou por fazer o trabalho
    totalMargemMaoObra: totalMargem + totalMaoObra,
    totalCustos,
    countPedidosFechados: rows.length,
    valorPedidosFechados,
  }
}

/**
 * Agrega métricas financeiras exclusivamente sobre orçamentos com status `pedido_fechado`
 * no período informado. Usa react-query — voltar ao dashboard não refaz o fetch enquanto
 * os dados estão dentro do staleTime e o período não mudou.
 */
export function useDashboardMetricas(
  carpinteiroId: string | undefined,
  dateRange: DateRange,
): DashboardMetricas {
  // queryKey inclui as datas para revalidar automaticamente ao trocar o período
  const query = useQuery({
    queryKey: [DASHBOARD_METRICAS_QUERY_KEY, carpinteiroId, dateRange.from, dateRange.to],
    queryFn: () => fetchMetricas(carpinteiroId!, dateRange),
    enabled: !!carpinteiroId,
  })

  return {
    ...(query.data ?? METRICAS_ZERADAS),
    loading: query.isLoading,
    error: query.isError ? 'Erro ao carregar métricas de pedidos fechados.' : null,
  }
}
