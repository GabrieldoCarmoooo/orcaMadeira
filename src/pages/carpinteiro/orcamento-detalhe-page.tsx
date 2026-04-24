import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, Pencil, Trash2, FileDown, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useOrcamento } from '@/hooks/useOrcamento'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { BotaoExportarPdf } from '@/components/orcamento/botao-exportar-pdf'
import ToggleDetalhesPdf from '@/components/orcamento/toggle-detalhes-pdf'
import { ROUTES } from '@/constants/routes'
import { usePdf } from '@/hooks/usePdf'
import type { OrcamentoStatus } from '@/types/common'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

// Labels e cores alinhados com a migration 003 (5 status; finalizado removido)
const STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  salvo: 'Salvo',
  enviado: 'Enviado',
  pedido_fechado: 'Pedido Fechado',
  cancelado: 'Cancelado',
}

const STATUS_CLASS: Record<OrcamentoStatus, string> = {
  rascunho: 'bg-primary/10 text-primary',
  salvo: 'bg-secondary/10 text-secondary',
  enviado: 'bg-on-surface-variant/10 text-on-surface-variant',
  pedido_fechado: 'bg-green-600/10 text-green-700',
  cancelado: 'bg-red-500/10 text-red-600',
}

const TIPO_LABEL: Record<string, string> = {
  movel: 'Móveis',
  estrutura: 'Estruturas',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{children}</p>
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
  const { carpinteiro } = useAuthStore()
  const { orcamento, itens, loading, error } = useOrcamento(id)
  const { exportarMateriais, loading: pdfLoading } = usePdf()
  // Default desligado: "Baixar PDF" parte sempre de detalhes ocultos até o toggle ser ativado
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)

  // Status local para atualização otimista ao usar o selector de status
  const [localStatus, setLocalStatus] = useState<OrcamentoStatus | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Estado do dialog de confirmação de exclusão
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Sincroniza o status local assim que o orçamento carrega do banco
  useEffect(() => {
    if (orcamento) setLocalStatus(orcamento.status)
  }, [orcamento])

  const statusAtual = localStatus ?? orcamento?.status

  // Persiste a troca de status no banco; reverte em caso de erro.
  // `.select()` retorna as linhas afetadas — array vazio = RLS bloqueou.
  async function handleStatusChange(novoStatus: string) {
    if (!orcamento || !carpinteiro) return
    const statusAnterior = localStatus
    setLocalStatus(novoStatus as OrcamentoStatus)
    setUpdatingStatus(true)

    const { data, error: updateError } = await supabase
      .from('orcamentos')
      .update({ status: novoStatus as OrcamentoStatus })
      .eq('id', orcamento.id)
      .eq('carpinteiro_id', carpinteiro.id)
      .select('id')

    setUpdatingStatus(false)

    if (updateError || !data || data.length === 0) {
      setLocalStatus(statusAnterior)
      window.alert(
        updateError?.message ?? 'Não foi possível alterar o status. Verifique suas permissões.',
      )
    }
  }

  // Exclui o orçamento e redireciona para a lista após confirmação.
  // `.select()` garante que identificamos DELETE silenciosamente filtrado
  // por RLS (data vazio) em vez de assumir sucesso no happy path.
  async function handleDeleteConfirm() {
    if (!orcamento || !carpinteiro) return
    setDeleting(true)
    setDeleteError(null)

    const { data, error: deleteErr } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', orcamento.id)
      .eq('carpinteiro_id', carpinteiro.id)
      .select('id')

    setDeleting(false)

    if (deleteErr) {
      setDeleteError(deleteErr.message)
      return
    }

    if (!data || data.length === 0) {
      setDeleteError('Não foi possível excluir o orçamento. Verifique suas permissões.')
      return
    }

    setDeleteDialog(false)
    navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)
  }

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

  // Replica o status local no objeto para manter BotaoExportarPdf consistente com o selector
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

      {/* Header: selector de status + título + ações */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Selector de status com transições livres entre os 5 valores */}
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <Select
              value={statusAtual}
              onValueChange={handleStatusChange}
              disabled={updatingStatus}
            >
              <SelectTrigger size="sm" className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_LABEL) as [OrcamentoStatus, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                          STATUS_CLASS[value],
                        )}
                      >
                        {label}
                      </span>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {updatingStatus && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">
              {TIPO_LABEL[orcamento.tipo_projeto] ?? orcamento.tipo_projeto}
            </span>
          </div>

          <h1 className="text-xl font-bold text-foreground">{orcamento.nome}</h1>
          {orcamento.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">{orcamento.descricao}</p>
          )}
        </div>

        {/* Ações: Editar e Excluir disponíveis para todos os status */}
        <div className="flex shrink-0 flex-col gap-2 items-end">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO_EDITAR(orcamento.id))}
            >
              <Pencil className="size-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteDialog(true)}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          </div>

          {/* Ações de PDF disponíveis em qualquer status do orçamento */}
          <BotaoExportarPdf
            orcamento={orcamentoComStatus}
            itens={itens}
            mostrarDetalhes={mostrarDetalhes}
          />
          {/* Baixa o PDF de materiais sem campos financeiros (ISSUE-026) */}
          <Button
            size="sm"
            variant="outline"
            disabled={pdfLoading}
            onClick={() => exportarMateriais(orcamentoComStatus, itens)}
          >
            {pdfLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileDown className="size-3.5" />
            )}
            Baixar lista de materiais
          </Button>
          {/* Navega para a página de visualização in-app da proposta (ISSUE-021/024) */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO_PROPOSTA(orcamento.id))}
          >
            <Eye className="size-3.5" />
            Ver proposta
          </Button>
          {/* Componente compartilhado com AlertDialog de confirmação ao ligar */}
          <ToggleDetalhesPdf
            value={mostrarDetalhes}
            onChange={setMostrarDetalhes}
          />
        </div>
      </div>

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
          <InfoRow label="Criado em" value={DATE_FMT.format(new Date(orcamento.created_at))} />
          {orcamento.finalizado_at && (
            <InfoRow
              label="Finalizado em"
              value={DATE_FMT.format(new Date(orcamento.finalizado_at))}
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
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-secondary">
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
      </div>

      {/* Bloco de total destacado */}
      <div className="rounded-lg bg-foreground text-background px-6 py-5 flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-widest opacity-70">
          Total da Proposta
        </span>
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

      {/* Dialog de confirmação antes de excluir o orçamento */}
      <AlertDialog
        open={deleteDialog}
        onOpenChange={(open) => {
          // Bloqueia fechar o dialog enquanto a exclusão está em andamento
          if (deleting) return
          setDeleteDialog(open)
          if (!open) setDeleteError(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteConfirm}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
