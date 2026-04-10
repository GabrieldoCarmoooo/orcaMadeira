import { Outlet } from 'react-router-dom'
import AppSidebar from '@/components/layout/app-sidebar'
import AppHeader from '@/components/layout/app-header'
import PageWrapper from '@/components/layout/page-wrapper'
import BottomNav from '@/components/layout/bottom-nav'
import type { UserRole } from '@/types/common'

interface DashboardLayoutProps {
  role: UserRole
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </div>

      <BottomNav role={role} />
    </div>
  )
}
