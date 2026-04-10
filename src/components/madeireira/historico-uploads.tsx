import { useEffect, useState } from 'react'
import { Calendar, Package, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { TabelaPreco } from '@/types/madeireira'

interface TabelaComContagem extends TabelaPreco {
  itens_count: number
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

interface Props {
  /** Increment to trigger a re-fetch after a new upload is confirmed */
  refreshKey?: number
}

export default function HistoricoUploads({ refreshKey = 0 }: Props) {
  const { madeireira } = useAuthStore()
  const [tabelas, setTabelas] = useState<TabelaComContagem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!madeireira) return

    async function fetchHistorico() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('tabelas_preco')
          .select('id, nome, upload_at, ativo, madeireira_id')
          .eq('madeireira_id', madeireira!.id)
          .order('upload_at', { ascending: false })

        if (error || !data) {
          setTabelas([])
          return
        }

        // Fetch item count per table in parallel — list is typically small
        const withCounts = await Promise.all(
          data.map(async (t) => {
            const { count } = await supabase
              .from('itens_preco')
              .select('*', { count: 'exact', head: true })
              .eq('tabela_id', t.id)
            return { ...t, itens_count: count ?? 0 } as TabelaComContagem
          }),
        )

        setTabelas(withCounts)
      } finally {
        setLoading(false)
      }
    }

    fetchHistorico()
  }, [madeireira, refreshKey])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-card shadow-tinted px-4 py-3 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (tabelas.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">Nenhum upload realizado ainda.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-xl overflow-hidden bg-card shadow-tinted">
      {tabelas.map((t) => (
        <div
          key={t.id}
          className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Left: name + metadata */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{t.nome}</p>
              {t.ativo ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/40 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shrink-0">
                  <XCircle className="h-3 w-3" />
                  Inativa
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(t.upload_at)}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {t.itens_count} {t.itens_count === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>

          {/* Right: who uploaded — always the current madeireira */}
          <p className="text-xs text-muted-foreground shrink-0 sm:text-right">
            {madeireira?.razao_social ?? 'Você'}
          </p>
        </div>
      ))}
    </div>
  )
}
