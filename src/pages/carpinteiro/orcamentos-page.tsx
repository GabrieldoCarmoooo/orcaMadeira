import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { useAuthStore } from '@/stores/useAuthStore'
import { useOrcamentos } from '@/hooks/useOrcamentos'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import OrcamentosFilterBar from '@/components/orcamento/orcamentos-filter-bar'
import OrcamentosList from '@/components/orcamento/orcamentos-list'
import OrcamentoStatusModal from '@/components/orcamento/orcamento-status-modal'

export default function CarpinteiroOrcamentosPage() {
  const navigate = useNavigate()
  const { carpinteiro } = useAuthStore()

  const {
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
  } = useOrcamentos(carpinteiro)

  return (
    <div className="space-y-6">
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

      <OrcamentosFilterBar filter={filter} onFilterChange={handleFilterChange} />

      <OrcamentosList
        orcamentos={orcamentos}
        loading={loading}
        filter={filter}
        statusUpdatingId={statusUpdatingId}
        onStatusChange={handleStatusChange}
        onDeleteRequest={handleDeleteRequest}
      />

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

      {loading && orcamentos.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <OrcamentoStatusModal
        open={deleteDialog.open}
        deleting={deleting}
        deleteError={deleteError}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
