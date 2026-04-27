import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { logError } from '@/lib/log-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

function mapAuthError(message: string): string {
  if (message.includes('Too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.'
  return 'Ocorreu um erro. Tente novamente.'
}

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading } = useAuth()
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await resetPassword(values.email)
      setEmailSent(true)
    } catch (err) {
      logError('forgot-password/handleSubmit', err)
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('root', { message: mapAuthError(message) })
    }
  }

  const busy = isSubmitting || isLoading

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold">Email enviado</h2>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de redefinição para{' '}
            <span className="font-medium text-foreground">{getValues('email')}</span>. Verifique
            sua caixa de entrada (e o spam).
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link to={ROUTES.LOGIN}>Voltar para o login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Esqueci a senha</h1>
          <p className="text-sm text-muted-foreground">
            Informe seu email para receber o link de redefinição
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {errors.root && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? 'Enviando…' : 'Enviar link de redefinição'}
          </Button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-muted-foreground">
          Lembrou a senha?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
