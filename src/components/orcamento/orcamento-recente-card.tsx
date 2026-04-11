import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { StatusChip } from '@/components/ui/status-chip'
import { ROUTES } from '@/constants/routes'
import type { Orcamento } from '@/types/orcamento'

type OrcamentoResumo = Pick<
  Orcamento,
  'id' | 'nome' | 'cliente_nome' | 'status' | 'total' | 'created_at'
>

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  orcamento: OrcamentoResumo
}

export default function OrcamentoRecenteCard({ orcamento }: Props) {
  return (
    <Link
      to={ROUTES.CARPINTEIRO_ORCAMENTO(orcamento.id)}
      className="flex items-center gap-4 px-4 py-3.5 rounded-lg bg-surface-container-highest transition-all duration-200 hover:translate-x-1 hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Icon container */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-primary font-black text-xs uppercase">
          {orcamento.nome.charAt(0)}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-on-surface leading-tight truncate">
          {orcamento.nome}
        </p>
        <p className="text-xs text-on-surface-variant truncate mt-0.5">{orcamento.cliente_nome}</p>
      </div>

      {/* Status + price */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusChip status={orcamento.status} />
        <span className="text-xs font-black tabular-nums text-on-surface tracking-tighter">
          {BRL.format(orcamento.total)}
        </span>
      </div>

      <ArrowRight className="h-4 w-4 text-on-surface-variant shrink-0" />
    </Link>
  )
}
