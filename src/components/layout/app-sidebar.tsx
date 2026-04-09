import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Link2,
  User,
  Tag,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/types/common'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const CARPINTEIRO_NAV: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.CARPINTEIRO_DASHBOARD, icon: LayoutDashboard },
  { label: 'Orçamentos', href: ROUTES.CARPINTEIRO_ORCAMENTOS, icon: FileText },
  { label: 'Vinculação', href: ROUTES.CARPINTEIRO_VINCULACAO, icon: Link2 },
  { label: 'Perfil', href: ROUTES.CARPINTEIRO_PERFIL, icon: User },
]

const MADEIREIRA_NAV: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.MADEIREIRA_DASHBOARD, icon: LayoutDashboard },
  { label: 'Tabela de Preços', href: ROUTES.MADEIREIRA_PRECOS, icon: Tag },
  { label: 'Parceiros', href: ROUTES.MADEIREIRA_PARCEIROS, icon: Users },
  { label: 'Perfil', href: ROUTES.MADEIREIRA_PERFIL, icon: User },
]

interface AppSidebarProps {
  role: UserRole
  open: boolean
  onClose: () => void
}

export default function AppSidebar({ role, open, onClose }: AppSidebarProps) {
  const navItems = role === 'carpinteiro' ? CARPINTEIRO_NAV : MADEIREIRA_NAV
  const roleLabel = role === 'carpinteiro' ? 'Carpinteiro / Marceneiro' : 'Madeireira'

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <span className="text-sm font-semibold text-sidebar-foreground">
            OrçaMadeira
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {navItems.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <NavLink
                  to={href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    )
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
          <p className="text-xs text-sidebar-foreground/50">{roleLabel}</p>
        </div>
      </aside>
    </>
  )
}
