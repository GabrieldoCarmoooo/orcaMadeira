import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CARPINTEIRO_NAV, MADEIREIRA_NAV } from '@/constants/nav-items'
import type { UserRole } from '@/types/common'

interface BottomNavProps {
  userRole: UserRole
}

export default function BottomNav({ userRole }: BottomNavProps) {
  const navItems = userRole === 'carpinteiro' ? CARPINTEIRO_NAV : MADEIREIRA_NAV

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden glass-header border-t border-outline-variant/10 shadow-[0_-4px_6px_-1px_rgba(157,66,43,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center">
        {navItems.map(({ label, href, icon: Icon }) => (
          <li key={href} className="flex-1">
            <NavLink
              to={href}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-1 px-1 py-2.5 text-center transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator dot above icon */}
                  <span
                    className={cn(
                      'absolute top-1 h-1 w-4 rounded-full transition-all duration-200',
                      isActive ? 'bg-primary-container' : 'bg-transparent',
                    )}
                  />
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className="text-[9px] font-bold uppercase tracking-wide leading-none">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
