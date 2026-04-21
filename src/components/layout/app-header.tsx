import { Bell, LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'

const ROUTE_LABELS: Record<string, string> = {
  [ROUTES.CARPINTEIRO_DASHBOARD]: 'Painel de Controle',
  [ROUTES.CARPINTEIRO_CATALOGO]: 'Catálogo',
  [ROUTES.CARPINTEIRO_ORCAMENTOS]: 'Orçamentos',
  [ROUTES.CARPINTEIRO_VINCULACAO]: 'Vinculação',
  [ROUTES.CARPINTEIRO_PERFIL]: 'Ajustes de Marca',
  [ROUTES.CARPINTEIRO_NOVO_ORCAMENTO]: 'Projeto Atual',
  [ROUTES.MADEIREIRA_DASHBOARD]: 'Painel de Controle',
  [ROUTES.MADEIREIRA_PRECOS]: 'Tabela de Preços',
  [ROUTES.MADEIREIRA_PARCEIROS]: 'Parceiros',
  [ROUTES.MADEIREIRA_PERFIL]: 'Configurações',
}

function getInitials(nome?: string): string {
  if (!nome) return 'U'
  const parts = nome.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'U'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const { logout, isLoading } = useAuth()
  const { carpinteiro, madeireira } = useAuthStore()

  const nome = carpinteiro?.nome ?? madeireira?.razao_social
  const logoUrl = carpinteiro?.logo_url ?? null
  const initials = getInitials(nome)

  // Match exact or prefix (for dynamic routes like /orcamentos/:id)
  const title =
    ROUTE_LABELS[pathname] ??
    Object.entries(ROUTE_LABELS).find(([key]) => pathname.startsWith(key))?.[1] ??
    'OrçaMadeira'

  return (
    <header className="glass-header shadow-tinted sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between px-4 border-b border-outline-variant/10">
      {/* Avatar + title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-black text-sm overflow-hidden shadow-sm shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={nome} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <h1 className="text-base font-bold tracking-tight text-primary leading-none">
          {title}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-primary/10 h-9 w-9"
          aria-label="Notificações"
        >
          <Bell size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          disabled={isLoading}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline text-xs">Sair</span>
        </Button>
      </div>
    </header>
  )
}
