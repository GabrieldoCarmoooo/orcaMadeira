import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'

/**
 * Auth hook — wraps the auth store and exposes all auth operations.
 * The store is updated reactively via onAuthStateChange (configured in App.tsx).
 */
export function useAuth() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    user,
    role,
    carpinteiro,
    madeireira,
    isLoading: storeLoading,
    isInitialized,
    clearSession,
  } = useAuthStore()

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // onAuthStateChange fires → setSession updates the store → AuthGuard redirects
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await clearSession()
    navigate(ROUTES.LOGIN, { replace: true })
  }, [clearSession, navigate])

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
      })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    role,
    carpinteiro,
    madeireira,
    isLoading: storeLoading || loading,
    isInitialized,
    login,
    logout,
    signUp,
    resetPassword,
  }
}
