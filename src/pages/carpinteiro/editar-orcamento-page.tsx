import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import { useOrcamentoWizard } from '@/hooks/useOrcamentoWizard'
import { OrcamentoWizardShell } from '@/components/orcamento/orcamento-wizard-shell'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { usePdf } from '@/hooks/usePdf'
import { ORCAMENTO_STATUS } from '@/constants/orcamento-status'

type Phase = 'wizard' | 'review'

export default function EditarOrcamentoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { exportar } = usePdf()
  // Selector granular: evita re-render quando outros campos do store mudam
  const reset = useOrcamentoStore(s => s.reset)
  const [phase, setPhase] = useState<Phase>('wizard')

  const wizard = useOrcamentoWizard(id)

  // Finaliza a edição: preserva finalizado_at original se o orçamento já foi finalizado antes
  async function handleFinalizar() {
    const finalizado_at = wizard.orcamento?.finalizado_at ?? new Date().toISOString()
    const savedId = await wizard.salvar({ status: ORCAMENTO_STATUS.salvo.value, finalizado_at })
    if (!savedId) return
    const { orcamento, itens } = wizard.buildSnapshotParaPdf(savedId)
    void exportar(orcamento, itens, wizard.mostrarDetalhes)
    // Reset explícito antes de navegar — o hook já faz reset no unmount, mas adiantamos para garantir
    reset()
    navigate(ROUTES.CARPINTEIRO_ORCAMENTO_PROPOSTA(savedId))
  }

  // ── Loading: aguardando dados do orçamento e hidratação do store ─────────────
  if (wizard.loadingOrcamento || (!wizard.hydrated && !wizard.orcamentoError)) {
    return (
      <div className="flex items-center justify-center py-24 text-on-surface-variant">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Carregando orçamento...</span>
      </div>
    )
  }

  // ── Erro: orçamento não encontrado ou sem permissão ──────────────────────────
  if (wizard.orcamentoError || !wizard.orcamento) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tighter text-on-surface">
          Orçamento não encontrado
        </h2>
        <p className="mb-8 text-sm text-on-surface-variant">
          Não foi possível carregar os dados deste orçamento.
        </p>
        <Button className="w-full" onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)}>
          Voltar para orçamentos
        </Button>
      </div>
    )
  }

  return (
    <OrcamentoWizardShell
      title="Editar orçamento"
      finalizarLabel="Salvar alterações"
      savedPrefix="Salvo"
      phase={phase}
      setPhase={setPhase}
      onFinalizar={handleFinalizar}
      wizard={wizard}
    />
  )
}
