import { useState } from 'react'
import { Plus, Pencil, Trash2, TreePine } from 'lucide-react'
import { useEspecies } from '@/hooks/useEspecies'
import type { EspecieMadeira } from '@/types/produto'
import type { EspecieInput } from '@/lib/schemas/especie-schema'
import { calcularValorVendaM3 } from '@/lib/calcular-madeira'
import { EspecieForm } from './especie-form'
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

// Formata número como moeda BRL
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function EspeciesPanel() {
  const { especies, isLoading, create, update, remove } = useEspecies()

  // Estado do dialog de criação/edição
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingEspecie, setEditingEspecie] = useState<EspecieMadeira | null>(null)

  // Estado do dialog de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openCreateDialog() {
    setEditingEspecie(null)
    setFormDialogOpen(true)
  }

  function openEditDialog(especie: EspecieMadeira) {
    setEditingEspecie(especie)
    setFormDialogOpen(true)
  }

  function openDeleteDialog(id: string) {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  // Cria ou atualiza espécie dependendo do modo; fecha o dialog ao concluir
  async function handleFormSubmit(data: EspecieInput) {
    if (editingEspecie) {
      await update(editingEspecie.id, data)
    } else {
      await create(data)
    }
    setFormDialogOpen(false)
    setEditingEspecie(null)
  }

  // Remove a espécie — o CASCADE no banco apaga madeiras_m3 filhas automaticamente
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
            Espécies de Madeira
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Base de precificação — define custo e margem por m³
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="shrink-0">
          <Plus />
          Nova Espécie
        </Button>
      </div>

      {/* Conteúdo principal: loading, vazio ou tabela */}
      {isLoading ? (
        <div className="py-10 text-center text-sm text-on-surface-variant">
          Carregando espécies...
        </div>
      ) : especies.length === 0 ? (
        <EmptyState
          icon={<TreePine />}
          title="Nenhuma espécie cadastrada"
          description="Cadastre as espécies de madeira com custo e margem para precificar seus produtos."
          action={
            <Button onClick={openCreateDialog} size="sm">
              <Plus />
              Nova Espécie
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Custo/m³</TableHead>
              <TableHead>Margem</TableHead>
              {/* Venda/m³ é calculado (custo × (1 + margem/100)) — nunca armazenado */}
              <TableHead>Venda/m³</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {especies.map((especie) => {
              const precoVenda = calcularValorVendaM3(
                especie.custo_m3,
                especie.margem_lucro_pct,
              )
              return (
                <TableRow key={especie.id}>
                  <TableCell className="font-medium text-on-surface">
                    {especie.nome}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {formatBRL(especie.custo_m3)}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {especie.margem_lucro_pct.toFixed(1)}%
                  </TableCell>
                  {/* Preço de venda destacado em primary para chamar atenção do usuário */}
                  <TableCell className="font-semibold text-primary">
                    {formatBRL(precoVenda)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(especie)}
                        aria-label={`Editar ${especie.nome}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteDialog(especie.id)}
                        aria-label={`Excluir ${especie.nome}`}
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

      {/* Dialog de criação/edição de espécie */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEspecie ? 'Editar Espécie' : 'Nova Espécie'}
            </DialogTitle>
          </DialogHeader>
          {/* key força remount ao trocar entre criar/editar — garante reset do form */}
          <EspecieForm
            key={editingEspecie?.id ?? 'new'}
            defaultValues={
              editingEspecie
                ? {
                    nome: editingEspecie.nome,
                    custo_m3: editingEspecie.custo_m3,
                    margem_lucro_pct: editingEspecie.margem_lucro_pct,
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
            <DialogTitle>Excluir Espécie</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant">
            Esta ação é irreversível. Todas as madeiras m³ vinculadas a esta
            espécie também serão excluídas automaticamente.
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

export default EspeciesPanel
