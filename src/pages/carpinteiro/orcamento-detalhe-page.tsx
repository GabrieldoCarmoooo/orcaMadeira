import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useOrcamento } from '@/hooks/useOrcamento'
import { useOrcamentoDetalhe } from '@/hooks/useOrcamentoDetalhe'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { BRL, DATE_FMT_LONGO } from '@/lib/format'
import { OrcamentoStatusActions } from '@/components/orcamento/orcamento-status-actions'
import { OrcamentoPdfActions } from '@/components/orcamento/orcamento-pdf-actions'
import { SectionTitle, InfoRow, FinancialLine } from '@/components/orcamento/detalhe-primitives'

export default function OrcamentoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const carpinteiro = useAuthStore((s) => s.carpinteiro)
  const { orcamento, itens, loading, error } = useOrcamento(id)
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)

  const {
    localStatus,
    updatingStatus,
    deleteDialog,
    deleting,
    deleteError,
    handleStatusChange,
    handleDeleteConfirm,
    openDeleteDialog,
    handleDeleteDialogChange,
  } = useOrcamentoDetalhe(orcamento, carpinteiro)

  // statusAtual deriva de localStatus (atualização otimista) ou do banco
  const statusAtual = localStatus ?? orcamento?.status

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Carregando orçamento...</span>
      </div>
    )
  }

  if (error || !orcamento || !statusAtual) {
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

  // Replica o status local no objeto para manter as ações de PDF consistentes com o seletor
  const orcamentoComStatus = { ...orcamento, status: statusAtual }

  return (
    <div className="space-y-6">
      {/* Navegação de volta */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)}
        className="flex items-center gap-1.5 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <ArrowLeft className="size-4" />
        Orçamentos
      </button>

      {/* Cabeçalho com seletor de status, ações de edição/exclusão e PDF */}
      <OrcamentoStatusActions
        orcamento={orcamento}
        statusAtual={statusAtual}
        updatingStatus={updatingStatus}
        deleteDialog={deleteDialog}
        deleting={deleting}
        deleteError={deleteError}
        onStatusChange={handleStatusChange}
        onEditClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO_EDITAR(orcamento.id))}
        onDeleteClick={openDeleteDialog}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteDialogChange={handleDeleteDialogChange}
      >
        <OrcamentoPdfActions
          orcamento={orcamentoComStatus}
          itens={itens}
          mostrarDetalhes={mostrarDetalhes}
          onToggleDetalhes={setMostrarDetalhes}
        />
      </OrcamentoStatusActions>

      {/* Informações do cliente */}
      <div className="bg-surface-container-highest rounded-lg px-5 py-4 space-y-1">
        <SectionTitle>Cliente</SectionTitle>
        <div className="mt-3">
          <InfoRow label="Nome" value={orcamento.cliente_nome} />
          <InfoRow label="Telefone" value={orcamento.cliente_telefone} />
          <InfoRow label="E-mail" value={orcamento.cliente_email} />
        </div>
      </div>

      {/* Datas */}
      <div className="bg-surface-container-highest rounded-lg px-5 py-4 space-y-1">
        <SectionTitle>Datas</SectionTitle>
        <div className="mt-3">
          <InfoRow label="Criado em" value={DATE_FMT_LONGO.format(new Date(orcamento.created_at))} />
          {orcamento.finalizado_at && (
            <InfoRow
              label="Finalizado em"
              value={DATE_FMT_LONGO.format(new Date(orcamento.finalizado_at))}
            />
          )}
          <InfoRow label="Validade" value={`${orcamento.validade_dias} dias`} />
        </div>
      </div>

      {/* Lista de materiais */}
      {itens.length > 0 && (
        <div className="space-y-3">
          <SectionTitle>Materiais ({itens.length})</SectionTitle>
          <div className="space-y-2">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg bg-surface-container px-4 py-3"
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

      {/* Resumo financeiro */}
      <div className="bg-surface-container-highest rounded-lg px-5 py-4 space-y-1">
        <SectionTitle>Resumo financeiro</SectionTitle>
        <FinancialLine label="Materiais" value={orcamento.subtotal_materiais} muted />
        <FinancialLine label={maoObraLabel} value={orcamento.subtotal_mao_obra} muted />
        <div className="h-2" />
        <FinancialLine label={`Margem de lucro (${orcamento.margem_lucro}%)`} value={orcamento.valor_margem} muted />
        <FinancialLine label={`Impostos (${orcamento.imposto}%)`} value={orcamento.valor_imposto} muted />
      </div>

      {/* Bloco de total destacado */}
      <div className="rounded-lg bg-foreground text-background px-6 py-5 flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-widest opacity-70">Total da Proposta</span>
        <span className="text-3xl font-black tracking-tighter">{BRL.format(orcamento.total)}</span>
      </div>

      {/* Termos e condições */}
      {orcamento.termos_condicoes && (
        <div className="bg-surface-container-highest rounded-lg px-5 py-4 space-y-2">
          <SectionTitle>Termos e condições</SectionTitle>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {orcamento.termos_condicoes}
          </p>
        </div>
      )}
    </div>
  )
}
