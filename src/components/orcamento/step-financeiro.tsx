import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CheckCheck, Clock, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'

const schema = z
  .object({
    mao_obra_tipo: z.enum(['fixo', 'hora']),
    mao_obra_valor: z
      .number({ error: 'Informe um valor' })
      .min(0, 'Valor deve ser positivo'),
    mao_obra_horas: z.number().nullable(),
    margem_lucro: z
      .number({ error: 'Informe a margem' })
      .min(0, 'Mínimo 0%')
      .max(100, 'Máximo 100%'),
    imposto: z
      .number({ error: 'Informe o imposto' })
      .min(0, 'Mínimo 0%')
      .max(100, 'Máximo 100%'),
    // Custos extras — inputs visuais adicionados em ISSUE-016; validação já disponível
    deslocamento: z
      .number({ error: 'Informe o deslocamento' })
      .min(0, 'Mínimo R$ 0'),
    custos_adicionais: z
      .number({ error: 'Informe os custos adicionais' })
      .min(0, 'Mínimo R$ 0'),
    validade_dias: z
      .number({ error: 'Informe a validade' })
      .int()
      .min(1, 'Mínimo 1 dia'),
    termos_condicoes: z.string(),
  })
  .refine(
    (data) =>
      data.mao_obra_tipo === 'fixo' ||
      (data.mao_obra_horas !== null && data.mao_obra_horas > 0),
    {
      message: 'Informe as horas estimadas',
      path: ['mao_obra_horas'],
    },
  )

type FormData = z.infer<typeof schema>

interface StepFinanceiroProps {
  onNext: () => void
  onBack: () => void
}

const MAO_OBRA_OPTIONS: { value: 'fixo' | 'hora'; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'fixo',
    label: 'Valor fixo',
    description: 'Preço total da mão de obra',
    icon: DollarSign,
  },
  {
    value: 'hora',
    label: 'Por hora',
    description: 'Valor/hora × horas estimadas',
    icon: Clock,
  },
]

export function StepFinanceiro({ onNext, onBack }: StepFinanceiroProps) {
  const { stepFinanceiro, setFinanceiro, setStep } = useOrcamentoStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...stepFinanceiro,
      mao_obra_horas: stepFinanceiro.mao_obra_horas ?? null,
      deslocamento: stepFinanceiro.deslocamento,
      custos_adicionais: stepFinanceiro.custos_adicionais,
    },
  })

  const maoObraTipo = watch('mao_obra_tipo')

  function onSubmit(data: FormData) {
    setFinanceiro({
      ...data,
      mao_obra_horas: data.mao_obra_tipo === 'hora' ? data.mao_obra_horas : null,
    })
    setStep(3)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Mão de obra tipo */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mão de obra
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MAO_OBRA_OPTIONS.map(({ value, label, description, icon: Icon }) => {
            const selected = maoObraTipo === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('mao_obra_tipo', value, { shouldValidate: true })}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-[16px] p-4 text-left transition-all',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    selected ? 'text-primary-foreground' : 'text-primary',
                  )}
                />
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      selected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
        <input type="hidden" {...register('mao_obra_tipo')} />
      </div>

      {/* Mão de obra valor */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mao_obra_valor">
            {maoObraTipo === 'hora' ? 'Valor por hora (R$)' : 'Valor total da mão de obra (R$)'}
            <span className="text-destructive"> *</span>
          </Label>
          <Input
            id="mao_obra_valor"
            type="number"
            min={0}
            step={0.01}
            placeholder="0,00"
            aria-invalid={!!errors.mao_obra_valor}
            {...register('mao_obra_valor', { valueAsNumber: true })}
          />
          {errors.mao_obra_valor && (
            <p className="text-xs text-destructive">{errors.mao_obra_valor.message}</p>
          )}
        </div>

        {maoObraTipo === 'hora' && (
          <div className="space-y-1.5">
            <Label htmlFor="mao_obra_horas">
              Horas estimadas <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mao_obra_horas"
              type="number"
              min={0.5}
              step={0.5}
              placeholder="Ex: 40"
              aria-invalid={!!errors.mao_obra_horas}
              {...register('mao_obra_horas', { valueAsNumber: true })}
            />
            {errors.mao_obra_horas && (
              <p className="text-xs text-destructive">{errors.mao_obra_horas.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Margem e Custos */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Margem e Custos
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="margem_lucro">
              Margem de lucro (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="margem_lucro"
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="Ex: 30"
              aria-invalid={!!errors.margem_lucro}
              {...register('margem_lucro', { valueAsNumber: true })}
            />
            {errors.margem_lucro && (
              <p className="text-xs text-destructive">{errors.margem_lucro.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imposto">
              Imposto (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="imposto"
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="Ex: 6"
              aria-invalid={!!errors.imposto}
              {...register('imposto', { valueAsNumber: true })}
            />
            {errors.imposto && (
              <p className="text-xs text-destructive">{errors.imposto.message}</p>
            )}
          </div>
        </div>

        {/* Custos extras integram o total mas não aparecem no PDF — regra de negócio */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="deslocamento">Deslocamento (R$)</Label>
            <Input
              id="deslocamento"
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              aria-invalid={!!errors.deslocamento}
              {...register('deslocamento', { valueAsNumber: true })}
            />
            {errors.deslocamento && (
              <p className="text-xs text-destructive">{errors.deslocamento.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custos_adicionais">Custos adicionais (R$)</Label>
            <Input
              id="custos_adicionais"
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              aria-invalid={!!errors.custos_adicionais}
              {...register('custos_adicionais', { valueAsNumber: true })}
            />
            {errors.custos_adicionais && (
              <p className="text-xs text-destructive">{errors.custos_adicionais.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Validade e termos */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Proposta
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="validade_dias">
            Validade do orçamento (dias) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="validade_dias"
            type="number"
            min={1}
            step={1}
            placeholder="Ex: 30"
            aria-invalid={!!errors.validade_dias}
            {...register('validade_dias', { valueAsNumber: true })}
          />
          {errors.validade_dias && (
            <p className="text-xs text-destructive">{errors.validade_dias.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="termos_condicoes">Termos e condições</Label>
          <textarea
            id="termos_condicoes"
            rows={3}
            placeholder="Condições de pagamento, prazo de entrega, etc. (opcional)"
            className={cn(
              'flex w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none',
              'focus-visible:border-b-2 focus-visible:border-primary resize-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            {...register('termos_condicoes')}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            setStep(2)
            onBack()
          }}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <Button type="submit" className="flex-1" size="lg">
          Revisar orçamento
          <CheckCheck className="size-4" />
        </Button>
      </div>
    </form>
  )
}
