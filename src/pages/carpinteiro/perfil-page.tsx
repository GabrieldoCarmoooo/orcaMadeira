import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { validarCpfCnpj } from '@/lib/validar-cpf-cnpj'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LogoUploader from '@/components/shared/logo-uploader'
import ConfiguracoesFinanceiras from '@/components/shared/configuracoes-financeiras'

const perfilCarpinteiroSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  cpf_cnpj: z.string().refine(validarCpfCnpj, 'CPF ou CNPJ inválido'),
  telefone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
  endereco: z.string().min(5, 'Endereço muito curto'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  margem_lucro_padrao: z.number().min(0).max(100),
  valor_hora_mao_obra: z.number().min(0),
  imposto_padrao: z.number().min(0).max(100),
})

type PerfilFormValues = z.infer<typeof perfilCarpinteiroSchema>

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  )
}

export default function CarpinteiroPerfilPage() {
  const { carpinteiro } = useAuthStore()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilCarpinteiroSchema),
    defaultValues: {
      nome: '',
      cpf_cnpj: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      margem_lucro_padrao: 20,
      valor_hora_mao_obra: 0,
      imposto_padrao: 0,
    },
  })

  // Pre-fill form when carpinteiro data is available
  useEffect(() => {
    if (!carpinteiro) return
    reset({
      nome: carpinteiro.nome,
      cpf_cnpj: carpinteiro.cpf_cnpj,
      telefone: carpinteiro.telefone,
      endereco: carpinteiro.endereco,
      cidade: carpinteiro.cidade,
      estado: carpinteiro.estado,
      margem_lucro_padrao: carpinteiro.margem_lucro_padrao,
      valor_hora_mao_obra: carpinteiro.valor_hora_mao_obra,
      imposto_padrao: carpinteiro.imposto_padrao,
    })
    setLogoUrl(carpinteiro.logo_url)
  }, [carpinteiro, reset])

  // ConfiguracoesFinanceiras integration
  const financeiroValue = {
    margem_lucro_padrao: watch('margem_lucro_padrao'),
    valor_hora_mao_obra: watch('valor_hora_mao_obra'),
    imposto_padrao: watch('imposto_padrao'),
  }

  function handleFinanceiroChange(v: typeof financeiroValue) {
    setValue('margem_lucro_padrao', v.margem_lucro_padrao, { shouldDirty: true })
    setValue('valor_hora_mao_obra', v.valor_hora_mao_obra, { shouldDirty: true })
    setValue('imposto_padrao', v.imposto_padrao, { shouldDirty: true })
  }

  async function onSubmit(values: PerfilFormValues) {
    if (!carpinteiro) return
    setSaveSuccess(false)

    try {
      const { error } = await supabase
        .from('carpinteiros')
        .update({ ...values, logo_url: logoUrl })
        .eq('id', carpinteiro.id)

      if (error) throw error

      // Refresh auth store to reflect saved changes
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await useAuthStore.getState().setSession(session)

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('root', { message: `Erro ao salvar: ${message}` })
    }
  }

  if (!carpinteiro) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus dados pessoais e configurações padrão
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* Root error */}
        {errors.root && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </div>
        )}

        {/* Success */}
        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Perfil salvo com sucesso.
          </div>
        )}

        {/* ── Logo ── */}
        <section className="space-y-3">
          <SectionTitle>Logo</SectionTitle>
          <LogoUploader
            currentUrl={logoUrl}
            userId={carpinteiro.user_id}
            onUploadSuccess={(url) => setLogoUrl(url || null)}
            disabled={isSubmitting}
          />
        </section>

        {/* ── Dados pessoais ── */}
        <section className="space-y-4">
          <SectionTitle>Dados pessoais</SectionTitle>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              placeholder="João da Silva"
              aria-invalid={!!errors.nome}
              {...register('nome')}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
              <Input
                id="cpf_cnpj"
                placeholder="000.000.000-00"
                aria-invalid={!!errors.cpf_cnpj}
                {...register('cpf_cnpj')}
              />
              {errors.cpf_cnpj && (
                <p className="text-xs text-destructive">{errors.cpf_cnpj.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(00) 90000-0000"
                aria-invalid={!!errors.telefone}
                {...register('telefone')}
              />
              {errors.telefone && (
                <p className="text-xs text-destructive">{errors.telefone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              placeholder="Rua das Madeiras, 100"
              aria-invalid={!!errors.endereco}
              {...register('endereco')}
            />
            {errors.endereco && (
              <p className="text-xs text-destructive">{errors.endereco.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                placeholder="São Paulo"
                aria-invalid={!!errors.cidade}
                {...register('cidade')}
              />
              {errors.cidade && (
                <p className="text-xs text-destructive">{errors.cidade.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                placeholder="SP"
                maxLength={2}
                className="uppercase"
                aria-invalid={!!errors.estado}
                {...register('estado', {
                  setValueAs: (v: string) => v.toUpperCase(),
                })}
              />
              {errors.estado && (
                <p className="text-xs text-destructive">{errors.estado.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Configurações financeiras ── */}
        <section className="space-y-4">
          <div>
            <SectionTitle>Configurações financeiras</SectionTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Valores usados como padrão ao criar um novo orçamento
            </p>
          </div>
          <ConfiguracoesFinanceiras
            value={financeiroValue}
            onChange={handleFinanceiroChange}
            disabled={isSubmitting}
          />
        </section>

        {/* ── Actions ── */}
        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={isSubmitting || (!isDirty && logoUrl === carpinteiro.logo_url)}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
