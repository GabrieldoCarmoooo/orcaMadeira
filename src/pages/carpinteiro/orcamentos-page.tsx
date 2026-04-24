import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  ChevronRight,
  FileText,
  Loader2,
  ChevronLeft,
  MoreVertical,
  Pencil,
  Trash2,
  CircleDot,
  Check,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
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
  salvo: 'Salvo',
  enviado: 'Enviado',
  pedido_fechado: 'Pedido Fechado',
  cancelado: 'Cancelado',
}

// Cores por status: cancelado vermelho discreto, pedido_fechado verde, salvo neutro positivo
const STATUS_CLASS: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-primary/10 text-primary',
  salvo: 'bg-secondary/10 text-secondary',
  enviado: 'bg-on-surface-variant/10 text-on-surface-variant',
  pedido_fechado: 'bg-green-600/10 text-green-700',
  cancelado: 'bg-red-500/10 text-red-600',
}

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunhos' },
  { value: 'salvo', label: 'Salvos' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'pedido_fechado', label: 'Pedido Fechado' },
  { value: 'cancelado', label: 'Cancelados' },
]

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

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

  // Estado do dialog de confirmação de exclusão
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Id do item cujo status está sendo atualizado (para desabilitar o menu durante a escrita)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    // Volta para a primeira página ao trocar o filtro
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

  // Remove o orçamento do banco e atualiza a lista local sem refetch.
  // `.select()` obriga o Supabase a retornar as linhas removidas — se a
  // política RLS filtrar o DELETE, o array vem vazio e conseguimos
  // diferenciar "sem permissão" de "sucesso" (antes o erro era silencioso).
  async function handleDeleteConfirm() {
    if (!deleteDialog.id || !carpinteiro) return
    setDeleting(true)
    setDeleteError(null)

    const { data, error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', deleteDialog.id)
      .eq('carpinteiro_id', carpinteiro.id)
      .select('id')

    setDeleting(false)

    if (error) {
      setDeleteError(error.message)
      return
    }

    if (!data || data.length === 0) {
      setDeleteError('Não foi possível excluir o orçamento. Verifique suas permissões.')
      return
    }

    setOrcamentos((prev) => prev.filter((o) => o.id !== deleteDialog.id))
    setTotal((t) => t - 1)
    setDeleteDialog({ open: false, id: null })
  }

  // Atualiza status do orçamento direto da lista. Otimista: aplica na UI
  // e reverte se o banco rejeitar.
  async function handleStatusChange(id: string, novoStatus: OrcamentoStatus) {
    if (!carpinteiro) return

    const anterior = orcamentos.find((o) => o.id === id)?.status
    if (!anterior || anterior === novoStatus) return

    setStatusUpdatingId(id)
    setOrcamentos((prev) => prev.map((o) => (o.id === id ? { ...o, status: novoStatus } : o)))

    const { data, error } = await supabase
      .from('orcamentos')
      .update({ status: novoStatus })
      .eq('id', id)
      .eq('carpinteiro_id', carpinteiro.id)
      .select('id')

    setStatusUpdatingId(null)

    if (error || !data || data.length === 0) {
      // Reverte em caso de erro ou 0 linhas afetadas (RLS bloqueou)
      setOrcamentos((prev) => prev.map((o) => (o.id === id ? { ...o, status: anterior } : o)))
      window.alert(
        error?.message ?? 'Não foi possível alterar o status. Verifique suas permissões.',
      )
      return
    }

    // Se o filtro atual deixa o item fora da aba, remove da lista exibida
    if (filter !== 'todos' && filter !== novoStatus) {
      setOrcamentos((prev) => prev.filter((o) => o.id !== id))
      setTotal((t) => Math.max(0, t - 1))
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-on-surface">Orçamentos</h1>
          {!loading && (
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {total} {total === 1 ? 'orçamento' : 'orçamentos'}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => navigate(ROUTES.CARPINTEIRO_NOVO_ORCAMENTO)}>
          <Plus className="size-4" />
          Novo
        </Button>
      </div>

      {/* Abas de filtro por status */}
      <div className="flex border-b border-outline-variant/20 overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={cn(
              'shrink-0 pb-3 px-4 text-sm font-bold transition-colors',
              filter === tab.value
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de orçamentos */}
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
            // Card dividido: Link cobre a área de conteúdo; DropdownMenu fica fora do Link
            // para evitar que o clique no menu dispare a navegação
            <div
              key={orc.id}
              className="flex items-center rounded-lg bg-surface-container-highest transition-colors duration-200 hover:bg-surface-container-high"
            >
              <Link
                to={ROUTES.CARPINTEIRO_ORCAMENTO(orc.id)}
                className="flex flex-1 items-center gap-4 pl-4 pr-2 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
              >
                {/* Inicial do nome como ícone */}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-black text-xs uppercase">
                    {orc.nome.charAt(0)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">{orc.nome}</p>
                  <p className="truncate text-xs text-on-surface-variant">{orc.cliente_nome}</p>
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
                  <span className="text-xs font-black tabular-nums text-on-surface tracking-tighter">
                    {BRL.format(orc.total)}
                  </span>
                </div>

                <ChevronRight className="size-4 text-on-surface-variant shrink-0" />
              </Link>

              {/* Kebab menu: Editar, Alterar status (submenu) e Excluir */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="mx-2 shrink-0 text-on-surface-variant"
                    aria-label="Ações do orçamento"
                    disabled={statusUpdatingId === orc.id}
                  >
                    {statusUpdatingId === orc.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreVertical className="size-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO_EDITAR(orc.id))}
                  >
                    <Pencil />
                    Editar
                  </DropdownMenuItem>

                  {/* Submenu com os 5 status; marca o atual com Check */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <CircleDot />
                      Alterar status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {(Object.entries(STATUS_LABEL) as [OrcamentoStatus, string][]).map(
                        ([value, label]) => (
                          <DropdownMenuItem
                            key={value}
                            onClick={() => handleStatusChange(orc.id, value)}
                            disabled={orc.status === value}
                          >
                            {orc.status === value ? (
                              <Check />
                            ) : (
                              <span className="size-4 shrink-0" />
                            )}
                            {label}
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteDialog({ open: true, id: orc.id })
                    }}
                  >
                    <Trash2 />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
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

      {/* Spinner de carregamento na troca de página */}
      {loading && orcamentos.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Dialog de confirmação antes de excluir o orçamento */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          // Bloqueia fechar o dialog enquanto a exclusão está em andamento
          if (deleting) return
          setDeleteDialog({ open, id: open ? deleteDialog.id : null })
          if (!open) setDeleteError(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteConfirm}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
