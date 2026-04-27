import { Loader2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface OrcamentoStatusModalProps {
  open: boolean
  deleting: boolean
  deleteError: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

// Dialog de confirmação antes de excluir o orçamento
export default function OrcamentoStatusModal({
  open,
  deleting,
  deleteError,
  onOpenChange,
  onConfirm,
}: OrcamentoStatusModalProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(newOpen) => {
        // Bloqueia fechar o dialog enquanto a exclusão está em andamento
        if (deleting) return
        onOpenChange(newOpen)
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
          <Button variant="destructive" disabled={deleting} onClick={onConfirm}>
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
