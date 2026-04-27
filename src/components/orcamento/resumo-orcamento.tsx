import { useOrcamentoStore } from '@/stores/useOrcamentoStore'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface LineProps {
  label: string
  value: number
  highlight?: boolean
  muted?: boolean
}

function SummaryLine({ label, value, highlight, muted }: LineProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span
        className={
          muted
            ? 'text-sm text-muted-foreground'
            : highlight
              ? 'text-base font-bold text-foreground'
              : 'text-sm text-foreground'
        }
      >
        {label}
      </span>
      <span
        className={
          highlight
            ? 'text-xl font-bold text-primary'
            : muted
              ? 'text-sm text-muted-foreground'
              : 'text-sm font-semibold text-foreground'
        }
      >
        {formatBRL(value)}
      </span>
    </div>
  )
}

export function ResumoOrcamento() {
  // Selectors granulares: re-render isolado por campo do store
  const resumo = useOrcamentoStore(s => s.resumo)
  const stepFinanceiro = useOrcamentoStore(s => s.stepFinanceiro)

  const { mao_obra_tipo, mao_obra_valor, mao_obra_horas, margem_lucro, imposto } = stepFinanceiro

  // Exibe linhas de custos extras apenas quando o valor é maior que zero (evita poluição no resumo)
  const temDeslocamento = resumo.deslocamento > 0
  const temCustosAdicionais = resumo.custos_adicionais > 0

  const maoObraLabel =
    mao_obra_tipo === 'hora'
      ? `Mão de obra (${mao_obra_horas ?? 0}h × ${formatBRL(mao_obra_valor)})`
      : 'Mão de obra (fixo)'

  return (
    <div className="space-y-1 rounded-[16px] bg-muted/50 px-5 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Resumo do orçamento
      </p>

      <SummaryLine label="Materiais" value={resumo.subtotal_materiais} muted />
      <SummaryLine label={maoObraLabel} value={resumo.subtotal_mao_obra} muted />
      {temDeslocamento && (
        <SummaryLine label="Deslocamento" value={resumo.deslocamento} muted />
      )}
      {temCustosAdicionais && (
        <SummaryLine label="Custos adicionais" value={resumo.custos_adicionais} muted />
      )}

      {/* Spacer */}
      <div className="h-2" />

      <SummaryLine
        label={`Margem de lucro (${margem_lucro}%)`}
        value={resumo.valor_margem}
        muted
      />
      <SummaryLine label={`Impostos (${imposto}%)`} value={resumo.valor_imposto} muted />

      {/* Divider via surface shift */}
      <div className="my-3 h-px bg-border/40" />

      <SummaryLine label="Total" value={resumo.total} highlight />
    </div>
  )
}
