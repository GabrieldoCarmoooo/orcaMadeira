import { LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

const ROUTE_LABELS: Record<string, string> = {
  [ROUTES.CARPINTEIRO_DASHBOARD]: 'Dashboard',
  [ROUTES.CARPINTEIRO_ORCAMENTOS]: 'Orçamentos',
  [ROUTES.CARPINTEIRO_VINCULACAO]: 'Vinculação',
  [ROUTES.CARPINTEIRO_PERFIL]: 'Perfil',
  [ROUTES.MADEIREIRA_DASHBOARD]: 'Dashboard',
  [ROUTES.MADEIREIRA_PRECOS]: 'Tabela de Preços',
  [ROUTES.MADEIREIRA_PARCEIROS]: 'Parceiros',
  [ROUTES.MADEIREIRA_PERFIL]: 'Perfil',
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const { logout, isLoading } = useAuth()
  const title = ROUTE_LABELS[pathname] ?? 'OrçaMadeira'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between glass-header shadow-tinted px-4 sticky top-0 z-20">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        disabled={isLoading}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    </header>
  )
}
