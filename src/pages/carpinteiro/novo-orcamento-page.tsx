import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Loader2 } from 'lucide-react'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import { useOrcamentoWizard } from '@/hooks/useOrcamentoWizard'
import { OrcamentoWizardShell } from '@/components/orcamento/orcamento-wizard-shell'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { usePdf } from '@/hooks/usePdf'
import { ORCAMENTO_STATUS } from '@/constants/orcamento-status'

type Phase = 'wizard' | 'review'

export default function NovoOrcamentoPage() {
  const navigate = useNavigate()
  const { exportar } = usePdf()
  // Selector granular: evita re-render quando outros campos do store mudam
  const reset = useOrcamentoStore(s => s.reset)
  const [phase, setPhase] = useState<Phase>('wizard')

  const wizard = useOrcamentoWizard()

  // Finaliza o orçamento: salva como salvo, gera PDF do snapshot local e navega para a proposta
  async function handleFinalizar() {
    const id = await wizard.salvar({ status: ORCAMENTO_STATUS.salvo.value, finalizado_at: new Date().toISOString() })
    if (!id) return
    const { orcamento, itens } = wizard.buildSnapshotParaPdf(id)
    void exportar(orcamento, itens, wizard.mostrarDetalhes)
    // Limpa o store para que o próximo orçamento inicie sem dados residuais
    reset()
    navigate(ROUTES.CARPINTEIRO_ORCAMENTO_PROPOSTA(id))
  }

  // ── Loading: verificando vinculação ─────────────────────────────────────────
  if (wizard.loadingVinculacao) {
    return (
      <div className="flex items-center justify-center py-24 text-on-surface-variant">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Verificando vinculação...</span>
      </div>
    )
  }

  // ── Sem vinculação aprovada: bloqueia criação de orçamento ───────────────────
  if (!wizard.madeireiraId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Link2 className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tighter text-on-surface">
          Vinculação necessária
        </h2>
        <p className="mb-8 text-sm text-on-surface-variant">
          Para criar orçamentos com preços reais, você precisa estar vinculado a uma madeireira
          com a solicitação aprovada.
        </p>
        <Button className="w-full" onClick={() => navigate(ROUTES.CARPINTEIRO_VINCULACAO)}>
          Ir para vinculações
        </Button>
      </div>
    )
  }

  return (
    <OrcamentoWizardShell
      title="Novo orçamento"
      finalizarLabel="Finalizar"
      savedPrefix="Rascunho salvo"
      phase={phase}
      setPhase={setPhase}
      onFinalizar={handleFinalizar}
      wizard={wizard}
    />
  )
}
