import { Menu, LogOut } from 'lucide-react'
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

interface AppHeaderProps {
  onMenuClick: () => void
}

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { pathname } = useLocation()
  const { logout, isLoading } = useAuth()
  const title = ROUTE_LABELS[pathname] ?? 'OrçaMadeira'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-medium text-foreground">{title}</h1>
      </div>

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
