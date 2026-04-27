import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrcamentoStatus } from '@/types/common'
import type { Carpinteiro } from '@/types/carpinteiro'
import type { OrcamentoListItem, FilterStatus } from '@/types/orcamento'

const PAGE_SIZE = 50

interface UseOrcamentosReturn {
  filter: FilterStatus
  page: number
  orcamentos: OrcamentoListItem[]
  total: number
  loading: boolean
  deleteDialog: { open: boolean; id: string | null }
  deleting: boolean
  deleteError: string | null
  statusUpdatingId: string | null
  totalPages: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  handleFilterChange: (f: FilterStatus) => void
  handleStatusChange: (id: string, novoStatus: OrcamentoStatus) => Promise<void>
  handleDeleteRequest: (id: string) => void
  handleDeleteConfirm: () => Promise<void>
  handleDeleteDialogChange: (open: boolean) => void
}

// Encapsula busca paginada de orçamentos, mudança de status e exclusão da lista.
// Segue o padrão hooks → Supabase, mantendo o componente livre de acesso direto ao banco.
export function useOrcamentos(carpinteiro: Carpinteiro | null): UseOrcamentosReturn {
  const [filter, setFilter] = useState<FilterStatus>('todos')
  const [page, setPage] = useState(0)
  const [orcamentos, setOrcamentos] = useState<OrcamentoListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

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

  // Muda filtro e reseta paginação em um único evento — evita useEffect em cascata
  function handleFilterChange(newFilter: FilterStatus) {
    setFilter(newFilter)
    setPage(0)
  }

  // Remove o orçamento do banco e atualiza a lista local sem refetch.
  // `.select()` detecta DELETE bloqueado por RLS (array vazio sem erro)
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

  // Atualiza status com feedback otimista — reverte se o banco rejeitar
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
      setOrcamentos((prev) => prev.map((o) => (o.id === id ? { ...o, status: anterior } : o)))
      window.alert(error?.message ?? 'Não foi possível alterar o status. Verifique suas permissões.')
      return
    }

    // Remove da lista se o filtro ativo excluir o novo status
    if (filter !== 'todos' && filter !== novoStatus) {
      setOrcamentos((prev) => prev.filter((o) => o.id !== id))
      setTotal((t) => Math.max(0, t - 1))
    }
  }

  function handleDeleteRequest(id: string) {
    setDeleteError(null)
    setDeleteDialog({ open: true, id })
  }

  function handleDeleteDialogChange(open: boolean) {
    if (deleting) return
    setDeleteDialog({ open, id: open ? deleteDialog.id : null })
    if (!open) setDeleteError(null)
  }

  const totalPages = useMemo(() => Math.ceil(total / PAGE_SIZE), [total])

  return {
    filter,
    page,
    orcamentos,
    total,
    loading,
    deleteDialog,
    deleting,
    deleteError,
    statusUpdatingId,
    totalPages,
    setPage,
    handleFilterChange,
    handleStatusChange,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteDialogChange,
  }
}
