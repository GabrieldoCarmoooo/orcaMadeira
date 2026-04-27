import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layers } from 'lucide-react'
import { madeiraM3Schema, type MadeiraM3Input } from '@/lib/schemas/madeira-m3-schema'
import { useEspecies } from '@/hooks/useEspecies'
import {
  calcularValorVendaM3,
  calcularValorMadeiraM3,
} from '@/lib/calcular-madeira'
import { BRL } from '@/lib/format'
import type { MadeiraM3 } from '@/types/produto'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { ComprimentosManager } from './comprimentos-manager'
import { DimensoesFields } from './madeira-m3-dimensoes-fields'

interface MadeiraM3FormProps {
  /** Madeira existente — presente no modo edição, ausente no modo criação */
  defaultValues?: Partial<MadeiraM3> | undefined
  /** Callback com dados validados ao submeter */
  onSubmit: (data: MadeiraM3Input) => Promise<void>
  /** Cancela e fecha o dialog sem salvar */
  onCancel?: () => void
}

export function MadeiraM3Form({ defaultValues, onSubmit, onCancel }: MadeiraM3FormProps) {
  const { especies, isLoading: loadingEspecies } = useEspecies()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Watch nos comprimentos para refletir toggles de disponibilidade no ComprimentosManager
  const comprimentosWatched = form.watch('comprimentos') ?? []

  // Resolve a espécie selecionada para calcular o valor de venda/m³
  const especieSelecionada = especies.find((e) => e.id === especieId)
  const valorVendaM3 =
    especieSelecionada
      ? calcularValorVendaM3(especieSelecionada.custo_m3, especieSelecionada.margem_lucro_pct)
      : null

  // Calcula o preço para 1m de comprimento de referência como preview no form
  const previewPreco1m =
    valorVendaM3 !== null &&
    Number.isFinite(espessuraCm) && espessuraCm > 0 &&
    Number.isFinite(larguraCm) && larguraCm > 0
      ? calcularValorMadeiraM3(espessuraCm, larguraCm, 1, valorVendaM3)
      : null

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
              <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Espécie
              </FormLabel>
              <FormControl>
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
              </FormControl>
              {fieldState.error && (
                <p className="text-xs text-destructive">{fieldState.error.message}</p>
              )}
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

        {/* Campos de dimensão transversal — espessura e largura em cm */}
        <DimensoesFields control={form.control} />

        {/* Preview do valor tabelado para 1m — calculado via espécie + dimensões */}
        {previewPreco1m !== null && (
          <div className="bg-surface-container-highest rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Valor tabelado (1m)
            </span>
            <span className="text-base font-semibold text-primary">
              {BRL.format(previewPreco1m)}
            </span>
          </div>
        )}

        {/* Seção extraída: gerenciador de comprimentos disponíveis da madeira */}
        <ComprimentosManager
          fieldIds={fields.map((f) => f.id)}
          comprimentos={comprimentosWatched}
          onAppend={append}
          onRemove={remove}
          onToggleDisponivel={toggleDisponivel}
          valorVendaM3={valorVendaM3}
          espessuraCm={espessuraCm}
          larguraCm={larguraCm}
        />

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
