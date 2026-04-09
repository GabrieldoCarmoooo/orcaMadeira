import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/common'
import type { Carpinteiro } from '@/types/carpinteiro'
import type { Madeireira } from '@/types/madeireira'

interface AuthStore {
  // State
  user: User | null
  role: UserRole | null
  carpinteiro: Carpinteiro | null
  madeireira: Madeireira | null
  /** True while the initial session + role check is in progress. */
  isLoading: boolean
  /** True once the first auth check has completed (prevents flash of login page). */
  isInitialized: boolean

  // Actions
  setSession: (session: Session | null) => Promise<void>
  clearSession: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  carpinteiro: null,
  madeireira: null,
  isLoading: true,
  isInitialized: false,

  setSession: async (session) => {
    if (!session) {
      set({
        user: null,
        role: null,
        carpinteiro: null,
        madeireira: null,
        isLoading: false,
        isInitialized: true,
      })
      return
    }

    set({ isLoading: true })

    const userId = session.user.id

    // Role is determined by existing record in DB — not from JWT
    const { data: carpinteiroData } = await supabase
      .from('carpinteiros')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (carpinteiroData) {
      set({
        user: session.user,
        role: 'carpinteiro',
        carpinteiro: carpinteiroData as Carpinteiro,
        madeireira: null,
        isLoading: false,
        isInitialized: true,
      })
      return
    }

    const { data: madeireiraData } = await supabase
      .from('madeireiras')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (madeireiraData) {
      set({
        user: session.user,
        role: 'madeireira',
        carpinteiro: null,
        madeireira: madeireiraData as Madeireira,
        isLoading: false,
        isInitialized: true,
      })
      return
    }

    // Authenticated but no profile yet — check for pending registration data
    // (set when email confirmation interrupted the signup flow).
    const raw = localStorage.getItem('pending_profile')
    if (raw) {
      try {
        const pending = JSON.parse(raw) as {
          userId: string
          role: 'carpinteiro' | 'madeireira'
          nome: string
          cpf_cnpj: string
          telefone: string
        }

        if (pending.userId === userId) {
          if (pending.role === 'carpinteiro') {
            const { data: inserted, error } = await supabase
              .from('carpinteiros')
              .insert({
                user_id: userId,
                nome: pending.nome,
                cpf_cnpj: pending.cpf_cnpj,
                telefone: pending.telefone,
                endereco: '',
                cidade: '',
                estado: '',
              })
              .select()
              .single()

            if (!error && inserted) {
              localStorage.removeItem('pending_profile')
              set({
                user: session.user,
                role: 'carpinteiro',
                carpinteiro: inserted as Carpinteiro,
                madeireira: null,
                isLoading: false,
                isInitialized: true,
              })
              return
            }
          } else {
            const { data: inserted, error } = await supabase
              .from('madeireiras')
              .insert({
                user_id: userId,
                razao_social: pending.nome,
                cnpj: pending.cpf_cnpj,
                telefone: pending.telefone,
                endereco: '',
                cidade: '',
                estado: '',
              })
              .select()
              .single()

            if (!error && inserted) {
              localStorage.removeItem('pending_profile')
              set({
                user: session.user,
                role: 'madeireira',
                carpinteiro: null,
                madeireira: inserted as Madeireira,
                isLoading: false,
                isInitialized: true,
              })
              return
            }
          }
        }
      } catch {
        // Malformed data — ignore and fall through
        localStorage.removeItem('pending_profile')
      }
    }

    // Authenticated but genuinely has no profile
    set({
      user: session.user,
      role: null,
      carpinteiro: null,
      madeireira: null,
      isLoading: false,
      isInitialized: true,
    })
  },

  clearSession: async () => {
    await supabase.auth.signOut()
    set({
      user: null,
      role: null,
      carpinteiro: null,
      madeireira: null,
      isLoading: false,
      isInitialized: true,
    })
  },
}))
