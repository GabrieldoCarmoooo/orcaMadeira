import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Loader2, CheckCheck, ArrowLeft, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import { useOrcamento } from '@/hooks/useOrcamento'
import { StepProjeto } from '@/components/orcamento/step-projeto'
import { StepMateriais } from '@/components/orcamento/step-materiais'
import { StepFinanceiro } from '@/components/orcamento/step-financeiro'
import { ResumoOrcamento } from '@/components/orcamento/resumo-orcamento'
import { GrainProgress } from '@/components/ui/grain-progress'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import type { ItemOrcamentoCalculo } from '@/lib/calcular-orcamento'

// Valida integridade dos itens antes do upsert — fail-fast no cliente para evitar
// violação do CHECK constraint (origem × campo relacional) no banco.
function validarItensParaInsert(itens: ItemOrcamentoCalculo[]): void {
  for (const item of itens) {
    if (item.origem === 'madeira_m3' && !item.madeira_m3_id) {
      throw new Error(`Item "${item.nome}" é do tipo madeira_m3 mas não tem madeira_m3_id definido.`)
    }
    if (item.origem === 'outro_produto' && !item.outro_produto_id) {
      throw new Error(`Item "${item.nome}" é do tipo outro_produto mas não tem outro_produto_id definido.`)
    }
  }
}

// Mapeia um item do store para o formato de insert em itens_orcamento,
// propagando os campos de snapshot corretos de acordo com a origem do item.
function mapItemParaInsert(orcamentoId: string, item: ItemOrcamentoCalculo) {
  const base = {
    orcamento_id: orcamentoId,
    nome: item.nome,
    unidade: item.unidade,
    preco_unitario: item.preco_unitario,
    quantidade: item.quantidade,
    subtotal: item.preco_unitario * item.quantidade,
  }

  if (item.origem === 'madeira_m3') {
    // Snapshot completo das dimensões e acabamento — preserva o valor histórico ao finalizar
    return {
      ...base,
      origem: 'madeira_m3' as const,
      item_preco_id: null,
      madeira_m3_id: item.madeira_m3_id!,
      especie_nome: item.especie_nome ?? null,
      espessura_cm: item.espessura_cm ?? null,
      largura_cm: item.largura_cm ?? null,
      comprimento_real_m: item.comprimento_real_m ?? null,
      comprimento_id: item.comprimento_id ?? null,
      acabamento_id: item.acabamento_id ?? null,
      acabamento_nome: item.acabamento_nome ?? null,
      acabamento_percentual: item.acabamento_percentual ?? null,
    }
  }

  if (item.origem === 'outro_produto') {
    return {
      ...base,
      origem: 'outro_produto' as const,
      item_preco_id: null,
      outro_produto_id: item.outro_produto_id!,
    }
  }

  // Default legado_planilha — mantém compatibilidade com itens anteriores à migration 002
  return {
    ...base,
    origem: 'legado_planilha' as const,
    item_preco_id: item.item_preco_id,
  }
}

const STEP_LABELS = ['Projeto', 'Materiais', 'Financeiro', 'Revisão'] as const
const TOTAL_STEPS = STEP_LABELS.length

type Phase = 'wizard' | 'review'

export default function EditarOrcamentoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { orcamento, itens: itensOriginais, loading: loadingOrcamento, error: orcamentoError } =
    useOrcamento(id)

  const { step, stepProjeto, itens, stepFinanceiro, resumo, hydrate, reset } = useOrcamentoStore()

  const [phase, setPhase] = useState<Phase>('wizard')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mostrarDetalhes, setMostrarDetalhes] = useState(true)

  // Ref para garantir que o hydrate ocorre apenas uma vez — evita re-hidratação por
  // mudança de referência das listas retornadas pelo hook após o carregamento inicial.
  const hydratedRef = useRef(false)
  const [hydrated, setHydrated] = useState(false)

  // Hidrata o store com dados do orçamento existente ao primeiro carregamento
  useEffect(() => {
    if (!orcamento || hydratedRef.current) return
    hydratedRef.current = true
    hydrate(orcamento, itensOriginais)
    setHydrated(true)
  }, [orcamento, itensOriginais, hydrate])

  // Limpa o store ao sair da tela — evita contaminar a próxima sessão (ex.: novo orçamento)
  useEffect(() => {
    return () => reset()
  }, [reset])

  // Persiste estado atual via UPDATE — o orçamento já existe, nunca inserimos novamente
  const salvarAlteracoes = useCallback(async () => {
    if (!orcamento) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        tipo_projeto: stepProjeto.tipo_projeto,
        nome: stepProjeto.nome || orcamento.nome,
        descricao: stepProjeto.descricao || null,
        cliente_nome: stepProjeto.cliente_nome || orcamento.cliente_nome,
        cliente_telefone: stepProjeto.cliente_telefone || null,
        cliente_email: stepProjeto.cliente_email || null,
        mao_obra_tipo: stepFinanceiro.mao_obra_tipo,
        mao_obra_valor: stepFinanceiro.mao_obra_valor,
        mao_obra_horas: stepFinanceiro.mao_obra_horas,
        margem_lucro: stepFinanceiro.margem_lucro,
        imposto: stepFinanceiro.imposto,
        validade_dias: stepFinanceiro.validade_dias,
        termos_condicoes: stepFinanceiro.termos_condicoes || null,
        subtotal_materiais: resumo.subtotal_materiais,
        subtotal_mao_obra: resumo.subtotal_mao_obra,
        valor_margem: resumo.valor_margem,
        valor_imposto: resumo.valor_imposto,
        total: resumo.total,
      }

      const { error } = await supabase.from('orcamentos').update(payload).eq('id', orcamento.id)
      if (error) throw error

      // Delete + reinsert é a estratégia mais segura para substituir a lista de itens atomicamente
      validarItensParaInsert(itens)
      await supabase.from('itens_orcamento').delete().eq('orcamento_id', orcamento.id)
      if (itens.length > 0) {
        await supabase
          .from('itens_orcamento')
          .insert(itens.map((item) => mapItemParaInsert(orcamento.id, item)))
      }

      setLastSaved(new Date())
    } catch {
      setSaveError('Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }, [orcamento, stepProjeto, itens, stepFinanceiro, resumo])

  // Autosave a cada 30s após o orçamento estar hidratado
  useEffect(() => {
    if (!hydrated) return
    const timer = setInterval(salvarAlteracoes, 30_000)
    return () => clearInterval(timer)
  }, [hydrated, salvarAlteracoes])

  // Finaliza edição: UPDATE preservando finalizado_at original para orçamentos já finalizados.
  // Rascunhos recebem um novo finalizado_at; demais status mantêm o original.
  async function handleFinalizar() {
    if (!orcamento) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        status: 'salvo' as const,
        tipo_projeto: stepProjeto.tipo_projeto,
        nome: stepProjeto.nome,
        descricao: stepProjeto.descricao || null,
        cliente_nome: stepProjeto.cliente_nome,
        cliente_telefone: stepProjeto.cliente_telefone || null,
        cliente_email: stepProjeto.cliente_email || null,
        mao_obra_tipo: stepFinanceiro.mao_obra_tipo,
        mao_obra_valor: stepFinanceiro.mao_obra_valor,
        mao_obra_horas: stepFinanceiro.mao_obra_horas,
        margem_lucro: stepFinanceiro.margem_lucro,
        imposto: stepFinanceiro.imposto,
        validade_dias: stepFinanceiro.validade_dias,
        termos_condicoes: stepFinanceiro.termos_condicoes || null,
        subtotal_materiais: resumo.subtotal_materiais,
        subtotal_mao_obra: resumo.subtotal_mao_obra,
        valor_margem: resumo.valor_margem,
        valor_imposto: resumo.valor_imposto,
        total: resumo.total,
        // Preserva a data original se o orçamento já foi finalizado antes;
        // define agora apenas se ainda era rascunho (finalizado_at nulo)
        finalizado_at: orcamento.finalizado_at ?? new Date().toISOString(),
      }

      const { error } = await supabase.from('orcamentos').update(payload).eq('id', orcamento.id)
      if (error) throw error

      // Sincroniza itens via delete + reinsert — garante que itens removidos não persistam
      validarItensParaInsert(itens)
      await supabase.from('itens_orcamento').delete().eq('orcamento_id', orcamento.id)
      if (itens.length > 0) {
        await supabase
          .from('itens_orcamento')
          .insert(itens.map((item) => mapItemParaInsert(orcamento.id, item)))
      }

      reset()
      navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)
    } catch {
      setSaveError('Erro ao finalizar edição do orçamento.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────────

  if (loadingOrcamento || (!hydrated && !orcamentoError)) {
    return (
      <div className="flex items-center justify-center py-24 text-on-surface-variant">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Carregando orçamento...</span>
      </div>
    )
  }

  if (orcamentoError || !orcamento) {
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

  const currentStep = phase === 'review' ? TOTAL_STEPS : step
  const percent = Math.round((currentStep / TOTAL_STEPS) * 100)
  const stepLabel = STEP_LABELS[currentStep - 1]

  // ── Review phase ─────────────────────────────────────────────────────────────

  if (phase === 'review') {
    return (
      <div className="space-y-8">
        <GrainProgress current={currentStep} total={TOTAL_STEPS} percent={percent} stepLabel={stepLabel} />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter text-on-surface">Revisão</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {lastSaved
                ? `Salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Não salvo ainda'}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={salvarAlteracoes} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? 'Salvando...' : 'Salvar'}
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
            disabled={saving}
          >
            <ArrowLeft className="size-4" />
            Editar
          </Button>
          <Button
            type="button"
            className="flex-1"
            size="lg"
            onClick={handleFinalizar}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCheck className="size-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Wizard phase ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">
      <GrainProgress current={currentStep} total={TOTAL_STEPS} percent={percent} stepLabel={stepLabel} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-on-surface">Editar orçamento</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {lastSaved
              ? `Salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Não salvo ainda'}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={salvarAlteracoes} disabled={saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {saving ? 'Salvando...' : 'Salvar'}
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
            <div className="mt-4 flex gap-4 text-xs opacity-60">
              <div className="flex items-center gap-2">
                <span className="font-medium">Mostrar detalhes no PDF</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={mostrarDetalhes}
                  onClick={() => setMostrarDetalhes((v) => !v)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full items-center px-0.5 transition-colors focus-visible:outline-none ${
                    mostrarDetalhes ? 'bg-background/40' : 'bg-background/20'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
                      mostrarDetalhes ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
