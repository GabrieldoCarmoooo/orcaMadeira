import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { especieSchema, type EspecieInput } from '@/lib/schemas/especie-schema'
import { calcularValorVendaM3 } from '@/lib/calcular-madeira'
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { EditorialInput } from '@/components/ui/editorial-input'
import { Button } from '@/components/ui/button'

interface EspecieFormProps {
  /** Valores iniciais — presentes no modo edição, ausentes no modo criação */
  defaultValues?: Partial<EspecieInput> | undefined
  /** Callback chamado com os dados validados ao submeter */
  onSubmit: (data: EspecieInput) => Promise<void>
  /** Cancela e fecha o dialog sem salvar */
  onCancel?: () => void
}

// Formata número como moeda BRL com 2 casas decimais
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function EspecieForm({ defaultValues, onSubmit, onCancel }: EspecieFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EspecieInput>({
    resolver: zodResolver(especieSchema),
    defaultValues: {
      nome: defaultValues?.nome ?? '',
      // NaN como sentinela de "campo não preenchido" — o input renderiza vazio
      custo_m3: defaultValues?.custo_m3 ?? NaN,
      margem_lucro_pct: defaultValues?.margem_lucro_pct ?? 0,
    },
  })

  // Preview ao vivo do preço de venda calculado a partir de custo + margem.
  // Só exibe quando custo > 0 e ambos são números finitos (não NaN).
  const [custo, margem] = form.watch(['custo_m3', 'margem_lucro_pct'])
  const precoVenda =
    Number.isFinite(custo) && custo > 0 && Number.isFinite(margem)
      ? calcularValorVendaM3(custo, margem)
      : null

  async function handleSubmit(data: EspecieInput) {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  label="Nome da Espécie"
                  placeholder="Ex: Cambará, Pinus, Eucalipto"
                  error={fieldState.error?.message}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="custo_m3"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <EditorialInput
                    label="Custo/m³ (R$)"
                    type="number"
                    step="0.01"
                    min="0.01"
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
            name="margem_lucro_pct"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <EditorialInput
                    label="Margem de Lucro (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    error={fieldState.error?.message}
                    // Number.isFinite(0) = true, então 0 é exibido corretamente no campo
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

        {/* Preview do preço de venda — derivado, nunca armazenado na espécie */}
        {precoVenda !== null && (
          <div className="bg-surface-container-highest rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Preço de venda/m³
            </span>
            <span className="text-base font-semibold text-primary">
              {formatBRL(precoVenda)}
            </span>
          </div>
        )}

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

export default EspecieForm
