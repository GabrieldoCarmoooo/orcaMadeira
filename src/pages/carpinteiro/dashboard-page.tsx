import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Link2, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import OrcamentoRecenteCard from '@/components/orcamento/orcamento-recente-card'
import type { Orcamento } from '@/types/orcamento'

type OrcamentoResumo = Pick<
  Orcamento,
  'id' | 'nome' | 'cliente_nome' | 'status' | 'total' | 'created_at'
>

interface DashboardStats {
  totalConvertido: number
  totalPendente: number
  totalPerdido: number
  countConvertidos: number
  countPendentes: number
  countPerdidos: number
  recentes: OrcamentoResumo[]
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function CarpinteiroDashboardPage() {
  const { carpinteiro } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!carpinteiro) return

    async function fetchStats() {
      setLoading(true)
      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

        const [convertidosRes, pendentesRes, rascunhosRes, recentesRes] = await Promise.all([
          supabase
            .from('orcamentos')
            .select('total')
            .eq('carpinteiro_id', carpinteiro!.id)
            .in('status', ['finalizado', 'enviado'])
            .gte('finalizado_at', startOfMonth)
            .lte('finalizado_at', endOfMonth),

          supabase
            .from('orcamentos')
            .select('total')
            .eq('carpinteiro_id', carpinteiro!.id)
            .eq('status', 'enviado'),

          supabase
            .from('orcamentos')
            .select('total, id')
            .eq('carpinteiro_id', carpinteiro!.id)
            .eq('status', 'rascunho'),

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
          totalConvertido: sum(convertidosRes.data ?? []),
          totalPendente: sum(pendentesRes.data ?? []),
          totalPerdido: sum(rascunhosRes.data ?? []),
          countConvertidos: convertidosRes.data?.length ?? 0,
          countPendentes: pendentesRes.data?.length ?? 0,
          countPerdidos: rascunhosRes.data?.length ?? 0,
          recentes: (recentesRes.data ?? []) as OrcamentoResumo[],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [carpinteiro])

  const semMadeireira = carpinteiro?.madeireira_id === null

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container-highest min-h-[160px] flex flex-col justify-between p-6">
        {/* Wood grain decorative overlay */}
        <div className="absolute inset-0 wood-hero-overlay rounded-xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Bem-vindo de volta
          </p>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface leading-none">
            Painel de{' '}
            <em className="not-italic font-black text-primary">Controle</em>
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

      {/* Metrics grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Propostas Convertidas"
          value={loading ? '—' : BRL.format(stats?.totalConvertido ?? 0)}
          description={loading ? '' : `${stats?.countConvertidos ?? 0} finalizadas`}
          dot="primary"
          loading={loading}
        />
        <MetricCard
          label="Pendentes"
          value={loading ? '—' : BRL.format(stats?.totalPendente ?? 0)}
          description={loading ? '' : `${stats?.countPendentes ?? 0} aguardando assinatura`}
          dot="secondary"
          loading={loading}
        />
        <MetricCard
          label="Rascunhos"
          value={loading ? '—' : String(stats?.countPerdidos ?? 0)}
          description="em andamento"
          dot="outline"
          loading={loading}
        />
      </div>

      {/* Recent proposals */}
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
