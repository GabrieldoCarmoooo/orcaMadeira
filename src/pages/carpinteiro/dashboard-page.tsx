import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Link2, FileText, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useDashboardMetricas } from '@/hooks/useDashboardMetricas'
import type { DateRange } from '@/hooks/useDashboardMetricas'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import OrcamentoRecenteCard from '@/components/orcamento/orcamento-recente-card'
import type { Orcamento } from '@/types/orcamento'

// Presets de período disponíveis no seletor
type DatePreset = 'mes_atual' | 'ultimos_30' | 'ultimos_90' | 'personalizado'

type OrcamentoResumo = Pick<
  Orcamento,
  'id' | 'nome' | 'cliente_nome' | 'status' | 'total' | 'created_at'
>

interface DashboardStats {
  totalPedidosFechados: number
  totalSalvos: number
  countPedidosFechados: number
  countSalvos: number
  countCancelados: number
  recentes: OrcamentoResumo[]
}

const PRESET_LABELS: Record<DatePreset, string> = {
  mes_atual: 'Mês atual',
  ultimos_30: 'Últimos 30 dias',
  ultimos_90: 'Últimos 90 dias',
  personalizado: 'Personalizado',
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Converte Date para string YYYY-MM-DD usando o fuso local (evita off-by-one do toISOString em UTC-3)
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Calcula o range de datas correspondente a cada preset fixo
function calcularRangePreset(preset: Exclude<DatePreset, 'personalizado'>): DateRange {
  const hoje = new Date()
  const to = toLocalDateStr(hoje)

  if (preset === 'mes_atual') {
    const from = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return { from: toLocalDateStr(from), to }
  }
  if (preset === 'ultimos_30') {
    const from = new Date(hoje)
    from.setDate(hoje.getDate() - 30)
    return { from: toLocalDateStr(from), to }
  }
  // ultimos_90
  const from = new Date(hoje)
  from.setDate(hoje.getDate() - 90)
  return { from: toLocalDateStr(from), to }
}

// Formata data YYYY-MM-DD para exibição pt-BR
function formatarDataPtBR(dateStr: string, incluirAno = false): string {
  // Usar T12:00:00 local para evitar ambiguidade de fuso
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(incluirAno ? { year: 'numeric' } : {}),
  })
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function CarpinteiroDashboardPage() {
  const { carpinteiro } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Estado do filtro de período — inicia em "Mês atual" (critério de aceite)
  const [preset, setPreset] = useState<DatePreset>('mes_atual')
  const [dateRange, setDateRange] = useState<DateRange>(calcularRangePreset('mes_atual'))
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Métricas de pedidos fechados — exclusivas de negócios efetivamente realizados
  const metricas = useDashboardMetricas(carpinteiro?.id, dateRange)

  // Ao trocar preset fixo, recalcula o range imediatamente
  function handlePresetChange(value: DatePreset) {
    setPreset(value)
    if (value !== 'personalizado') {
      setDateRange(calcularRangePreset(value))
    }
  }

  // Confirma período personalizado após o usuário preencher as duas datas
  function handleCustomApply() {
    if (customFrom && customTo && customFrom <= customTo) {
      setDateRange({ from: customFrom, to: customTo })
    }
  }

  // Busca métricas gerais toda vez que o carpinteiro ou o range de datas muda
  useEffect(() => {
    if (!carpinteiro) return

    async function fetchStats() {
      setLoading(true)
      try {
        // Timestamps de início e fim do período selecionado
        const fromIso = `${dateRange.from}T00:00:00`
        const toIso = `${dateRange.to}T23:59:59`

        const [pedidosFechadosRes, salvosRes, canceladosRes, recentesRes] = await Promise.all([
          // Apenas pedidos efetivamente fechados no período — base das métricas de receita
          supabase
            .from('orcamentos')
            .select('total')
            .eq('carpinteiro_id', carpinteiro!.id)
            .eq('status', 'pedido_fechado')
            .gte('created_at', fromIso)
            .lte('created_at', toIso),

          // Orçamentos salvos (prontos mas ainda não convertidos em pedido)
          supabase
            .from('orcamentos')
            .select('total')
            .eq('carpinteiro_id', carpinteiro!.id)
            .eq('status', 'salvo')
            .gte('created_at', fromIso)
            .lte('created_at', toIso),

          // Orçamentos cancelados no período
          supabase
            .from('orcamentos')
            .select('id')
            .eq('carpinteiro_id', carpinteiro!.id)
            .eq('status', 'cancelado')
            .gte('created_at', fromIso)
            .lte('created_at', toIso),

          // Últimas 5 propostas (sem filtro de período — mostra o histórico recente sempre)
          supabase
            .from('orcamentos')
            .select('id, nome, cliente_nome, status, total, created_at')
            .eq('carpinteiro_id', carpinteiro!.id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        const sum = (rows: { total: number }[]) =>
          (rows ?? []).reduce((acc, r) => acc + (r.total as number), 0)

        setStats({
          totalPedidosFechados: sum(pedidosFechadosRes.data ?? []),
          totalSalvos: sum(salvosRes.data ?? []),
          countPedidosFechados: pedidosFechadosRes.data?.length ?? 0,
          countSalvos: salvosRes.data?.length ?? 0,
          countCancelados: canceladosRes.data?.length ?? 0,
          recentes: (recentesRes.data ?? []) as OrcamentoResumo[],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [carpinteiro, dateRange])

  const semMadeireira = carpinteiro?.madeireira_id === null

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container-highest min-h-[160px] flex flex-col justify-between p-6">
        {/* Overlay decorativo estilo wood grain */}
        <div className="absolute inset-0 wood-hero-overlay rounded-xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Bem-vindo de volta
          </p>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface leading-none">
            Olá,{' '}
            <em className="not-italic font-black text-primary">
              {carpinteiro?.nome ?? 'Carpinteiro'}
            </em>
          </h1>
        </div>

        <div className="relative z-10 mt-6 flex items-center gap-3">
          <Button
            asChild
            disabled={semMadeireira}
            className="bg-primary text-primary-foreground font-bold tracking-tight shadow-tinted gap-2"
          >
            <Link to={ROUTES.CARPINTEIRO_NOVO_ORCAMENTO}>
              <Plus size={16} />
              Nova Proposta
            </Link>
          </Button>
          {semMadeireira && (
            <Button asChild variant="ghost" size="sm" className="text-xs gap-1.5">
              <Link to={ROUTES.CARPINTEIRO_VINCULACAO}>
                <Link2 size={14} />
                Vincular madeireira
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Seletor de período — filtra todas as métricas abaixo */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
            <Calendar size={10} />
            Período
          </p>
          <Select value={preset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
            <SelectTrigger className="h-9 min-w-[160px] bg-surface-container-low border-0 font-medium text-on-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRESET_LABELS) as DatePreset[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PRESET_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Inputs de data personalizados — exibidos apenas no modo "Personalizado" */}
        {preset === 'personalizado' && (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                De
              </p>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 rounded-lg bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Até
              </p>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 rounded-lg bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCustomApply}
              disabled={!customFrom || !customTo || customFrom > customTo}
              className="h-9 font-bold text-primary"
            >
              Aplicar
            </Button>
          </>
        )}

        {/* Descrição textual do período ativo (para presets fixos) */}
        {preset !== 'personalizado' && (
          <p className="text-xs text-on-surface-variant pb-1.5">
            {formatarDataPtBR(dateRange.from)}
            {' — '}
            {formatarDataPtBR(dateRange.to, true)}
          </p>
        )}
      </div>

      {/* Grade de métricas gerais filtradas pelo período */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Pedidos Fechados"
          value={loading ? '—' : BRL.format(stats?.totalPedidosFechados ?? 0)}
          description={
            loading
              ? ''
              : `${stats?.countPedidosFechados ?? 0} ${
                  (stats?.countPedidosFechados ?? 0) === 1 ? 'pedido' : 'pedidos'
                }`
          }
          dot="primary"
          loading={loading}
          hideable
        />
        <MetricCard
          label="Orçamentos Salvos"
          value={loading ? '—' : BRL.format(stats?.totalSalvos ?? 0)}
          description={
            loading
              ? ''
              : `${stats?.countSalvos ?? 0} ${
                  (stats?.countSalvos ?? 0) === 1 ? 'salvo' : 'salvos'
                }`
          }
          dot="secondary"
          loading={loading}
          hideable
        />
        <MetricCard
          label="Orçamentos Cancelados"
          value={loading ? '—' : String(stats?.countCancelados ?? 0)}
          description={
            (stats?.countCancelados ?? 0) === 1 ? 'cancelado no período' : 'cancelados no período'
          }
          dot="outline"
          loading={loading}
          hideable
        />
      </div>

      {/* Seção de métricas financeiras — exclusivas de pedidos fechados no período */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-secondary">
          Análise de Pedidos Fechados
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Mão de Obra"
            value={metricas.loading ? '—' : BRL.format(metricas.totalMaoObra)}
            dot="secondary"
            loading={metricas.loading}
            hideable
          />
          <MetricCard
            label="Margem de Lucro"
            value={metricas.loading ? '—' : BRL.format(metricas.totalMargem)}
            dot="primary"
            loading={metricas.loading}
            hideable
          />
          <MetricCard
            label="Margem + Mão de Obra"
            value={metricas.loading ? '—' : BRL.format(metricas.totalMargemMaoObra)}
            description="rentabilidade operacional"
            dot="primary"
            loading={metricas.loading}
            hideable
          />
          <MetricCard
            label="Total de Custos"
            value={metricas.loading ? '—' : BRL.format(metricas.totalCustos)}
            description="imposto + deslocamento + adicionais"
            dot="outline"
            loading={metricas.loading}
            hideable
          />
          <MetricCard
            label="Pedidos Fechados"
            value={metricas.loading ? '—' : BRL.format(metricas.valorPedidosFechados)}
            description={
              metricas.loading ? '' : `${metricas.countPedidosFechados} pedido${metricas.countPedidosFechados !== 1 ? 's' : ''}`
            }
            dot="primary"
            loading={metricas.loading}
            hideable
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>
      </section>

      {/* Últimas propostas — sempre os 5 mais recentes, independente do filtro de período */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            Últimas Propostas
          </h2>
          <Link
            to={ROUTES.CARPINTEIRO_ORCAMENTOS}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[62px] w-full rounded-lg" />
            ))}
          </div>
        ) : stats && stats.recentes.length > 0 ? (
          <div className="space-y-2">
            {stats.recentes.map((orc) => (
              <OrcamentoRecenteCard key={orc.id} orcamento={orc} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-surface-container py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-on-surface">Nenhum orçamento ainda</p>
              <p className="text-xs text-on-surface-variant">
                Crie sua primeira proposta para começar.
              </p>
            </div>
            <Button asChild size="sm" disabled={semMadeireira}>
              <Link to={ROUTES.CARPINTEIRO_NOVO_ORCAMENTO}>Criar proposta</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
