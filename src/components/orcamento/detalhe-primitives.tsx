import { cn } from '@/lib/utils'
import { BRL } from '@/lib/format'

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{children}</p>
  )
}

export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

export function FinancialLine({
  label,
  value,
  highlight,
  muted,
}: {
  label: string
  value: number
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span
        className={cn(
          muted
            ? 'text-sm text-muted-foreground'
            : highlight
              ? 'text-base font-bold text-foreground'
              : 'text-sm text-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          highlight
            ? 'text-xl font-bold text-primary'
            : muted
              ? 'text-sm text-muted-foreground'
              : 'text-sm font-semibold text-foreground',
        )}
      >
        {BRL.format(value)}
      </span>
    </div>
  )
}
