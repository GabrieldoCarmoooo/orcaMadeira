import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CARPINTEIRO_NAV, MADEIREIRA_NAV } from '@/constants/nav-items'
import type { UserRole } from '@/types/common'

interface AppSidebarProps {
  role: UserRole
}

export default function AppSidebar({ role }: AppSidebarProps) {
  const navItems = role === 'carpinteiro' ? CARPINTEIRO_NAV : MADEIREIRA_NAV
  const roleLabel = role === 'carpinteiro' ? 'Carpinteiro / Marceneiro' : 'Madeireira'

  return (
    <aside className="hidden lg:flex w-60 flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center px-4">
        <span className="text-sm font-semibold text-primary">
          OrçaMadeira
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <NavLink
                to={href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
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
      <div className="shrink-0 px-4 py-3">
        <p className="text-xs text-sidebar-foreground/50">{roleLabel}</p>
      </div>
    </aside>
  )
}
