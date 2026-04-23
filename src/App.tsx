import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import AuthGuard from '@/components/layout/auth-guard'
import DashboardLayout from '@/components/layout/dashboard-layout'

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/login-page'))
const RegisterPage = lazy(() => import('@/pages/auth/register-page'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password-page'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password-page'))

// Carpinteiro pages
const CarpinteiroDashboardPage = lazy(() => import('@/pages/carpinteiro/dashboard-page'))
const CarpinteiroPerfilPage = lazy(() => import('@/pages/carpinteiro/perfil-page'))
const CarpinteiroVinculacaoPage = lazy(() => import('@/pages/carpinteiro/vinculacao-page'))
const CarpinteiroOrcamentosPage = lazy(() => import('@/pages/carpinteiro/orcamentos-page'))
const CarpinteiroNovoOrcamentoPage = lazy(() => import('@/pages/carpinteiro/novo-orcamento-page'))
const CarpinteiroOrcamentoDetalhePage = lazy(() => import('@/pages/carpinteiro/orcamento-detalhe-page'))
const CarpinteiroEditarOrcamentoPage = lazy(() => import('@/pages/carpinteiro/editar-orcamento-page'))
const CarpinteiroCatalogoPage = lazy(() => import('@/pages/carpinteiro/catalogo-page'))
const CarpinteiroPropostaPage = lazy(() => import('@/pages/carpinteiro/proposta-page'))

// Madeireira pages
const MadeireiraDashboardPage = lazy(() => import('@/pages/madeireira/dashboard-page'))
const MadeireiraPerfilPage = lazy(() => import('@/pages/madeireira/perfil-page'))
const MadeireiraPrecosPage = lazy(() => import('@/pages/madeireira/precos-page'))
const MadeireiraParceirosPage = lazy(() => import('@/pages/madeireira/parceiros-page'))

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
)

/**
 * Bootstraps auth state on mount.
 * onAuthStateChange is the single source of truth — all session changes go through setSession.
 */
function AuthInitializer({ children }: { children: ReactNode }) {
  const { setSession, isInitialized } = useAuthStore()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  if (!isInitialized) return <PageLoader />

  return <>{children}</>
}

/** Redirects to the correct dashboard based on role, or to /login if not authenticated. */
function RootRedirect() {
  const { role, isLoading, isInitialized } = useAuthStore()

  if (!isInitialized || isLoading) return <PageLoader />
  if (role === 'carpinteiro') return <Navigate to={ROUTES.CARPINTEIRO_DASHBOARD} replace />
  if (role === 'madeireira') return <Navigate to={ROUTES.MADEIREIRA_DASHBOARD} replace />
  return <Navigate to={ROUTES.LOGIN} replace />
}

export default function App() {
  return (
    <AuthInitializer>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root — redirects based on auth state and role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public auth routes */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

          {/* Carpinteiro — requires role "carpinteiro" */}
          <Route element={<AuthGuard requiredRole="carpinteiro" />}>
            <Route element={<DashboardLayout role="carpinteiro" />}>
              <Route path={ROUTES.CARPINTEIRO_DASHBOARD} element={<CarpinteiroDashboardPage />} />
              <Route path={ROUTES.CARPINTEIRO_PERFIL} element={<CarpinteiroPerfilPage />} />
              <Route path={ROUTES.CARPINTEIRO_VINCULACAO} element={<CarpinteiroVinculacaoPage />} />
              <Route path={ROUTES.CARPINTEIRO_ORCAMENTOS} element={<CarpinteiroOrcamentosPage />} />
              <Route path={ROUTES.CARPINTEIRO_CATALOGO} element={<CarpinteiroCatalogoPage />} />
              <Route path={ROUTES.CARPINTEIRO_NOVO_ORCAMENTO} element={<CarpinteiroNovoOrcamentoPage />} />
              <Route path="/carpinteiro/orcamentos/:id/editar" element={<CarpinteiroEditarOrcamentoPage />} />
              <Route path="/carpinteiro/orcamentos/:id/proposta" element={<CarpinteiroPropostaPage />} />
              <Route path="/carpinteiro/orcamentos/:id" element={<CarpinteiroOrcamentoDetalhePage />} />
            </Route>
          </Route>

          {/* Madeireira — requires role "madeireira" */}
          <Route element={<AuthGuard requiredRole="madeireira" />}>
            <Route element={<DashboardLayout role="madeireira" />}>
              <Route path={ROUTES.MADEIREIRA_DASHBOARD} element={<MadeireiraDashboardPage />} />
              <Route path={ROUTES.MADEIREIRA_PERFIL} element={<MadeireiraPerfilPage />} />
              <Route path={ROUTES.MADEIREIRA_PRECOS} element={<MadeireiraPrecosPage />} />
              <Route path={ROUTES.MADEIREIRA_PRECOS_NOVO} element={<MadeireiraPrecosPage />} />
              <Route path={ROUTES.MADEIREIRA_PARCEIROS} element={<MadeireiraParceirosPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </Suspense>
    </AuthInitializer>
  )
}
