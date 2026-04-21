import { useState } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { useOutrosProdutos } from '@/hooks/useOutrosProdutos'
import type { OutroProduto } from '@/types/produto'
import type { OutroProdutoInput } from '@/lib/schemas/outro-produto-schema'
import { OutroProdutoForm } from './outro-produto-form'
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

export function OutrosProdutosPanel() {
  const { outrosProdutos, isLoading, create, update, remove } =
    useOutrosProdutos()

  // Estado do dialog de criação/edição
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<OutroProduto | null>(
    null,
  )

  // Estado do dialog de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openCreateDialog() {
    setEditingProduto(null)
    setFormDialogOpen(true)
  }

  function openEditDialog(produto: OutroProduto) {
    setEditingProduto(produto)
    setFormDialogOpen(true)
  }

  function openDeleteDialog(id: string) {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  // Cria ou atualiza produto dependendo do modo; fecha o dialog ao concluir
  async function handleFormSubmit(data: OutroProdutoInput) {
    if (editingProduto) {
      await update(editingProduto.id, data)
    } else {
      await create(data)
    }
    setFormDialogOpen(false)
    setEditingProduto(null)
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

  return (
    <div className="space-y-4">
      {/* Cabeçalho da seção com CTA de criação */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-on-surface">
            Outros Produtos
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Itens de preço fixo — parafusos, pregos, tintas, telhas, etc.
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="shrink-0">
          <Plus />
          Novo Produto
        </Button>
      </div>

      {/* Conteúdo principal: loading, vazio ou tabela */}
      {isLoading ? (
        <div className="py-10 text-center text-sm text-on-surface-variant">
          Carregando produtos...
        </div>
      ) : outrosProdutos.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Nenhum produto cadastrado"
          description="Cadastre itens de preço fixo como parafusos, pregos, tintas e outros materiais."
          action={
            <Button onClick={openCreateDialog} size="sm">
              <Plus />
              Novo Produto
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              {/* Preço unitário é armazenado diretamente — sem cálculo derivado */}
              <TableHead>Preço Unitário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outrosProdutos.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell className="font-medium text-on-surface">
                  <div>
                    <span>{produto.nome}</span>
                    {/* Descrição opcional em linha menor — só exibe se preenchida */}
                    {produto.descricao && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {produto.descricao}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-highest text-on-surface-variant">
                    {produto.unidade}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  {formatBRL(produto.preco_unitario)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(produto)}
                      aria-label={`Editar ${produto.nome}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openDeleteDialog(produto.id)}
                      aria-label={`Excluir ${produto.nome}`}
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

      {/* Dialog de criação/edição de produto */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          {/* key força remount ao trocar entre criar/editar — garante reset do form */}
          <OutroProdutoForm
            key={editingProduto?.id ?? 'new'}
            defaultValues={
              editingProduto
                ? {
                    nome: editingProduto.nome,
                    unidade: editingProduto.unidade,
                    preco_unitario: editingProduto.preco_unitario,
                    descricao: editingProduto.descricao ?? '',
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
            <DialogTitle>Excluir Produto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant">
            Esta ação é irreversível. O produto será removido do catálogo e não
            poderá mais ser adicionado a novos orçamentos.
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

export default OutrosProdutosPanel
