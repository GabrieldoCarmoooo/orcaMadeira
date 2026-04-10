import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, FileText, Loader2, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import type { OrcamentoStatus } from '@/types/common'
import type { Orcamento } from '@/types/orcamento'

type OrcamentoListItem = Pick<
  Orcamento,
  'id' | 'nome' | 'cliente_nome' | 'status' | 'total' | 'created_at' | 'tipo_projeto'
>

type FilterStatus = 'todos' | OrcamentoStatus

const PAGE_SIZE = 50

const STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
  enviado: 'Enviado',
}

const STATUS_CLASS: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  finalizado: 'bg-primary/15 text-primary',
  enviado: 'bg-secondary/15 text-secondary',
}

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunhos' },
  { value: 'finalizado', label: 'Finalizados' },
  { value: 'enviado', label: 'Enviados' },
]

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function CarpinteiroOrcamentosPage() {
  const navigate = useNavigate()
  const { carpinteiro } = useAuthStore()

  const [filter, setFilter] = useState<FilterStatus>('todos')
  const [page, setPage] = useState(0)
  const [orcamentos, setOrcamentos] = useState<OrcamentoListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Reset to first page when filter changes
    setPage(0)
  }, [filter])

  useEffect(() => {
    if (!carpinteiro) return

    async function fetchOrcamentos() {
      setLoading(true)

      let query = supabase
        .from('orcamentos')
        .select('id, nome, cliente_nome, status, total, created_at, tipo_projeto', {
          count: 'exact',
        })
        .eq('carpinteiro_id', carpinteiro!.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (filter !== 'todos') {
        query = query.eq('status', filter)
      }

      const { data, count, error } = await query

      if (!error) {
        setOrcamentos((data ?? []) as OrcamentoListItem[])
        setTotal(count ?? 0)
      }

      setLoading(false)
    }

    fetchOrcamentos()
  }, [carpinteiro, filter, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Orçamentos</h1>
          {!loading && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total} {total === 1 ? 'orçamento' : 'orçamentos'}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => navigate(ROUTES.CARPINTEIRO_NOVO_ORCAMENTO)}>
          <Plus className="size-4" />
          Novo
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              filter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full" />
          ))}
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FileText className="size-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium text-foreground">Nenhum orçamento encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'todos'
                ? 'Crie seu primeiro orçamento para começar.'
                : `Nenhum orçamento com status "${STATUS_LABEL[filter as OrcamentoStatus]}".`}
            </p>
          </div>
          {filter === 'todos' && (
            <Button
              size="sm"
              className="mt-2"
              onClick={() => navigate(ROUTES.CARPINTEIRO_NOVO_ORCAMENTO)}
            >
              <Plus className="size-4" />
              Criar orçamento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {orcamentos.map((orc) => (
            <Link
              key={orc.id}
              to={ROUTES.CARPINTEIRO_ORCAMENTO(orc.id)}
              className={cn(
                'flex items-center gap-3 rounded-[16px] bg-card px-4 py-3 transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{orc.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{orc.cliente_nome}</p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                    STATUS_CLASS[orc.status],
                  )}
                >
                  {STATUS_LABEL[orc.status]}
                </span>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {BRL.format(orc.total)}
                </span>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <ChevronRight className="size-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  {DATE_FMT.format(new Date(orc.created_at))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0 || loading}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            {page + 1} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1 || loading}
          >
            Próxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Loading spinner for page changes */}
      {loading && orcamentos.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
