import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  )
}
