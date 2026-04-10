import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import type { ItemOrcamentoCalculo } from '@/lib/calcular-orcamento'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ItemMaterialProps {
  item: ItemOrcamentoCalculo
}

export function ItemMaterial({ item }: ItemMaterialProps) {
  const { updateQuantidade, removeItem } = useOrcamentoStore()

  const subtotal = item.preco_unitario * item.quantidade

  function handleQuantidadeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val >= 0.01) {
      updateQuantidade(item.item_preco_id, val)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-[8px] bg-card p-3">
      {/* Name + unit */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.nome}</p>
        <p className="text-xs text-muted-foreground">
          {formatBRL(item.preco_unitario)} / {item.unidade}
        </p>
      </div>

      {/* Quantity input */}
      <div className="w-20 shrink-0">
        <Input
          type="number"
          min={0.01}
          step={0.01}
          value={item.quantidade}
          onChange={handleQuantidadeChange}
          className="h-8 text-center text-sm"
          aria-label={`Quantidade de ${item.nome}`}
        />
      </div>

      {/* Subtotal */}
      <p className="w-24 shrink-0 text-right text-sm font-semibold text-foreground">
        {formatBRL(subtotal)}
      </p>

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => removeItem(item.item_preco_id)}
        aria-label={`Remover ${item.nome}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
