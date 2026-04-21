import { useState } from 'react'
import { Plus, Pencil, Trash2, Layers } from 'lucide-react'
import { useMadeirasM3 } from '@/hooks/useMadeirasM3'
import type { MadeiraM3 } from '@/types/produto'
import type { MadeiraM3Input } from '@/lib/schemas/madeira-m3-schema'
import { MadeiraM3Form } from './madeira-m3-form'
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

export function MadeirasMcPanel() {
  const { madeiras, isLoading, create, update, remove } = useMadeirasM3()

  // Estado do dialog de criação/edição
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingMadeira, setEditingMadeira] = useState<MadeiraM3 | null>(null)

  // Estado do dialog de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openCreateDialog() {
    setEditingMadeira(null)
    setFormDialogOpen(true)
  }

  function openEditDialog(madeira: MadeiraM3) {
    setEditingMadeira(madeira)
    setFormDialogOpen(true)
  }

  function openDeleteDialog(id: string) {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  // Cria ou atualiza madeira m³ com seus comprimentos; fecha o dialog ao concluir
  async function handleFormSubmit(data: MadeiraM3Input) {
    if (editingMadeira) {
      await update(editingMadeira.id, data)
    } else {
      await create(data)
    }
    setFormDialogOpen(false)
    setEditingMadeira(null)
  }

  // Remove a madeira — o CASCADE no banco apaga os comprimentos filhos automaticamente
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

  return (
    <div className="space-y-4">
      {/* Cabeçalho da seção com CTA de criação */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-on-surface">
            Madeiras m³
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Produtos dimensionados com comprimentos pré-cadastrados
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="shrink-0">
          <Plus />
          Nova Madeira
        </Button>
      </div>

      {/* Conteúdo principal: loading, vazio ou tabela */}
      {isLoading ? (
        <div className="py-10 text-center text-sm text-on-surface-variant">
          Carregando madeiras...
        </div>
      ) : madeiras.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title="Nenhuma madeira m³ cadastrada"
          description="Cadastre madeiras dimensionadas (vigas, tábuas, ripas) vinculadas às espécies e seus comprimentos disponíveis."
          action={
            <Button onClick={openCreateDialog} size="sm">
              <Plus />
              Nova Madeira
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Espécie</TableHead>
              <TableHead>Nome</TableHead>
              {/* Dimensões formatadas como seção transversal (espessura × largura) */}
              <TableHead>Dimensões (cm)</TableHead>
              <TableHead>Comprimentos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {madeiras.map((madeira) => {
              // Contagem de comprimentos disponíveis e total para exibir no painel
              const totalComprimentos = madeira.comprimentos?.length ?? 0
              const disponiveis = madeira.comprimentos?.filter((c) => c.disponivel).length ?? 0

              return (
                <TableRow key={madeira.id}>
                  <TableCell className="text-on-surface-variant">
                    {madeira.especie?.nome ?? '—'}
                  </TableCell>
                  <TableCell className="font-medium text-on-surface">
                    {madeira.nome}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {madeira.espessura_cm} × {madeira.largura_cm}
                  </TableCell>
                  {/* Exibe contagem de comprimentos ativos/total como badge tonal */}
                  <TableCell>
                    {totalComprimentos > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-xs text-on-surface-variant">
                        {disponiveis}/{totalComprimentos} ativos
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant/50">Nenhum</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(madeira)}
                        aria-label={`Editar ${madeira.nome}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteDialog(madeira.id)}
                        aria-label={`Excluir ${madeira.nome}`}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Dialog de criação/edição — tamanho maior para acomodar a seção de comprimentos */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMadeira ? 'Editar Madeira m³' : 'Nova Madeira m³'}
            </DialogTitle>
          </DialogHeader>
          {/* key força remount ao trocar entre criar/editar — garante reset completo do form */}
          <MadeiraM3Form
            key={editingMadeira?.id ?? 'new'}
            defaultValues={editingMadeira ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Madeira m³</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant">
            Esta ação é irreversível. Todos os comprimentos cadastrados para esta
            madeira também serão excluídos automaticamente.
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

export default MadeirasMcPanel
