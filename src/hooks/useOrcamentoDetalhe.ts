import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants/routes'
import type { OrcamentoStatus } from '@/types/common'
import type { Orcamento } from '@/types/orcamento'
import type { Carpinteiro } from '@/types/carpinteiro'

interface UseOrcamentoDetalheReturn {
  localStatus: OrcamentoStatus | null
  updatingStatus: boolean
  deleteDialog: boolean
  deleting: boolean
  deleteError: string | null
  handleStatusChange: (novoStatus: string) => Promise<void>
  handleDeleteConfirm: () => Promise<void>
  openDeleteDialog: () => void
  handleDeleteDialogChange: (open: boolean) => void
}

/**
 * Encapsula as mutações de status e exclusão da página de detalhe.
 * Segue o padrão hooks → Supabase, mantendo o componente livre de acesso direto ao banco.
 */
export function useOrcamentoDetalhe(
  orcamento: Orcamento | null,
  carpinteiro: Carpinteiro | null,
): UseOrcamentoDetalheReturn {
  const navigate = useNavigate()
  const [localStatus, setLocalStatus] = useState<OrcamentoStatus | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Atualiza o status com feedback otimista — reverte automaticamente em caso de falha
  async function handleStatusChange(novoStatus: string) {
    if (!orcamento || !carpinteiro) return
    const statusAnterior = localStatus
    setLocalStatus(novoStatus as OrcamentoStatus)
    setUpdatingStatus(true)

    const { data, error } = await supabase
      .from('orcamentos')
      .update({ status: novoStatus as OrcamentoStatus })
      .eq('id', orcamento.id)
      .eq('carpinteiro_id', carpinteiro.id)
      .select('id')

    setUpdatingStatus(false)

    // `.select()` retorna array vazio quando RLS bloqueia — tratamos como erro
    if (error || !data || data.length === 0) {
      setLocalStatus(statusAnterior)
      window.alert(error?.message ?? 'Não foi possível alterar o status. Verifique suas permissões.')
    }
  }

  // Exclui o orçamento e redireciona; `.select()` detecta DELETE bloqueado por RLS
  async function handleDeleteConfirm() {
    if (!orcamento || !carpinteiro) return
    setDeleting(true)
    setDeleteError(null)

    const { data, error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', orcamento.id)
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

    setDeleteDialog(false)
    navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)
  }

  function handleDeleteDialogChange(open: boolean) {
    if (deleting) return
    setDeleteDialog(open)
    if (!open) setDeleteError(null)
  }

  return {
    localStatus,
    updatingStatus,
    deleteDialog,
    deleting,
    deleteError,
    handleStatusChange,
    handleDeleteConfirm,
    openDeleteDialog: () => setDeleteDialog(true),
    handleDeleteDialogChange,
  }
}
