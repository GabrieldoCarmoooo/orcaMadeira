import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  acabamentoSchema,
  type AcabamentoInput,
} from '@/lib/schemas/acabamento-schema'
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { EditorialInput } from '@/components/ui/editorial-input'
import { Button } from '@/components/ui/button'

interface AcabamentoFormProps {
  /** Valores iniciais — presentes no modo edição, ausentes no modo criação */
  defaultValues?: Partial<AcabamentoInput>
  /** Callback chamado com os dados validados ao submeter */
  onSubmit: (data: AcabamentoInput) => Promise<void>
  /** Cancela e fecha o dialog sem salvar */
  onCancel?: () => void
}

export function AcabamentoForm({
  defaultValues,
  onSubmit,
  onCancel,
}: AcabamentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AcabamentoInput>({
    resolver: zodResolver(acabamentoSchema),
    defaultValues: {
      nome: defaultValues?.nome ?? '',
      // NaN como sentinela de "campo não preenchido" — o input renderiza vazio
      percentual_acrescimo: defaultValues?.percentual_acrescimo ?? NaN,
    },
  })

  async function handleSubmit(data: AcabamentoInput) {
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
                  label="Nome do Acabamento"
                  placeholder="Ex: Lixamento, Aparelhado, Verniz"
                  error={fieldState.error?.message}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Percentual de acréscimo sobre o preço base da madeira m³.
            Aceita 0 (sem acréscimo), nunca negativo. */}
        <FormField
          control={form.control}
          name="percentual_acrescimo"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <EditorialInput
                  label="Acréscimo (%)"
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

export default AcabamentoForm
