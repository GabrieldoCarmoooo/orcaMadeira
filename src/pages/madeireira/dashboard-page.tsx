import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, Upload, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import StatCard from '@/components/shared/stat-card'

interface DashboardStats {
  parceirosAtivos: number
  pendentes: number
  ultimoUpload: string | null
  itensAtivos: number
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(isoString),
  )
}

export default function MadeireiraDashboardPage() {
  const { madeireira } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!madeireira) return

    async function fetchStats() {
      setLoading(true)
      try {
        const [parceirosRes, pendentesRes, tabelaRes] = await Promise.all([
          // Count active partners (approved vinculacoes)
          supabase
            .from('vinculacoes')
            .select('*', { count: 'exact', head: true })
            .eq('madeireira_id', madeireira!.id)
            .eq('status', 'aprovada'),

          // Count pending requests
          supabase
            .from('vinculacoes')
            .select('*', { count: 'exact', head: true })
            .eq('madeireira_id', madeireira!.id)
            .eq('status', 'pendente'),

          // Last active price table upload
          supabase
            .from('tabelas_preco')
            .select('id, upload_at')
            .eq('madeireira_id', madeireira!.id)
            .eq('ativo', true)
            .order('upload_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        // Count items in the active price table, if one exists
        let itensAtivos = 0
        if (tabelaRes.data) {
          const { count } = await supabase
            .from('itens_preco')
            .select('*', { count: 'exact', head: true })
            .eq('tabela_id', tabelaRes.data.id)
            .eq('disponivel', true)
          itensAtivos = count ?? 0
        }

        setStats({
          parceirosAtivos: parceirosRes.count ?? 0,
          pendentes: pendentesRes.count ?? 0,
          ultimoUpload: tabelaRes.data?.upload_at ?? null,
          itensAtivos,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [madeireira])

  const firstName = madeireira?.razao_social.split(' ')[0] ?? ''

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Olá, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">Aqui está um resumo da sua atividade</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Parceiros ativos */}
        <StatCard
          title="Parceiros ativos"
          value={loading ? '—' : (stats?.parceirosAtivos ?? 0)}
          description="carpinteiros vinculados"
          icon={<Users className="h-4 w-4" />}
          highlight
          loading={loading}
        />

        {/* Solicitações pendentes — with badge */}
        {loading ? (
          <div className="rounded-xl bg-card shadow-tinted p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <div className="rounded-xl bg-card shadow-tinted p-5 space-y-1 transition-colors relative">
            {/* Badge — visible only when there are pending requests */}
            {(stats?.pendentes ?? 0) > 0 && (
              <span className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full bg-destructive px-1.5 h-5 min-w-5 text-[10px] font-bold text-destructive-foreground">
                {stats!.pendentes}
              </span>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Solicitações pendentes</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold tracking-tight">{stats?.pendentes ?? 0}</p>
            <Link
              to={ROUTES.MADEIREIRA_PARCEIROS}
              className="block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver solicitações →
            </Link>
          </div>
        )}

        {/* Último upload */}
        <StatCard
          title="Último upload"
          value={
            loading
              ? '—'
              : stats?.ultimoUpload
                ? formatDate(stats.ultimoUpload)
                : 'Nenhum'
          }
          description="tabela de preços ativa"
          icon={<Upload className="h-4 w-4" />}
          loading={loading}
        />

        {/* Itens ativos */}
        <StatCard
          title="Itens na tabela ativa"
          value={loading ? '—' : (stats?.itensAtivos ?? 0)}
          description="produtos disponíveis"
          icon={<Package className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Quick links */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">Atalhos</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            to={ROUTES.MADEIREIRA_PARCEIROS}
            className="flex items-center gap-3 rounded-xl bg-card shadow-tinted px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Users className="h-4 w-4 shrink-0" />
            Gerenciar parceiros
            {!loading && (stats?.pendentes ?? 0) > 0 && (
              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-1.5 h-5 min-w-5 text-[10px] font-bold text-destructive-foreground">
                {stats!.pendentes}
              </span>
            )}
          </Link>
          <Link
            to={ROUTES.MADEIREIRA_PRECOS}
            className="flex items-center gap-3 rounded-xl bg-card shadow-tinted px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Upload className="h-4 w-4 shrink-0" />
            Tabela de preços
          </Link>
        </div>
      </section>
    </div>
  )
}
