import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppSidebar from '@/components/layout/app-sidebar'
import AppHeader from '@/components/layout/app-header'
import PageWrapper from '@/components/layout/page-wrapper'
import type { UserRole } from '@/types/common'

interface DashboardLayoutProps {
  role: UserRole
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </div>
    </div>
  )
}
