import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos.'
  if (message.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.'
  if (message.includes('Too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.'
  return 'Ocorreu um erro. Tente novamente.'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, role, isInitialized } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (!isInitialized) return
    if (role === 'carpinteiro') navigate(ROUTES.CARPINTEIRO_DASHBOARD, { replace: true })
    if (role === 'madeireira') navigate(ROUTES.MADEIREIRA_DASHBOARD, { replace: true })
  }, [isInitialized, role, navigate])

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password)
      // Redirect handled by the useEffect above watching role changes
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('root', { message: mapAuthError(message) })
    }
  }

  const busy = isSubmitting || isLoading

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">OrçaMadeira</h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Root error (invalid credentials etc.) */}
          {errors.root && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Esqueci a senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
