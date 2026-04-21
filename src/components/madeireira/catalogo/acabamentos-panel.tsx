import { useState } from 'react'
import { Plus, Pencil, Trash2, Sparkles } from 'lucide-react'
import { useAcabamentos } from '@/hooks/useAcabamentos'
import type { ServicoAcabamento } from '@/types/produto'
import type { AcabamentoInput } from '@/lib/schemas/acabamento-schema'
import { AcabamentoForm } from './acabamento-form'
import { EmptyState } from './empty-state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

export function AcabamentosPanel() {
  const { acabamentos, isLoading, create, update, remove } = useAcabamentos()

  // Estado do dialog de criação/edição
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingAcabamento, setEditingAcabamento] =
    useState<ServicoAcabamento | null>(null)

  // Estado do dialog de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openCreateDialog() {
    setEditingAcabamento(null)
    setFormDialogOpen(true)
  }

  function openEditDialog(acabamento: ServicoAcabamento) {
    setEditingAcabamento(acabamento)
    setFormDialogOpen(true)
  }

  function openDeleteDialog(id: string) {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  // Cria ou atualiza acabamento dependendo do modo; fecha o dialog ao concluir
  async function handleFormSubmit(data: AcabamentoInput) {
    if (editingAcabamento) {
      await update(editingAcabamento.id, data)
    } else {
      await create(data)
    }
    setFormDialogOpen(false)
    setEditingAcabamento(null)
  }

  async function handleDelete() {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await remove(deletingId)
      setDeleteDialogOpen(false)
      setDeletingId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Alterna o status ativo/inativo sem abrir o dialog de edição completa
  async function handleToggleAtivo(acabamento: ServicoAcabamento) {
    await update(acabamento.id, {
      nome: acabamento.nome,
      percentual_acrescimo: acabamento.percentual_acrescimo,
      ativo: !acabamento.ativo,
    } as AcabamentoInput & { ativo: boolean })
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho da seção com CTA de criação */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-on-surface">
            Serviços de Acabamento
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Modificadores percentuais aplicáveis a madeiras m³ no orçamento —
            ex: Lixamento +10%, Aparelhado +15%.
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="shrink-0">
          <Plus />
          Novo Acabamento
        </Button>
      </div>

      {/* Conteúdo principal: loading, vazio ou tabela */}
      {isLoading ? (
        <div className="py-10 text-center text-sm text-on-surface-variant">
          Carregando acabamentos...
        </div>
      ) : acabamentos.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Nenhum acabamento cadastrado"
          description="Cadastre serviços como Lixamento, Aparelhado ou Verniz para que o carpinteiro possa aplicá-los nos orçamentos."
          action={
            <Button onClick={openCreateDialog} size="sm">
              <Plus />
              Novo Acabamento
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {/* Percentual de acréscimo sobre o preço base da madeira m³ */}
              <TableHead>Acréscimo (%)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {acabamentos.map((acabamento) => (
              <TableRow key={acabamento.id}>
                <TableCell className="font-medium text-on-surface">
                  {acabamento.nome}
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  +{acabamento.percentual_acrescimo.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%
                </TableCell>
                <TableCell>
                  {/* Badge de status ativo/inativo — clicável para toggle rápido */}
                  <button
                    type="button"
                    onClick={() => handleToggleAtivo(acabamento)}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      acabamento.ativo
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                    aria-label={`${acabamento.ativo ? 'Desativar' : 'Ativar'} ${acabamento.nome}`}
                  >
                    {acabamento.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(acabamento)}
                      aria-label={`Editar ${acabamento.nome}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openDeleteDialog(acabamento.id)}
                      aria-label={`Excluir ${acabamento.nome}`}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog de criação/edição de acabamento */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAcabamento ? 'Editar Acabamento' : 'Novo Acabamento'}
            </DialogTitle>
          </DialogHeader>
          {/* key força remount ao trocar entre criar/editar — garante reset do form */}
          <AcabamentoForm
            key={editingAcabamento?.id ?? 'new'}
            defaultValues={
              editingAcabamento
                ? {
                    nome: editingAcabamento.nome,
                    percentual_acrescimo:
                      editingAcabamento.percentual_acrescimo,
                  }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Acabamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant">
            Esta ação é irreversível. O acabamento será removido e não poderá
            mais ser aplicado a novos orçamentos.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AcabamentosPanel
