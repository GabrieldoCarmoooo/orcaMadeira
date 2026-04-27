import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { validarCpfCnpj } from '@/lib/validar-cpf-cnpj'
import { logError } from '@/lib/log-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LogoUploader from '@/components/shared/logo-uploader'

const perfilMadeireiraSchema = z.object({
  razao_social: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  cnpj: z
    .string()
    .refine(
      (v) => validarCpfCnpj(v) && v.replace(/\D/g, '').length === 14,
      'CNPJ inválido',
    ),
  telefone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
  endereco: z.string().min(5, 'Endereço muito curto'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
})

type PerfilFormValues = z.infer<typeof perfilMadeireiraSchema>

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  )
}

export default function MadeireiraPerfilPage() {
  const { madeireira } = useAuthStore()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilMadeireiraSchema),
    defaultValues: {
      razao_social: '',
      cnpj: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
    },
  })

  // Pre-fill form when madeireira data is available
  useEffect(() => {
    if (!madeireira) return
    reset({
      razao_social: madeireira.razao_social,
      cnpj: madeireira.cnpj,
      telefone: madeireira.telefone,
      endereco: madeireira.endereco,
      cidade: madeireira.cidade,
      estado: madeireira.estado,
    })
    setLogoUrl(madeireira.logo_url)
  }, [madeireira, reset])

  async function onSubmit(values: PerfilFormValues) {
    if (!madeireira) return
    setSaveSuccess(false)

    try {
      const { error } = await supabase
        .from('madeireiras')
        .update({ ...values, logo_url: logoUrl })
        .eq('id', madeireira.id)

      if (error) throw error

      // Refresh auth store to reflect saved changes
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await useAuthStore.getState().setSession(session)

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      logError('perfil-madeireira/handleSubmit', err)
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('root', { message: `Erro ao salvar: ${message}` })
    }
  }

  if (!madeireira) {
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
          Gerencie os dados da sua madeireira
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
            userId={madeireira.user_id}
            onUploadSuccess={(url) => setLogoUrl(url || null)}
            disabled={isSubmitting}
          />
        </section>

        {/* ── Dados da empresa ── */}
        <section className="space-y-4">
          <SectionTitle>Dados da empresa</SectionTitle>

          <div className="space-y-1.5">
            <Label htmlFor="razao_social">Razão Social</Label>
            <Input
              id="razao_social"
              placeholder="Madeireira Silva LTDA"
              aria-invalid={!!errors.razao_social}
              {...register('razao_social')}
            />
            {errors.razao_social && (
              <p className="text-xs text-destructive">{errors.razao_social.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0001-00"
                aria-invalid={!!errors.cnpj}
                {...register('cnpj')}
              />
              {errors.cnpj && (
                <p className="text-xs text-destructive">{errors.cnpj.message}</p>
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
              placeholder="Av. das Madeiras, 500"
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

        {/* ── Actions ── */}
        <div className="flex justify-end border-t border-border pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || (!isDirty && logoUrl === madeireira.logo_url)}
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
