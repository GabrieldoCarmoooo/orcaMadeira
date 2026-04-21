import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  PackageOpen,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ItemMaterial } from '@/components/orcamento/item-material'
import { useCatalogoProdutos } from '@/hooks/useCatalogoProdutos'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import { supabase } from '@/lib/supabase'
import {
  calcularValorVendaM3,
  calcularValorMadeiraM3,
  aplicarAcabamento,
} from '@/lib/calcular-madeira'
import type { CatalogoItem, CatalogoItemMadeiraM3, ServicoAcabamento } from '@/types/produto'

// Sentinel para "sem acabamento" no Select — string não vazia para compatibilidade com Radix
const ACABAMENTO_NENHUM = '__nenhum__'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface StepMateriaisProps {
  onNext: () => void
  onBack: () => void
}

export function StepMateriais({ onNext, onBack }: StepMateriaisProps) {
  const { itens, resumo, addItem, setStep } = useOrcamentoStore()

  const [query, setQuery] = useState('')
  const { items, isLoading } = useCatalogoProdutos(query)

  // ─── Estado do dialog de configuração de madeira m³ ───────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CatalogoItemMadeiraM3 | null>(null)
  const [selectedComprimentoId, setSelectedComprimentoId] = useState('')
  const [selectedAcabamentoId, setSelectedAcabamentoId] = useState(ACABAMENTO_NENHUM)
  const [dialogQty, setDialogQty] = useState(1)

  // Acabamentos ativos da madeireira vinculada.
  // A RLS garante que o carpinteiro só vê acabamentos da madeireira aprovada.
  const [acabamentos, setAcabamentos] = useState<ServicoAcabamento[]>([])

  useEffect(() => {
    async function fetchAcabamentos() {
      const { data } = await supabase
        .from('servicos_acabamento')
        .select('*')
        .eq('ativo', true)
        .order('nome')
      setAcabamentos((data as ServicoAcabamento[]) ?? [])
    }
    fetchAcabamentos()
  }, [])

  // ─── Cálculo de preço do dialog ───────────────────────────────────────────
  const comprimentos = selectedItem?.data.comprimentos ?? []
  const comprimentoSelecionado = comprimentos.find((c) => c.id === selectedComprimentoId)
  const acabamentoSelecionado =
    selectedAcabamentoId && selectedAcabamentoId !== ACABAMENTO_NENHUM
      ? acabamentos.find((a) => a.id === selectedAcabamentoId)
      : undefined

  // Preço base calculado a partir das dimensões e do valor de venda da espécie
  const precoBase = (() => {
    if (!selectedItem || !comprimentoSelecionado) return 0
    const especie = selectedItem.data.especie
    if (!especie) return 0
    const valorM3 = calcularValorVendaM3(especie.custo_m3, especie.margem_lucro_pct)
    return calcularValorMadeiraM3(
      selectedItem.data.espessura_cm,
      selectedItem.data.largura_cm,
      comprimentoSelecionado.comprimento_m,
      valorM3,
    )
  })()

  // Acabamento é aplicado sobre o preço base quando selecionado
  const precoUnitario = acabamentoSelecionado
    ? aplicarAcabamento(precoBase, acabamentoSelecionado.percentual_acrescimo)
    : precoBase

  const subtotalDialog = precoUnitario * dialogQty

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Abre o dialog de configuração e reseta seleções anteriores
  function handleOpenDialog(item: CatalogoItemMadeiraM3) {
    setSelectedItem(item)
    setSelectedComprimentoId('')
    setSelectedAcabamentoId(ACABAMENTO_NENHUM)
    setDialogQty(1)
    setDialogOpen(true)
  }

  // Confirma adição de madeira m³ com snapshot completo de espécie/comprimento/acabamento
  function handleConfirmDialog() {
    if (!selectedItem || !comprimentoSelecionado) return

    // uid composto garante que a mesma madeira com comprimentos ou acabamentos diferentes
    // sejam linhas independentes no store (sem colapso por item_preco_id)
    const uid = `madeira:${selectedItem.data.id}:${comprimentoSelecionado.id}:${acabamentoSelecionado?.id ?? 'none'}`

    addItem({
      uid,
      item_preco_id: selectedItem.data.id,
      nome: selectedItem.data.nome,
      unidade: 'un',
      preco_unitario: precoUnitario,
      quantidade: dialogQty,
      // Snapshot gravado para preservar histórico no orçamento finalizado
      origem: 'madeira_m3',
      madeira_m3_id: selectedItem.data.id,
      especie_nome: selectedItem.data.especie?.nome,
      espessura_cm: selectedItem.data.espessura_cm,
      largura_cm: selectedItem.data.largura_cm,
      comprimento_id: comprimentoSelecionado.id,
      comprimento_real_m: comprimentoSelecionado.comprimento_m,
      acabamento_id: acabamentoSelecionado?.id,
      acabamento_nome: acabamentoSelecionado?.nome,
      acabamento_percentual: acabamentoSelecionado?.percentual_acrescimo,
    })

    setDialogOpen(false)
  }

  // Adiciona item de outro_produto ou legado_planilha diretamente (sem necessidade de dialog)
  function handleAddDireto(item: CatalogoItem) {
    if (item.origem === 'madeira_m3') return

    if (item.origem === 'outro_produto') {
      addItem({
        item_preco_id: item.data.id,
        nome: item.data.nome,
        unidade: item.data.unidade,
        preco_unitario: item.data.preco_unitario,
        quantidade: 1,
        origem: 'outro_produto',
        outro_produto_id: item.data.id,
      })
    } else {
      // legado_planilha — mantém comportamento original
      addItem({
        item_preco_id: item.data.id,
        nome: item.data.nome,
        unidade: item.data.unidade,
        preco_unitario: item.data.preco_unitario,
        quantidade: 1,
        origem: 'legado_planilha',
      })
    }
  }

  function handleBack() {
    setStep(1)
    onBack()
  }

  function handleNext() {
    if (itens.length === 0) return
    setStep(3)
    onNext()
  }

  // Itens já adicionados (apenas legado e outro_produto são bloqueados — madeira_m3 permite reconfigurações)
  const addedIds = new Set(
    itens
      .filter((i) => i.origem !== 'madeira_m3')
      .map((i) => i.item_preco_id),
  )

  return (
    <div className="space-y-6">
      {/* Busca de materiais */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Buscar materiais
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do produto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Resultados da busca */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            <span className="text-sm">Buscando...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <PackageOpen className="size-8 opacity-50" />
            <p className="text-sm">
              {query.trim()
                ? 'Nenhum produto encontrado.'
                : 'Nenhum produto disponível. Verifique se está vinculado a uma madeireira com catálogo cadastrado.'}
            </p>
          </div>
        ) : (
          items.map((item) => {
            if (item.origem === 'madeira_m3') {
              // Madeira m³ — abre dialog de configuração de comprimento e acabamento
              const semComprimentos = (item.data.comprimentos ?? []).length === 0
              return (
                <div
                  key={item.data.id}
                  className="flex items-center gap-3 rounded-[8px] bg-muted/50 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.data.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.data.espessura_cm}×{item.data.largura_cm}cm
                      {item.data.especie ? ` · ${item.data.especie.nome}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="shrink-0"
                    onClick={() => handleOpenDialog(item)}
                    disabled={semComprimentos}
                    title={semComprimentos ? 'Nenhum comprimento cadastrado para este produto' : undefined}
                  >
                    <Settings2 className="size-3.5" />
                    Configurar
                  </Button>
                </div>
              )
            }

            // outro_produto ou legado_planilha — adição direta com qty=1
            const added = addedIds.has(item.data.id)
            return (
              <div
                key={item.data.id}
                className="flex items-center gap-3 rounded-[8px] bg-muted/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.data.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.data.unidade} · {formatBRL(item.data.preco_unitario)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={added ? 'secondary' : 'default'}
                  className="shrink-0"
                  onClick={() => handleAddDireto(item)}
                  disabled={added}
                >
                  <Plus className="size-3.5" />
                  {added ? 'Adicionado' : 'Adicionar'}
                </Button>
              </div>
            )
          })
        )}
      </div>

      {/* Dialog de configuração para madeira m³ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar {selectedItem?.data.nome}</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2">
              {/* Select de comprimento — obrigatório; opções pré-cadastradas pela madeireira */}
              <div className="space-y-2">
                <Label htmlFor="select-comprimento">Comprimento *</Label>
                {comprimentos.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-[8px] bg-muted/50 py-4 text-center text-muted-foreground">
                    <PackageOpen className="size-5 opacity-50" />
                    <p className="text-sm">Nenhum comprimento cadastrado para este produto.</p>
                  </div>
                ) : (
                  <Select value={selectedComprimentoId} onValueChange={setSelectedComprimentoId}>
                    <SelectTrigger id="select-comprimento">
                      <SelectValue placeholder="Selecione o comprimento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comprimentos.map((c) => {
                        // Calcula preço de cada comprimento disponível para mostrar na option
                        const especie = selectedItem.data.especie
                        const valorM3 = especie
                          ? calcularValorVendaM3(especie.custo_m3, especie.margem_lucro_pct)
                          : 0
                        const preco = calcularValorMadeiraM3(
                          selectedItem.data.espessura_cm,
                          selectedItem.data.largura_cm,
                          c.comprimento_m,
                          valorM3,
                        )
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            {c.comprimento_m.toLocaleString('pt-BR')} m — {formatBRL(preco)}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Select de acabamento — opcional; filtrado pelos ativos da madeireira */}
              {acabamentos.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="select-acabamento">Acabamento (opcional)</Label>
                  <Select value={selectedAcabamentoId} onValueChange={setSelectedAcabamentoId}>
                    <SelectTrigger id="select-acabamento">
                      <SelectValue placeholder="Sem acabamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ACABAMENTO_NENHUM}>Sem acabamento</SelectItem>
                      {acabamentos.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nome} (+{a.percentual_acrescimo}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Input de quantidade */}
              <div className="space-y-2">
                <Label htmlFor="input-quantidade">Quantidade</Label>
                <Input
                  id="input-quantidade"
                  type="number"
                  min={1}
                  value={dialogQty}
                  onChange={(e) => setDialogQty(Math.max(1, Math.floor(Number(e.target.value))))}
                />
              </div>

              {/* Preview de subtotal — exibido apenas após selecionar comprimento */}
              {comprimentoSelecionado && (
                <div className="rounded-[8px] bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    Unitário: {formatBRL(precoUnitario)}
                    {acabamentoSelecionado
                      ? ` (c/ ${acabamentoSelecionado.nome} +${acabamentoSelecionado.percentual_acrescimo}%)`
                      : ''}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Subtotal: {formatBRL(subtotalDialog)}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDialog}
              disabled={!comprimentoSelecionado}
            >
              <Plus className="size-4" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de materiais selecionados */}
      {itens.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Materiais selecionados ({itens.length})
            </p>
            <p className="text-xs text-muted-foreground">
              Subtotal:{' '}
              <span className="font-semibold text-foreground">
                {formatBRL(resumo.subtotal_materiais)}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            {itens.map((item) => (
              <ItemMaterial key={item.uid ?? item.item_preco_id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Navegação wizard */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <Button
          type="button"
          className="flex-1"
          size="lg"
          onClick={handleNext}
          disabled={itens.length === 0}
        >
          Próximo
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {itens.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Adicione pelo menos 1 material para continuar.
        </p>
      )}
    </div>
  )
}
