import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Layers } from 'lucide-react'
import { madeiraM3Schema, type MadeiraM3Input } from '@/lib/schemas/madeira-m3-schema'
import { useEspecies } from '@/hooks/useEspecies'
import {
  calcularValorVendaM3,
  calcularValorMadeiraM3,
} from '@/lib/calcular-madeira'
import type { MadeiraM3 } from '@/types/produto'
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditorialInput } from '@/components/ui/editorial-input'
import { Button } from '@/components/ui/button'
import { EmptyState } from './empty-state'

// Comprimentos sugeridos em metros — atalhos para o preenchimento rápido da lista
const COMPRIMENTOS_SUGERIDOS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]

interface MadeiraM3FormProps {
  /** Madeira existente — presente no modo edição, ausente no modo criação */
  defaultValues?: Partial<MadeiraM3>
  /** Callback com dados validados ao submeter */
  onSubmit: (data: MadeiraM3Input) => Promise<void>
  /** Cancela e fecha o dialog sem salvar */
  onCancel?: () => void
}

// Formata número como moeda BRL
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

// Formata comprimento com vírgula decimal (ex: 2,50 m)
function formatComprimento(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function MadeiraM3Form({ defaultValues, onSubmit, onCancel }: MadeiraM3FormProps) {
  const { especies, isLoading: loadingEspecies } = useEspecies()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input controlado do campo "adicionar comprimento" — separado do form principal
  const [novoComprimento, setNovoComprimento] = useState<string>('')

  // Monta defaultValues a partir da madeira existente (modo edição) ou valores iniciais
  const form = useForm<MadeiraM3Input>({
    resolver: zodResolver(madeiraM3Schema),
    defaultValues: {
      especie_id: defaultValues?.especie_id ?? '',
      nome: defaultValues?.nome ?? '',
      espessura_cm: defaultValues?.espessura_cm ?? NaN,
      largura_cm: defaultValues?.largura_cm ?? NaN,
      // Comprimento de referência padrão 1m — base do preview no form
      comprimento_m: defaultValues?.comprimento_m ?? 1,
      // Carrega comprimentos existentes no modo edição
      comprimentos: defaultValues?.comprimentos?.map((c) => ({
        comprimento_m: c.comprimento_m,
        disponivel: c.disponivel,
      })) ?? [],
    },
  })

  // useFieldArray controla a sub-lista de comprimentos como campo do form
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'comprimentos',
  })

  // Watch nos campos de dimensão para atualizar o preview de preço em tempo real
  const [especieId, espessuraCm, larguraCm] = form.watch([
    'especie_id',
    'espessura_cm',
    'largura_cm',
  ])

  // Resolve a espécie selecionada para calcular o valor de venda/m³
  const especieSelecionada = especies.find((e) => e.id === especieId)
  const valorVendaM3 =
    especieSelecionada
      ? calcularValorVendaM3(especieSelecionada.custo_m3, especieSelecionada.margem_lucro_pct)
      : null

  // Calcula o preço para 1m de comprimento de referência como preview no form
  const previewPreco1m =
    valorVendaM3 !== null &&
    Number.isFinite(espessuraCm) &&
    espessuraCm > 0 &&
    Number.isFinite(larguraCm) &&
    larguraCm > 0
      ? calcularValorMadeiraM3(espessuraCm, larguraCm, 1, valorVendaM3)
      : null

  // Adiciona comprimento à lista, rejeitando duplicatas e valores inválidos
  function adicionarComprimento(valor: number) {
    if (!Number.isFinite(valor) || valor <= 0) return

    const jaExiste = fields.some((f) => f.comprimento_m === valor)
    if (jaExiste) return

    append({ comprimento_m: valor, disponivel: true })
    setNovoComprimento('')
  }

  function handleAdicionarInput() {
    const valor = parseFloat(novoComprimento.replace(',', '.'))
    adicionarComprimento(valor)
  }

  // Toggle de disponibilidade de um comprimento na lista — sem remover do banco
  function toggleDisponivel(index: number) {
    const atual = form.getValues(`comprimentos.${index}.disponivel`)
    form.setValue(`comprimentos.${index}.disponivel`, !atual)
  }

  async function handleSubmit(data: MadeiraM3Input) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Guarda sem espécies cadastradas — o form é desabilitado com orientação ao usuário
  if (!loadingEspecies && especies.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Layers />}
          title="Nenhuma espécie cadastrada"
          description="Cadastre ao menos uma espécie primeiro para poder adicionar madeiras m³."
        />
        {onCancel && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

        {/* Select de espécie — define o valor de venda/m³ herdado */}
        <FormField
          control={form.control}
          name="especie_id"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Espécie
                  </label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingEspecies}
                  >
                    <SelectTrigger
                      className={fieldState.error ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Selecione a espécie..." />
                    </SelectTrigger>
                    <SelectContent>
                      {especies.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Nome do produto */}
        <FormField
          control={form.control}
          name="nome"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <EditorialInput
                  label="Nome do Produto"
                  placeholder="Ex: Viga 5×15 Cambará"
                  error={fieldState.error?.message}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Dimensões da seção transversal — espessura e largura em cm */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="espessura_cm"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <EditorialInput
                    label="Espessura (cm)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="5"
                    error={fieldState.error?.message}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="largura_cm"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <EditorialInput
                    label="Largura (cm)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="15"
                    error={fieldState.error?.message}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preview do valor tabelado para 1m — calculado via espécie + dimensões */}
        {previewPreco1m !== null && (
          <div className="bg-surface-container-highest rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Valor tabelado (1m)
            </span>
            <span className="text-base font-semibold text-primary">
              {formatBRL(previewPreco1m)}
            </span>
          </div>
        )}

        {/* ─── Seção de comprimentos disponíveis ───────────────────────────── */}
        {/* Cada comprimento é uma opção que o carpinteiro pode selecionar no orçamento */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Comprimentos disponíveis
          </p>

          {/* Chips de sugestão — atalhos para comprimentos comuns no mercado */}
          <div className="flex flex-wrap gap-1.5">
            {COMPRIMENTOS_SUGERIDOS.map((val) => {
              const jaAdicionado = fields.some((f) => f.comprimento_m === val)
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
          {fields.length > 0 && valorVendaM3 !== null && previewPreco1m !== null ? (
            <div className="bg-surface-container-highest rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-4 py-2 border-b border-outline/10">
                <span>Comprimento</span>
                <span className="text-right pr-6">Preço unit.</span>
                <span />
              </div>
              {fields.map((field, index) => {
                // Calcula preço para cada comprimento cadastrado usando as dimensões do form
                const preco =
                  Number.isFinite(espessuraCm) &&
                  espessuraCm > 0 &&
                  Number.isFinite(larguraCm) &&
                  larguraCm > 0
                    ? calcularValorMadeiraM3(espessuraCm, larguraCm, field.comprimento_m, valorVendaM3)
                    : null

                const disponivel = form.watch(`comprimentos.${index}.disponivel`)

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2.5 border-b border-outline/10 last:border-0"
                  >
                    {/* Comprimento com indicador de disponibilidade */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDisponivel(index)}
                        title={disponivel ? 'Desativar' : 'Ativar'}
                        className={[
                          'w-2 h-2 rounded-full shrink-0 transition-colors',
                          disponivel ? 'bg-primary' : 'bg-outline/40',
                        ].join(' ')}
                      />
                      <span
                        className={[
                          'text-sm font-medium',
                          disponivel ? 'text-on-surface' : 'text-on-surface-variant line-through',
                        ].join(' ')}
                      >
                        {formatComprimento(field.comprimento_m)} m
                      </span>
                    </div>

                    {/* Preço calculado para este comprimento */}
                    <span className="text-sm font-semibold text-primary text-right pr-4">
                      {preco !== null ? formatBRL(preco) : '—'}
                    </span>

                    {/* Botão de remoção — remove do array do form */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-on-surface-variant hover:text-destructive transition-colors"
                      aria-label={`Remover ${field.comprimento_m}m`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : fields.length > 0 ? (
            // Lista sem preview de preço (espécie ou dimensões não preenchidas)
            <div className="bg-surface-container-highest rounded-lg overflow-hidden">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-outline/10 last:border-0"
                >
                  <span className="text-sm text-on-surface">
                    {formatComprimento(field.comprimento_m)} m
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-on-surface-variant hover:text-destructive transition-colors"
                    aria-label={`Remover ${field.comprimento_m}m`}
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

        <div className="flex gap-2 justify-end pt-1">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default MadeiraM3Form
