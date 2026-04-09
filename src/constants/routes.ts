export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Carpinteiro
  CARPINTEIRO_DASHBOARD: '/carpinteiro/dashboard',
  CARPINTEIRO_PERFIL: '/carpinteiro/perfil',
  CARPINTEIRO_VINCULACAO: '/carpinteiro/vinculacao',
  CARPINTEIRO_ORCAMENTOS: '/carpinteiro/orcamentos',
  CARPINTEIRO_NOVO_ORCAMENTO: '/carpinteiro/orcamentos/novo',
  CARPINTEIRO_ORCAMENTO: (id: string) => `/carpinteiro/orcamentos/${id}`,
  CARPINTEIRO_ORCAMENTO_EDITAR: (id: string) => `/carpinteiro/orcamentos/${id}/editar`,

  // Madeireira
  MADEIREIRA_DASHBOARD: '/madeireira/dashboard',
  MADEIREIRA_PERFIL: '/madeireira/perfil',
  MADEIREIRA_PRECOS: '/madeireira/precos',
  MADEIREIRA_PRECOS_NOVO: '/madeireira/precos/novo',
  MADEIREIRA_PARCEIROS: '/madeireira/parceiros',
} as const
