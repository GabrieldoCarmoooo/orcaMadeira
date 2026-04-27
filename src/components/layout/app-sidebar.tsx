import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CARPINTEIRO_NAV, MADEIREIRA_NAV } from '@/constants/nav-items'
import type { UserRole } from '@/types/common'

interface AppSidebarProps {
  userRole: UserRole
}

export default function AppSidebar({ userRole }: AppSidebarProps) {
  const navItems = userRole === 'carpinteiro' ? CARPINTEIRO_NAV : MADEIREIRA_NAV
  const roleLabel = userRole === 'carpinteiro' ? 'Carpinteiro / Marceneiro' : 'Madeireira'

  return (
    <aside className="hidden lg:flex w-60 flex-col bg-sidebar border-r border-outline-variant/10">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center px-5">
        <span className="text-base font-black tracking-tight text-primary">
          Orça<span className="text-secondary">Madeira</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <NavLink
                to={href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary border-l-4 border-primary pl-2'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground border-l-4 border-transparent pl-2',
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
      <div className="shrink-0 px-5 py-4 border-t border-outline-variant/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {roleLabel}
        </p>
      </div>
    </aside>
  )
}
