import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sofa, TreePine, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import type { TipoProjeto } from '@/types/common'

const stepProjetoSchema = z.object({
  tipo_projeto: z.enum(['movel', 'estrutura']),
  nome: z.string().min(1, 'Nome do projeto é obrigatório'),
  descricao: z.string(),
  cliente_nome: z.string().min(1, 'Nome do cliente é obrigatório'),
  cliente_telefone: z.string(),
  cliente_email: z
    .string()
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'E-mail inválido',
    }),
})

type StepProjetoFormData = z.infer<typeof stepProjetoSchema>

interface StepProjetoProps {
  onNext: () => void
}

const TIPO_OPTIONS: { value: TipoProjeto; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: 'movel',
    label: 'Móveis',
    icon: Sofa,
    description: 'Armários, mesas, cozinhas planejadas',
  },
  {
    value: 'estrutura',
    label: 'Estruturas',
    icon: TreePine,
    description: 'Telhados, pergolados, decks',
  },
]

export function StepProjeto({ onNext }: StepProjetoProps) {
  // Selectors granulares: re-render apenas quando stepProjeto muda, não o store inteiro
  const stepProjeto = useOrcamentoStore(s => s.stepProjeto)
  const setStepProjeto = useOrcamentoStore(s => s.setStepProjeto)
  const setStep = useOrcamentoStore(s => s.setStep)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StepProjetoFormData>({
    resolver: zodResolver(stepProjetoSchema),
    defaultValues: stepProjeto,
  })

  const tipoProjeto = watch('tipo_projeto')

  function onSubmit(data: StepProjetoFormData) {
    setStepProjeto(data)
    setStep(2)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Tipo de projeto */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">
          Tipo de projeto <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {TIPO_OPTIONS.map(({ value, label, icon: Icon, description }) => {
            const selected = tipoProjeto === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('tipo_projeto', value, { shouldValidate: true })}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-[16px] p-4 text-left transition-all',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                <Icon
                  className={cn(
                    'size-6',
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
        <input type="hidden" {...register('tipo_projeto')} />
        {errors.tipo_projeto && (
          <p className="text-xs text-destructive">{errors.tipo_projeto.message}</p>
        )}
      </div>

      {/* Dados do projeto */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Projeto
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="nome">
            Nome do projeto <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            placeholder="Ex: Cozinha planejada sala principal"
            aria-invalid={!!errors.nome}
            {...register('nome')}
          />
          {errors.nome && (
            <p className="text-xs text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            placeholder="Detalhes adicionais (opcional)"
            {...register('descricao')}
          />
        </div>
      </div>

      {/* Dados do cliente */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cliente
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="cliente_nome">
            Nome do cliente <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cliente_nome"
            placeholder="Ex: João Silva"
            aria-invalid={!!errors.cliente_nome}
            {...register('cliente_nome')}
          />
          {errors.cliente_nome && (
            <p className="text-xs text-destructive">{errors.cliente_nome.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cliente_telefone">Telefone</Label>
          <Input
            id="cliente_telefone"
            type="tel"
            placeholder="(00) 00000-0000"
            {...register('cliente_telefone')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cliente_email">E-mail</Label>
          <Input
            id="cliente_email"
            type="email"
            placeholder="cliente@email.com"
            aria-invalid={!!errors.cliente_email}
            {...register('cliente_email')}
          />
          {errors.cliente_email && (
            <p className="text-xs text-destructive">{errors.cliente_email.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Próximo
        <ArrowRight />
      </Button>
    </form>
  )
}
