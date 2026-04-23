import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import type { ItemOrcamentoCalculo } from '@/lib/calcular-orcamento'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Remove casas decimais desnecessárias para espessura/largura (ex: 5, 15, 2.5)
function formatDimensao(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

// Comprimento sempre com 2 casas decimais para consistência visual (ex: 2,50)
function formatComprimento(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface ItemMaterialProps {
  item: ItemOrcamentoCalculo
}

export function ItemMaterial({ item }: ItemMaterialProps) {
  const { updateQuantidade, removeItem } = useOrcamentoStore()

  const subtotal = item.preco_unitario * item.quantidade

  // Chip de origem — exibido apenas para itens de madeira m³ com dados de espécie preenchidos
  const chipMadeiraLabel =
    item.origem === 'madeira_m3' && item.especie_nome
      ? `Madeira m³ · ${item.especie_nome} ${formatDimensao(item.espessura_cm ?? 0)}×${formatDimensao(item.largura_cm ?? 0)}×${formatComprimento(item.comprimento_real_m ?? 0)}m`
      : null

  // Chip de acabamento — aparece quando um serviço de acabamento foi aplicado ao item
  const chipAcabamentoLabel =
    item.acabamento_nome
      ? `Acabamento: ${item.acabamento_nome} (+${formatDimensao(item.acabamento_percentual ?? 0)}%)`
      : null

  // Chave única da linha — uid composto para madeira m³, item_preco_id para legado/outro_produto
  const itemKey = item.uid ?? item.item_preco_id

  // Estado local como string para permitir edição livre sem travar o input (ex: apagar e redigitar)
  const [inputValue, setInputValue] = useState(String(item.quantidade))

  // Sincroniza o input quando o store muda por fora (ex: hydrate, reset)
  useEffect(() => {
    setInputValue(String(item.quantidade))
  }, [item.quantidade])

  function handleQuantidadeChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Aceita qualquer string — validação ocorre só no blur
    setInputValue(e.target.value)
  }

  function handleQuantidadeBlur() {
    const val = parseFloat(inputValue)
    if (!isNaN(val) && val >= 0.01) {
      // Valor válido: commita no store e normaliza a exibição
      updateQuantidade(itemKey, val)
      setInputValue(String(val))
    } else {
      // Valor inválido ou zero/negativo: restaura o último valor válido do store
      setInputValue(String(item.quantidade))
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-[8px] bg-card p-3">
      {/* Nome + unidade + chips contextuais de origem e acabamento */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.nome}</p>
        <p className="text-xs text-muted-foreground">
          {formatBRL(item.preco_unitario)} / {item.unidade}
        </p>
        {(chipMadeiraLabel ?? chipAcabamentoLabel) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {chipMadeiraLabel && (
              <span className="rounded-[4px] bg-surface-container-high/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                {chipMadeiraLabel}
              </span>
            )}
            {chipAcabamentoLabel && (
              <span className="rounded-[4px] bg-surface-container-high/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                {chipAcabamentoLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quantity input */}
      <div className="w-20 shrink-0">
        <Input
          type="number"
          step={0.01}
          value={inputValue}
          onChange={handleQuantidadeChange}
          onBlur={handleQuantidadeBlur}
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
        onClick={() => removeItem(itemKey)}
        aria-label={`Remover ${item.nome}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
