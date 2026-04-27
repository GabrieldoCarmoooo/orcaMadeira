import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  outroProdutoSchema,
  type OutroProdutoInput,
} from '@/lib/schemas/outro-produto-schema'
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

// Unidades mais comuns para produtos de madeireira — o campo aceita texto livre além dessas
const UNIDADES_SUGERIDAS = [
  { value: 'kg', label: 'kg — Quilograma' },
  { value: 'un', label: 'un — Unidade' },
  { value: 'm', label: 'm — Metro linear' },
  { value: 'm²', label: 'm² — Metro quadrado' },
  { value: 'm³', label: 'm³ — Metro cúbico' },
  { value: 'pç', label: 'pç — Peça' },
  { value: 'cx', label: 'cx — Caixa' },
]

interface OutroProdutoFormProps {
  /** Valores iniciais — presentes no modo edição, ausentes no modo criação */
  defaultValues?: Partial<OutroProdutoInput> | undefined
  /** Callback chamado com os dados validados ao submeter */
  onSubmit: (data: OutroProdutoInput) => Promise<void>
  /** Cancela e fecha o dialog sem salvar */
  onCancel?: () => void
}

export function OutroProdutoForm({
  defaultValues,
  onSubmit,
  onCancel,
}: OutroProdutoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // "outro produto" não tem unidade padrão — forçamos o usuário a escolher/digitar
  const [unidadeCustom, setUnidadeCustom] = useState(
    defaultValues?.unidade &&
      !UNIDADES_SUGERIDAS.find((u) => u.value === defaultValues.unidade)
      ? defaultValues.unidade
      : '',
  )

  const form = useForm<OutroProdutoInput>({
    resolver: zodResolver(outroProdutoSchema),
    defaultValues: {
      nome: defaultValues?.nome ?? '',
      unidade: defaultValues?.unidade ?? '',
      // NaN como sentinela de "campo não preenchido" — o input renderiza vazio
      preco_unitario: defaultValues?.preco_unitario ?? NaN,
      descricao: defaultValues?.descricao ?? '',
    },
  })

  async function handleSubmit(data: OutroProdutoInput) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ao selecionar unidade pré-definida, limpa o campo de texto livre
  function handleUnidadeSelect(value: string) {
    setUnidadeCustom('')
    form.setValue('unidade', value, { shouldValidate: true })
  }

  // Ao digitar unidade customizada, limpa a seleção do select
  function handleUnidadeCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setUnidadeCustom(val)
    form.setValue('unidade', val, { shouldValidate: true })
  }

  const unidadeAtual = form.watch('unidade')
  const unidadeNoSelect = UNIDADES_SUGERIDAS.find(
    (u) => u.value === unidadeAtual,
  )?.value

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <EditorialInput
                  label="Nome do Produto"
                  placeholder="Ex: Prego 17×21, Parafuso Chipboard 4×40"
                  error={fieldState.error?.message}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Unidade aceita opções pré-definidas OU texto livre — o carpinteiro pode
            ver unidades não convencionais (ex: "fardo", "rolo") */}
        <FormField
          control={form.control}
          name="unidade"
          render={({ fieldState }) => (
            <FormItem>
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-secondary">
                  Unidade de Medida
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Select para unidades comuns */}
                  <Select
                    value={unidadeNoSelect ?? ''}
                    onValueChange={handleUnidadeSelect}
                  >
                    <SelectTrigger className="input-editorial h-[46px] text-sm">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES_SUGERIDAS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Input livre para unidades não listadas */}
                  <EditorialInput
                    label=""
                    placeholder="Ou digite (ex: fardo)"
                    value={unidadeCustom}
                    onChange={handleUnidadeCustomChange}
                  />
                </div>
                {fieldState.error && (
                  <p className="text-xs text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preco_unitario"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <EditorialInput
                  label="Preço Unitário (R$)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  error={fieldState.error?.message}
                  // Number.isFinite filtra NaN (campo vazio) e exibe apenas números válidos
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
          name="descricao"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <EditorialInput
                  label="Descrição (opcional)"
                  placeholder="Detalhe o produto para o carpinteiro"
                  error={fieldState.error?.message}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end pt-1">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
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

export default OutroProdutoForm
