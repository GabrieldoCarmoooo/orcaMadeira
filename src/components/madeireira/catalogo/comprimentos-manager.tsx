import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { calcularValorMadeiraM3 } from '@/lib/calcular-madeira'
import { BRL } from '@/lib/format'
import { EditorialInput } from '@/components/ui/editorial-input'
import { Button } from '@/components/ui/button'

// Comprimentos sugeridos em metros — atalhos para preenchimento rápido da lista
const COMPRIMENTOS_SUGERIDOS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]

interface ComprimentoItem {
  comprimento_m: number
  disponivel: boolean
}

interface ComprimentosManagerProps {
  /** IDs estáveis dos fields do useFieldArray — usados como React keys */
  fieldIds: string[]
  /** Valores reativos dos comprimentos (via form.watch) — refletem toggles de disponibilidade */
  comprimentos: ComprimentoItem[]
  onAppend: (value: { comprimento_m: number; disponivel: boolean }) => void
  onRemove: (index: number) => void
  onToggleDisponivel: (index: number) => void
  /** Valor de venda/m³ da espécie selecionada — necessário para calcular preview de preço */
  valorVendaM3: number | null
  espessuraCm: number
  larguraCm: number
}

// Formata comprimento com vírgula decimal (ex: 2,50 m)
function formatComprimento(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ComprimentosManager({
  fieldIds,
  comprimentos,
  onAppend,
  onRemove,
  onToggleDisponivel,
  valorVendaM3,
  espessuraCm,
  larguraCm,
}: ComprimentosManagerProps) {
  // Input controlado do campo "adicionar comprimento" — separado do form principal
  const [novoComprimento, setNovoComprimento] = useState<string>('')

  // Adiciona comprimento à lista, rejeitando duplicatas e valores inválidos
  function adicionarComprimento(valor: number) {
    if (!Number.isFinite(valor) || valor <= 0) return
    const jaExiste = comprimentos.some((c) => c.comprimento_m === valor)
    if (jaExiste) return
    onAppend({ comprimento_m: valor, disponivel: true })
    setNovoComprimento('')
  }

  function handleAdicionarInput() {
    const valor = parseFloat(novoComprimento.replace(',', '.'))
    adicionarComprimento(valor)
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        Comprimentos disponíveis
      </p>

      {/* Chips de sugestão — atalhos para comprimentos comuns no mercado */}
      <div className="flex flex-wrap gap-1.5">
        {COMPRIMENTOS_SUGERIDOS.map((val) => {
          const jaAdicionado = comprimentos.some((c) => c.comprimento_m === val)
          return (
            <button
              key={val}
              type="button"
              onClick={() => adicionarComprimento(val)}
              disabled={jaAdicionado}
              className={[
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                jaAdicionado
                  ? 'bg-primary/10 text-primary cursor-default'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
              ].join(' ')}
            >
              {formatComprimento(val)}m
            </button>
          )
        })}
      </div>

      {/* Input manual + botão adicionar para comprimentos fora das sugestões */}
      <div className="flex gap-2">
        <EditorialInput
          label="Comprimento (m)"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Ex: 2,50"
          value={novoComprimento}
          onChange={(e) => setNovoComprimento(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdicionarInput()
            }
          }}
          className="flex-1"
        />
        <div className="flex items-end pb-0.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAdicionarInput}
            disabled={!novoComprimento}
          >
            <Plus />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Lista de comprimentos adicionados com tabela de preços calculados */}
      {comprimentos.length > 0 && valorVendaM3 !== null &&
      Number.isFinite(espessuraCm) && espessuraCm > 0 &&
      Number.isFinite(larguraCm) && larguraCm > 0 ? (
        <div className="bg-surface-container-highest rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-4 py-2 border-b border-outline/10">
            <span>Comprimento</span>
            <span className="text-right pr-6">Preço unit.</span>
            <span />
          </div>
          {comprimentos.map((comprimento, index) => {
            // Rechecagem inline para estreitar o tipo de valorVendaM3 dentro do callback
            const preco =
              valorVendaM3 !== null &&
              Number.isFinite(espessuraCm) && espessuraCm > 0 &&
              Number.isFinite(larguraCm) && larguraCm > 0
                ? calcularValorMadeiraM3(
                    espessuraCm,
                    larguraCm,
                    comprimento.comprimento_m,
                    valorVendaM3,
                  )
                : null

            return (
              <div
                key={fieldIds[index] ?? String(index)}
                className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2.5 border-b border-outline/10 last:border-0"
              >
                {/* Indicador de disponibilidade clicável + comprimento */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleDisponivel(index)}
                    title={comprimento.disponivel ? 'Desativar' : 'Ativar'}
                    className={[
                      'w-2 h-2 rounded-full shrink-0 transition-colors',
                      comprimento.disponivel ? 'bg-primary' : 'bg-outline/40',
                    ].join(' ')}
                  />
                  <span
                    className={[
                      'text-sm font-medium',
                      comprimento.disponivel
                        ? 'text-on-surface'
                        : 'text-on-surface-variant line-through',
                    ].join(' ')}
                  >
                    {formatComprimento(comprimento.comprimento_m)} m
                  </span>
                </div>

                {/* Preço calculado para este comprimento */}
                <span className="text-sm font-semibold text-primary text-right pr-4">
                  {preco !== null ? BRL.format(preco) : '—'}
                </span>

                {/* Botão de remoção — remove do array do form */}
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-on-surface-variant hover:text-destructive transition-colors"
                  aria-label={`Remover ${comprimento.comprimento_m}m`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      ) : comprimentos.length > 0 ? (
        // Lista simples sem preview de preço — espécie ou dimensões ainda não preenchidas
        <div className="bg-surface-container-highest rounded-lg overflow-hidden">
          {comprimentos.map((comprimento, index) => (
            <div
              key={fieldIds[index] ?? String(index)}
              className="flex items-center justify-between px-4 py-2.5 border-b border-outline/10 last:border-0"
            >
              <span className="text-sm text-on-surface">
                {formatComprimento(comprimento.comprimento_m)} m
              </span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-on-surface-variant hover:text-destructive transition-colors"
                aria-label={`Remover ${comprimento.comprimento_m}m`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant py-2">
          Nenhum comprimento adicionado. Use os chips acima ou insira um valor manualmente.
        </p>
      )}
    </div>
  )
}

export default ComprimentosManager
