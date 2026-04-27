import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Hammer, Building2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { logError } from '@/lib/log-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
    role: z.enum(['carpinteiro', 'madeireira']),
    nome: z.string().min(2, 'Mínimo 2 caracteres'),
    cpf_cnpj: z.string().min(11, 'CPF ou CNPJ inválido'),
    telefone: z.string().min(10, 'Telefone inválido'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

function mapAuthError(message: string): string {
  if (message.includes('User already registered')) return 'Este email já está cadastrado.'
  if (message.includes('already been registered')) return 'Este email já está cadastrado.'
  if (message.includes('duplicate key') && message.includes('cnpj')) return 'Este CNPJ já está cadastrado.'
  if (message.includes('duplicate key') && message.includes('cpf_cnpj'))
    return 'Este CPF/CNPJ já está cadastrado.'
  if (message.includes('Too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.'
  if (message.includes('Password should be')) return 'A senha não atende os requisitos mínimos.'
  return 'Ocorreu um erro. Tente novamente.'
}

const ROLE_OPTIONS = [
  {
    value: 'carpinteiro' as const,
    label: 'Carpinteiro / Marceneiro',
    description: 'Crio orçamentos para meus clientes',
    icon: Hammer,
  },
  {
    value: 'madeireira' as const,
    label: 'Madeireira',
    description: 'Forneço produtos e preços',
    icon: Building2,
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { role: currentRole, isInitialized } = useAuth()
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'carpinteiro' },
  })

  const selectedRole = watch('role')

  // Redirect if already authenticated
  useEffect(() => {
    if (!isInitialized) return
    if (currentRole === 'carpinteiro') navigate(ROUTES.CARPINTEIRO_DASHBOARD, { replace: true })
    if (currentRole === 'madeireira') navigate(ROUTES.MADEIREIRA_DASHBOARD, { replace: true })
  }, [isInitialized, currentRole, navigate])

  async function onSubmit(values: RegisterFormValues) {
    try {
      // 1. Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (error) throw error
      if (!data.user) throw new Error('Erro ao criar conta.')

      // Email confirmation required — can't insert profile without session.
      // Persiste dados do perfil na sessão atual para setSession completar o insert após confirmação.
      // sessionStorage é preferido ao localStorage: limpa ao fechar a aba e é menos exposto a XSS.
      if (!data.session) {
        sessionStorage.setItem(
          'pending_profile',
          JSON.stringify({
            userId: data.user.id,
            role: values.role,
            nome: values.nome,
            cpf_cnpj: values.cpf_cnpj,
            telefone: values.telefone,
          }),
        )
        setEmailSent(true)
        return
      }

      // 2. Insert profile record
      if (values.role === 'carpinteiro') {
        const { error: insertError } = await supabase.from('carpinteiros').insert({
          user_id: data.user.id,
          nome: values.nome,
          cpf_cnpj: values.cpf_cnpj,
          telefone: values.telefone,
          endereco: '',
          cidade: '',
          estado: '',
        })
        if (insertError) throw insertError
      } else {
        const { error: insertError } = await supabase.from('madeireiras').insert({
          user_id: data.user.id,
          razao_social: values.nome,
          cnpj: values.cpf_cnpj,
          telefone: values.telefone,
          endereco: '',
          cidade: '',
          estado: '',
        })
        if (insertError) throw insertError
      }

      // 3. Refresh store — re-queries DB so role gets populated
      await useAuthStore.getState().setSession(data.session)
      // useEffect watching currentRole will trigger navigation
    } catch (err) {
      logError('register/handleSubmit', err)
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('root', { message: mapAuthError(message) })
    }
  }

  // Success state — email confirmation required
  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold">Verifique seu email</h2>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de confirmação para o seu email. Acesse-o para ativar sua conta.
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link to={ROUTES.LOGIN}>Ir para o login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">OrçaMadeira</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta gratuita</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => {
            const active = selectedRole === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value, { shouldValidate: true })}
                className={[
                  'flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                ].join(' ')}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium leading-tight">{label}</span>
                <span className="text-[11px] leading-tight opacity-70">{description}</span>
              </button>
            )
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Root error */}
          {errors.root && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome">
              {selectedRole === 'carpinteiro' ? 'Nome completo' : 'Razão Social'}
            </Label>
            <Input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder={
                selectedRole === 'carpinteiro' ? 'João da Silva' : 'Madeireira Silva LTDA'
              }
              aria-invalid={!!errors.nome}
              {...register('nome')}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          {/* CPF / CNPJ */}
          <div className="space-y-1.5">
            <Label htmlFor="cpf_cnpj">
              {selectedRole === 'carpinteiro' ? 'CPF ou CNPJ' : 'CNPJ'}
            </Label>
            <Input
              id="cpf_cnpj"
              type="text"
              placeholder={
                selectedRole === 'carpinteiro' ? '000.000.000-00' : '00.000.000/0001-00'
              }
              aria-invalid={!!errors.cpf_cnpj}
              {...register('cpf_cnpj')}
            />
            {errors.cpf_cnpj && (
              <p className="text-xs text-destructive">{errors.cpf_cnpj.message}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              type="tel"
              autoComplete="tel"
              placeholder="(00) 90000-0000"
              aria-invalid={!!errors.telefone}
              {...register('telefone')}
            />
            {errors.telefone && (
              <p className="text-xs text-destructive">{errors.telefone.message}</p>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
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
