import { Plus, Search, PackageOpen, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ItemMaterial } from '@/components/orcamento/item-material'
import { useItensPreco } from '@/hooks/useItensPreco'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import type { ItemPreco } from '@/types/madeireira'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface StepMateriaisProps {
  onNext: () => void
  onBack: () => void
}

export function StepMateriais({ onNext, onBack }: StepMateriaisProps) {
  const { itens, resumo, addItem, setStep } = useOrcamentoStore()
  const { itens: resultados, loading, query, setQuery, tabelaId } = useItensPreco()

  function handleAdd(item: ItemPreco) {
    addItem({
      item_preco_id: item.id,
      nome: item.nome,
      unidade: item.unidade,
      preco_unitario: item.preco_unitario,
      quantidade: 1,
    })
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

  const addedIds = new Set(itens.map((i) => i.item_preco_id))

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Buscar materiais
        </p>

        {tabelaId === null && (
          <div className="rounded-[8px] bg-muted px-4 py-3 text-sm text-muted-foreground">
            Você precisa estar vinculado a uma madeireira para selecionar materiais.
          </div>
        )}

        {tabelaId !== null && (
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
        )}
      </div>

      {/* Search results */}
      {tabelaId !== null && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              <span className="text-sm">Buscando...</span>
            </div>
          ) : resultados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
              <PackageOpen className="size-8 opacity-50" />
              <p className="text-sm">Nenhum produto encontrado.</p>
            </div>
          ) : (
            resultados.map((item) => {
              const added = addedIds.has(item.id)
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[8px] bg-muted/50 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.unidade} · {formatBRL(item.preco_unitario)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={added ? 'secondary' : 'default'}
                    className="shrink-0"
                    onClick={() => handleAdd(item)}
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
      )}

      {/* Added items */}
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
              <ItemMaterial key={item.item_preco_id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
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
