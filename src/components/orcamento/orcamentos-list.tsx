import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  CircleDot,
  Check,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { BRL } from '@/lib/format'
import { ROUTES } from '@/constants/routes'
import { ORCAMENTO_STATUS } from '@/constants/orcamento-status'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { OrcamentoStatus } from '@/types/common'
import type { OrcamentoListItem, FilterStatus } from '@/types/orcamento'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

interface OrcamentosListProps {
  orcamentos: OrcamentoListItem[]
  loading: boolean
  filter: FilterStatus
  statusUpdatingId: string | null
  onStatusChange: (id: string, novoStatus: OrcamentoStatus) => void
  onDeleteRequest: (id: string) => void
}

export default function OrcamentosList({
  orcamentos,
  loading,
  filter,
  statusUpdatingId,
  onStatusChange,
  onDeleteRequest,
}: OrcamentosListProps) {
  const navigate = useNavigate()

  // Estado de carregamento: esqueletos de altura equivalente ao card real
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] w-full" />
        ))}
      </div>
    )
  }

  // Estado vazio: mensagem contextual por aba de filtro ativa
  if (orcamentos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <FileText className="size-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-foreground">Nenhum orçamento encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === 'todos'
              ? 'Crie seu primeiro orçamento para começar.'
              : `Nenhum orçamento com status "${ORCAMENTO_STATUS[filter as OrcamentoStatus].label}".`}
          </p>
        </div>
        {filter === 'todos' && (
          <Button
            size="sm"
            className="mt-2"
            onClick={() => navigate(ROUTES.CARPINTEIRO_NOVO_ORCAMENTO)}
          >
            <Plus className="size-4" />
            Criar orçamento
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orcamentos.map((orc) => (
        // Card dividido: Link cobre a área de conteúdo; DropdownMenu fica fora do Link
        // para evitar que o clique no menu dispare a navegação
        <div
          key={orc.id}
          className="flex items-center rounded-lg bg-surface-container-highest transition-colors duration-200 hover:bg-surface-container-high"
        >
          <Link
            to={ROUTES.CARPINTEIRO_ORCAMENTO(orc.id)}
            className="flex flex-1 items-center gap-4 pl-4 pr-2 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            {/* Inicial do nome como avatar */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-black text-xs uppercase">
                {orc.nome.charAt(0)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-on-surface">{orc.nome}</p>
              <p className="truncate text-xs text-on-surface-variant">{orc.cliente_nome}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                  ORCAMENTO_STATUS[orc.status].badgeClass,
                )}
              >
                {ORCAMENTO_STATUS[orc.status].label}
              </span>
              <span className="text-xs font-black tabular-nums text-on-surface tracking-tighter">
                {BRL.format(orc.total)}
              </span>
            </div>

            <ChevronRight className="size-4 text-on-surface-variant shrink-0" />
          </Link>

          {/* Kebab menu: Editar, Alterar status (submenu) e Excluir */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="mx-2 shrink-0 text-on-surface-variant"
                aria-label="Ações do orçamento"
                disabled={statusUpdatingId === orc.id}
              >
                {statusUpdatingId === orc.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MoreVertical className="size-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Editar bloqueado em pedido_fechado e cancelado — preços congelados */}
              {orc.status !== ORCAMENTO_STATUS.pedido_fechado.value &&
                orc.status !== ORCAMENTO_STATUS.cancelado.value && (
                  <DropdownMenuItem
                    onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO_EDITAR(orc.id))}
                  >
                    <Pencil />
                    Editar
                  </DropdownMenuItem>
                )}

              {/* Submenu com os 5 status; marca o atual com Check */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <CircleDot />
                  Alterar status
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.values(ORCAMENTO_STATUS).map(({ value, label }) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => onStatusChange(orc.id, value)}
                      disabled={orc.status === value}
                    >
                      {orc.status === value ? (
                        <Check />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteRequest(orc.id)}
              >
                <Trash2 />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  )
}
