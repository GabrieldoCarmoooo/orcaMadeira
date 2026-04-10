import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { OrcamentoStatus } from '@/types/common'
import type { Orcamento } from '@/types/orcamento'

type OrcamentoResumo = Pick<
  Orcamento,
  'id' | 'nome' | 'cliente_nome' | 'status' | 'total' | 'created_at'
>

const STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
  enviado: 'Enviado',
}

const STATUS_CLASS: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-accent/20 text-accent-foreground',
  finalizado: 'bg-primary/15 text-primary',
  enviado: 'bg-secondary/15 text-secondary',
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATE_FMT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

interface Props {
  orcamento: OrcamentoResumo
}

export default function OrcamentoRecenteCard({ orcamento }: Props) {
  return (
    <Link
      to={ROUTES.CARPINTEIRO_ORCAMENTO(orcamento.id)}
      className="flex items-center justify-between gap-4 rounded-lg bg-card px-4 py-3 transition-colors shadow-tinted hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium leading-tight">{orcamento.nome}</p>
        <p className="truncate text-xs text-muted-foreground">{orcamento.cliente_nome}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
            STATUS_CLASS[orcamento.status],
          )}
        >
          {STATUS_LABEL[orcamento.status]}
        </span>
        <span className="text-xs font-medium tabular-nums">{BRL.format(orcamento.total)}</span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          {DATE_FMT.format(new Date(orcamento.created_at))}
        </span>
      </div>
    </Link>
  )
}
