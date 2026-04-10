import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrcamento } from '@/hooks/useOrcamento'
import { Button } from '@/components/ui/button'
import { BotaoExportarPdf } from '@/components/orcamento/botao-exportar-pdf'
import { ROUTES } from '@/constants/routes'
import type { OrcamentoStatus } from '@/types/common'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
  enviado: 'Enviado',
}

const STATUS_CLASS: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  finalizado: 'bg-primary/15 text-primary',
  enviado: 'bg-secondary/15 text-secondary',
}

const TIPO_LABEL: Record<string, string> = {
  movel: 'Móveis',
  estrutura: 'Estruturas',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

function FinancialLine({
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

export default function OrcamentoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { orcamento, itens, loading, error } = useOrcamento(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Carregando orçamento...</span>
      </div>
    )
  }

  if (error || !orcamento) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-4 size-10 text-muted-foreground/50" />
        <h2 className="mb-2 font-semibold text-foreground">Orçamento não encontrado</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error ?? 'Este orçamento não existe ou você não tem acesso a ele.'}
        </p>
        <Button variant="outline" onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)}>
          <ArrowLeft className="size-4" />
          Voltar para orçamentos
        </Button>
      </div>
    )
  }

  const maoObraLabel =
    orcamento.mao_obra_tipo === 'hora'
      ? `Mão de obra (${orcamento.mao_obra_horas ?? 0}h × ${BRL.format(orcamento.mao_obra_valor)})`
      : 'Mão de obra (fixo)'

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Back nav */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Orçamentos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                STATUS_CLASS[orcamento.status],
              )}
            >
              {STATUS_LABEL[orcamento.status]}
            </span>
            <span className="text-xs text-muted-foreground">
              {TIPO_LABEL[orcamento.tipo_projeto] ?? orcamento.tipo_projeto}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">{orcamento.nome}</h1>
          {orcamento.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">{orcamento.descricao}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-2">
          {orcamento.status === 'rascunho' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO_EDITAR(orcamento.id))}
            >
              <Pencil className="size-3.5" />
              Editar
            </Button>
          )}
          {(orcamento.status === 'finalizado' || orcamento.status === 'enviado') && (
            <BotaoExportarPdf orcamento={orcamento} itens={itens} />
          )}
        </div>
      </div>

      {/* Client info */}
      <div className="rounded-[16px] bg-muted/50 px-5 py-4 space-y-1">
        <SectionTitle>Cliente</SectionTitle>
        <div className="mt-3">
          <InfoRow label="Nome" value={orcamento.cliente_nome} />
          <InfoRow label="Telefone" value={orcamento.cliente_telefone} />
          <InfoRow label="E-mail" value={orcamento.cliente_email} />
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-[16px] bg-muted/50 px-5 py-4 space-y-1">
        <SectionTitle>Datas</SectionTitle>
        <div className="mt-3">
          <InfoRow
            label="Criado em"
            value={DATE_FMT.format(new Date(orcamento.created_at))}
          />
          {orcamento.finalizado_at && (
            <InfoRow
              label="Finalizado em"
              value={DATE_FMT.format(new Date(orcamento.finalizado_at))}
            />
          )}
          <InfoRow label="Validade" value={`${orcamento.validade_dias} dias`} />
        </div>
      </div>

      {/* Materiais */}
      {itens.length > 0 && (
        <div className="space-y-3">
          <SectionTitle>Materiais ({itens.length})</SectionTitle>
          <div className="space-y-2">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-[8px] bg-muted/50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantidade} {item.unidade} × {BRL.format(item.preco_unitario)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {BRL.format(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial summary */}
      <div className="rounded-[16px] bg-muted/50 px-5 py-4 space-y-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resumo financeiro
        </p>

        <FinancialLine label="Materiais" value={orcamento.subtotal_materiais} muted />
        <FinancialLine label={maoObraLabel} value={orcamento.subtotal_mao_obra} muted />

        <div className="h-2" />

        <FinancialLine
          label={`Margem de lucro (${orcamento.margem_lucro}%)`}
          value={orcamento.valor_margem}
          muted
        />
        <FinancialLine
          label={`Impostos (${orcamento.imposto}%)`}
          value={orcamento.valor_imposto}
          muted
        />

        <div className="my-3 h-px bg-border/40" />

        <FinancialLine label="Total" value={orcamento.total} highlight />
      </div>

      {/* Terms */}
      {orcamento.termos_condicoes && (
        <div className="rounded-[16px] bg-muted/50 px-5 py-4 space-y-2">
          <SectionTitle>Termos e condições</SectionTitle>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {orcamento.termos_condicoes}
          </p>
        </div>
      )}
    </div>
  )
}
