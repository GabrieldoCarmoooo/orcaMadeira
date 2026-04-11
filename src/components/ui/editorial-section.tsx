import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EditorialSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Asymmetric editorial grid: 4-col title/description + 8-col content.
 * Matches the "Editorial Wood-Block" layout from the Master's Atelier design spec.
 */
export function EditorialSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: EditorialSectionProps) {
  return (
    <section className={cn('grid grid-cols-1 md:grid-cols-12 gap-8', className)}>
      <div className="md:col-span-4">
        <h2 className="text-2xl font-bold tracking-tighter text-on-surface leading-none mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-sm font-medium text-on-surface-variant">{description}</p>
        )}
      </div>
      <div className={cn('md:col-span-8', contentClassName)}>{children}</div>
    </section>
  )
}

export default EditorialSection
