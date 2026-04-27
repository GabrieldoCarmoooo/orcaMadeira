import { ArrowLeft, CheckCheck, Loader2, Save } from 'lucide-react'
import { StepProjeto } from '@/components/orcamento/step-projeto'
import { StepMateriais } from '@/components/orcamento/step-materiais'
import { StepFinanceiro } from '@/components/orcamento/step-financeiro'
import { ResumoOrcamento } from '@/components/orcamento/resumo-orcamento'
import { GrainProgress } from '@/components/ui/grain-progress'
import { Button } from '@/components/ui/button'
import ToggleDetalhesPdf from '@/components/orcamento/toggle-detalhes-pdf'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import type { UseOrcamentoWizardReturn } from '@/hooks/useOrcamentoWizard'

const STEP_LABELS = ['Projeto', 'Materiais', 'Financeiro', 'Revisão'] as const
const TOTAL_STEPS = STEP_LABELS.length

interface OrcamentoWizardShellProps {
  // Título exibido no cabeçalho da fase wizard
  title: string
  // Rótulo do botão de confirmação na fase de revisão
  finalizarLabel: string
  // Prefixo do texto de status de save ("Rascunho salvo" | "Salvo")
  savedPrefix: string
  phase: 'wizard' | 'review'
  setPhase: (phase: 'wizard' | 'review') => void
  // Callback de finalização — salva, gera PDF e navega
  onFinalizar: () => Promise<void>
  wizard: UseOrcamentoWizardReturn
}

export function OrcamentoWizardShell({
  title,
  finalizarLabel,
  savedPrefix,
  phase,
  setPhase,
  onFinalizar,
  wizard,
}: OrcamentoWizardShellProps) {
  const {
    step,
    stepProjeto,
    itens,
    resumo,
    isSaving,
    lastSaved,
    saveError,
    mostrarDetalhes,
    setMostrarDetalhes,
    salvarRascunho,
  } = wizard

  const currentStep = phase === 'review' ? TOTAL_STEPS : step
  const percent = Math.round((currentStep / TOTAL_STEPS) * 100)
  const stepLabel = STEP_LABELS[currentStep - 1]

  // Formata o texto de status de save; fallback para "Não salvo ainda" enquanto não há save
  const savedText = lastSaved
    ? `${savedPrefix} às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Não salvo ainda'

  // ── Fase de revisão ───────────────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div className="space-y-8">
        <GrainProgress current={currentStep} total={TOTAL_STEPS} percent={percent} stepLabel={stepLabel} />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter text-on-surface">Revisão</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{savedText}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void salvarRascunho()} disabled={isSaving}>
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <div className="bg-surface-container-highest rounded-lg p-6 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Projeto</p>
          <p className="font-bold text-on-surface">{stepProjeto.nome}</p>
          {stepProjeto.descricao && (
            <p className="text-sm text-on-surface-variant">{stepProjeto.descricao}</p>
          )}
          <div className="space-y-0.5 mt-3">
            <p className="text-sm text-on-surface">
              <span className="text-on-surface-variant">Cliente: </span>
              {stepProjeto.cliente_nome}
            </p>
            {stepProjeto.cliente_telefone && (
              <p className="text-sm text-on-surface-variant">{stepProjeto.cliente_telefone}</p>
            )}
          </div>
        </div>

        <div className="bg-surface-container-highest rounded-lg px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
            Materiais
          </p>
          <p className="text-sm text-on-surface">{itens.length} item(ns) selecionado(s)</p>
        </div>

        <ResumoOrcamento />

        {saveError && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        <div className="rounded-lg bg-foreground text-background px-6 py-5 flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-widest opacity-70">
            Total da Proposta
          </span>
          <span className="text-3xl font-black tracking-tighter">
            {resumo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => setPhase('wizard')}
            disabled={isSaving}
          >
            <ArrowLeft className="size-4" />
            Editar
          </Button>
          <Button
            type="button"
            className="flex-1"
            size="lg"
            onClick={() => void onFinalizar()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <CheckCheck className="size-4" />
                {finalizarLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Fase wizard ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">
      <GrainProgress current={currentStep} total={TOTAL_STEPS} percent={percent} stepLabel={stepLabel} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-on-surface">{title}</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">{savedText}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void salvarRascunho()} disabled={isSaving}>
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {saveError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {step === 1 && <StepProjeto onNext={() => {}} />}
      {step === 2 && (
        <div className="space-y-6">
          <StepMateriais onNext={() => {}} onBack={() => {}} />
        </div>
      )}
      {step === 3 && (
        <div className="space-y-6">
          <StepFinanceiro onNext={() => setPhase('review')} onBack={() => {}} />

          {/* Prévia financeira + toggle de detalhes do PDF — visível antes da revisão final */}
          <div className="rounded-lg bg-foreground text-background px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-3">
              Prévia do Total
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest opacity-70">
                Total estimado
              </span>
              <span className="text-3xl font-black tracking-tighter">
                {resumo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="mt-4">
              <ToggleDetalhesPdf
                value={mostrarDetalhes}
                onChange={setMostrarDetalhes}
                variant="inverted"
                label="Mostrar detalhes no PDF"
              />
            </div>
          </div>
        </div>
      )}

      {/* Botão Voltar nos steps intermediários — navega diretamente no store para não duplicar props */}
      {step > 1 && step < 3 && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-on-surface-variant"
            onClick={() => useOrcamentoStore.getState().setStep((step - 1) as 1 | 2 | 3)}
          >
            <ArrowLeft size={14} />
            Voltar
          </Button>
        </div>
      )}
    </div>
  )
}
