import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/types/common'

interface AuthGuardProps {
  requiredRole: UserRole
}

/**
 * Protects routes by role.
 * Reads from the auth store (initialized by AuthInitializer in App.tsx).
 * Redirects to /login if unauthenticated, or to the correct dashboard if role mismatches.
 */
export default function AuthGuard({ requiredRole }: AuthGuardProps) {
  const { user, role, isLoading, isInitialized } = useAuthStore()

  // Store not yet initialized — AuthInitializer in App.tsx handles the global loader,
  // but guard against edge cases here.
  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  if (role !== requiredRole) {
    if (role === 'carpinteiro') return <Navigate to={ROUTES.CARPINTEIRO_DASHBOARD} replace />
    if (role === 'madeireira') return <Navigate to={ROUTES.MADEIREIRA_DASHBOARD} replace />
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}
