import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { ORCAMENTO_STATUS } from '@/constants/orcamento-status'
import type { Orcamento } from '@/types/orcamento'
import type { OrcamentoStatus } from '@/types/common'

const TIPO_LABEL: Record<string, string> = {
  movel: 'Móveis',
  estrutura: 'Estruturas',
}

interface OrcamentoStatusActionsProps {
  orcamento: Orcamento
  statusAtual: OrcamentoStatus
  updatingStatus: boolean
  deleteDialog: boolean
  deleting: boolean
  deleteError: string | null
  onStatusChange: (novoStatus: string) => void
  onEditClick: () => void
  onDeleteClick: () => void
  onDeleteConfirm: () => void
  onDeleteDialogChange: (open: boolean) => void
  /** Slot para renderizar as ações de PDF à direita do cabeçalho */
  children?: React.ReactNode
}

/**
 * Seção de cabeçalho do orçamento: seletor de status, título, botões de ação
 * e dialog de confirmação de exclusão.
 *
 * O componente é puramente visual — toda lógica de mutação vem via callbacks
 * para que a page shell mantenha a fonte de verdade dos dados.
 */
export function OrcamentoStatusActions({
  orcamento,
  statusAtual,
  updatingStatus,
  deleteDialog,
  deleting,
  deleteError,
  onStatusChange,
  onEditClick,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteDialogChange,
  children,
}: OrcamentoStatusActionsProps) {
  return (
    <>
      {/* Cabeçalho: seletor de status + título + ações */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Seletor com transições livres entre os 5 status do orçamento */}
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Select value={statusAtual} onValueChange={onStatusChange} disabled={updatingStatus}>
              <SelectTrigger size="sm" className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ORCAMENTO_STATUS).map(({ value, label, badgeClass }) => (
                  <SelectItem key={value} value={value}>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                        badgeClass,
                      )}
                    >
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {updatingStatus && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">
              {TIPO_LABEL[orcamento.tipo_projeto] ?? orcamento.tipo_projeto}
            </span>
          </div>

          <h1 className="text-xl font-bold text-foreground">{orcamento.nome}</h1>
          {orcamento.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">{orcamento.descricao}</p>
          )}
        </div>

        {/* Excluir sempre visível; Editar bloqueado em status finais (snapshot congelado) */}
        <div className="flex shrink-0 flex-col gap-2 items-end">
          <div className="flex items-center gap-2">
            {statusAtual !== ORCAMENTO_STATUS.pedido_fechado.value &&
              statusAtual !== ORCAMENTO_STATUS.cancelado.value && (
                <Button size="sm" variant="outline" onClick={onEditClick}>
                  <Pencil className="size-3.5" />
                  Editar
                </Button>
              )}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDeleteClick}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          </div>
          {/* Slot para ações de PDF fornecidas pela page shell */}
          {children}
        </div>
      </div>

      {/* Dialog de confirmação antes de excluir o orçamento */}
      <AlertDialog
        open={deleteDialog}
        onOpenChange={(open) => {
          // Bloqueia fechar enquanto a exclusão está em andamento
          if (deleting) return
          onDeleteDialogChange(open)
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
            <Button variant="destructive" disabled={deleting} onClick={onDeleteConfirm}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
