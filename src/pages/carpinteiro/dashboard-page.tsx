import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ClipboardList, TrendingUp, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import StatCard from '@/components/shared/stat-card'
import OrcamentoRecenteCard from '@/components/orcamento/orcamento-recente-card'
import type { Orcamento } from '@/types/orcamento'

type OrcamentoResumo = Pick<
  Orcamento,
  'id' | 'nome' | 'cliente_nome' | 'status' | 'total' | 'created_at'
>

interface DashboardStats {
  totalMes: number
  countRascunhos: number
  countFinalizados: number
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

        const [totaisRes, rascunhosRes, finalizadosRes, recentesRes] = await Promise.all([
          // Rows finalized this month — we sum client-side
          supabase
            .from('orcamentos')
            .select('total')
            .eq('carpinteiro_id', carpinteiro!.id)
            .in('status', ['finalizado', 'enviado'])
            .gte('finalizado_at', startOfMonth)
            .lte('finalizado_at', endOfMonth),

          // Count rascunhos
          supabase
            .from('orcamentos')
            .select('*', { count: 'exact', head: true })
            .eq('carpinteiro_id', carpinteiro!.id)
            .eq('status', 'rascunho'),

          // Count finalizados + enviados
          supabase
            .from('orcamentos')
            .select('*', { count: 'exact', head: true })
            .eq('carpinteiro_id', carpinteiro!.id)
            .in('status', ['finalizado', 'enviado']),

          // 5 most recent
          supabase
            .from('orcamentos')
            .select('id, nome, cliente_nome, status, total, created_at')
            .eq('carpinteiro_id', carpinteiro!.id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        const totalMes = (totaisRes.data ?? []).reduce(
          (acc, row) => acc + (row.total as number),
          0,
        )

        setStats({
          totalMes,
          countRascunhos: rascunhosRes.count ?? 0,
          countFinalizados: finalizadosRes.count ?? 0,
          recentes: (recentesRes.data ?? []) as OrcamentoResumo[],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [carpinteiro])

  const firstName = carpinteiro?.nome.split(' ')[0] ?? ''
  const semMadeireira = carpinteiro?.madeireira_id === null

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Olá, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Aqui está um resumo da sua atividade
        </p>
      </div>

      {/* CTA — sem madeireira vinculada */}
      {semMadeireira && (
        <div className="flex flex-col gap-3 rounded-xl bg-accent/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between shadow-tinted">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-accent-foreground">
              Você ainda não tem uma madeireira vinculada
            </p>
            <p className="text-xs text-accent-foreground/80">
              Vincule-se a uma madeireira para acessar os preços e criar orçamentos.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <Link to={ROUTES.CARPINTEIRO_VINCULACAO}>
              <Link2 className="h-4 w-4" />
              Vincular Madeireira
            </Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total orçado no mês"
          value={loading ? '—' : BRL.format(stats?.totalMes ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          highlight
          loading={loading}
        />
        <StatCard
          title="Rascunhos"
          value={loading ? '—' : (stats?.countRascunhos ?? 0)}
          description="em andamento"
          icon={<FileText className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Finalizados"
          value={loading ? '—' : (stats?.countFinalizados ?? 0)}
          description="orçamentos enviados"
          icon={<ClipboardList className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Recent orçamentos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">
            Orçamentos recentes
          </h2>
          <Link
            to={ROUTES.CARPINTEIRO_ORCAMENTOS}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ver todos
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
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card shadow-tinted py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Nenhum orçamento ainda</p>
              <p className="text-xs text-muted-foreground">
                Crie seu primeiro orçamento para começar.
              </p>
            </div>
            <Button asChild size="sm" disabled={semMadeireira}>
              <Link to={ROUTES.CARPINTEIRO_NOVO_ORCAMENTO}>Criar orçamento</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
