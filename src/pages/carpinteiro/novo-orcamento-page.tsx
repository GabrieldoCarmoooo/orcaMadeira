import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Link2, Save, Loader2, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import { StepProjeto } from '@/components/orcamento/step-projeto'
import { StepMateriais } from '@/components/orcamento/step-materiais'
import { StepFinanceiro } from '@/components/orcamento/step-financeiro'
import { ResumoOrcamento } from '@/components/orcamento/resumo-orcamento'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

const STEPS = ['Projeto', 'Materiais', 'Financeiro'] as const

type Phase = 'wizard' | 'review'

/**
 * Wizard page for creating a new orcamento.
 * Composes 3 step components, handles autosave every 30s,
 * and persists to Supabase (rascunho → finalizado).
 */
export default function NovoOrcamentoPage() {
  const navigate = useNavigate()
  const { carpinteiro } = useAuthStore()
  const { step, stepProjeto, itens, stepFinanceiro, resumo, reset } = useOrcamentoStore()

  // Vinculação / madeireira state
  const [loadingVinculacao, setLoadingVinculacao] = useState(true)
  const [madeireiraId, setMadeireiraId] = useState<string | null>(null)
  const [tabelaId, setTabelaId] = useState<string | null>(null)

  // Wizard phase: 'wizard' shows the stepped form, 'review' shows summary + finalize
  const [phase, setPhase] = useState<Phase>('wizard')

  // Persistence
  const orcamentoIdRef = useRef<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset store on mount so each visit to /novo starts fresh
  useEffect(() => {
    reset()
  }, [reset])

  // Check approved vinculação on mount
  useEffect(() => {
    if (!carpinteiro) return

    async function checkVinculacao() {
      const { data: vinculacao } = await supabase
        .from('vinculacoes')
        .select('madeireira_id')
        .eq('carpinteiro_id', carpinteiro!.id)
        .eq('status', 'aprovada')
        .maybeSingle()

      if (!vinculacao) {
        setLoadingVinculacao(false)
        return
      }

      setMadeireiraId(vinculacao.madeireira_id)

      const { data: tabela } = await supabase
        .from('tabelas_preco')
        .select('id')
        .eq('madeireira_id', vinculacao.madeireira_id)
        .eq('ativo', true)
        .maybeSingle()

      setTabelaId(tabela?.id ?? null)
      setLoadingVinculacao(false)
    }

    checkVinculacao()
  }, [carpinteiro])

  // Save draft: INSERT on first call, UPDATE on subsequent calls
  const saveDraft = useCallback(async () => {
    if (!carpinteiro || !madeireiraId || !tabelaId) return
    // Only save if there's meaningful data
    if (!stepProjeto.nome && itens.length === 0) return

    setSaving(true)
    setSaveError(null)

    try {
      const payload = {
        carpinteiro_id: carpinteiro.id,
        madeireira_id: madeireiraId,
        tabela_snapshot_id: tabelaId,
        status: 'rascunho' as const,
        tipo_projeto: stepProjeto.tipo_projeto,
        nome: stepProjeto.nome || 'Novo orçamento',
        descricao: stepProjeto.descricao || null,
        cliente_nome: stepProjeto.cliente_nome || '',
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

      let id = orcamentoIdRef.current

      if (!id) {
        const { data, error } = await supabase
          .from('orcamentos')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        id = data.id as string
        orcamentoIdRef.current = id
      } else {
        const { error } = await supabase.from('orcamentos').update(payload).eq('id', id)
        if (error) throw error
      }

      // Sync itens: delete all then re-insert
      await supabase.from('itens_orcamento').delete().eq('orcamento_id', id)

      if (itens.length > 0) {
        await supabase.from('itens_orcamento').insert(
          itens.map((item) => ({
            orcamento_id: id!,
            item_preco_id: item.item_preco_id,
            nome: item.nome,
            unidade: item.unidade,
            preco_unitario: item.preco_unitario,
            quantidade: item.quantidade,
            subtotal: item.preco_unitario * item.quantidade,
          })),
        )
      }

      setLastSaved(new Date())
    } catch {
      setSaveError('Erro ao salvar rascunho. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [carpinteiro, madeireiraId, tabelaId, stepProjeto, itens, stepFinanceiro, resumo])

  // Autosave every 30s once madeireira is confirmed
  useEffect(() => {
    if (!madeireiraId) return

    const timer = setInterval(saveDraft, 30_000)
    return () => clearInterval(timer)
  }, [madeireiraId, saveDraft])

  // Finalize: same as saveDraft but sets status=finalizado and freezes the snapshot
  async function handleFinalizar() {
    if (!carpinteiro || !madeireiraId || !tabelaId) return

    setSaving(true)
    setSaveError(null)

    try {
      const payload = {
        carpinteiro_id: carpinteiro.id,
        madeireira_id: madeireiraId,
        tabela_snapshot_id: tabelaId,
        status: 'finalizado' as const,
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
        finalizado_at: new Date().toISOString(),
      }

      let id = orcamentoIdRef.current

      if (!id) {
        const { data, error } = await supabase
          .from('orcamentos')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        id = data.id as string
        orcamentoIdRef.current = id
      } else {
        const { error } = await supabase.from('orcamentos').update(payload).eq('id', id)
        if (error) throw error
      }

      // Denormalize all itens with final prices (snapshot)
      await supabase.from('itens_orcamento').delete().eq('orcamento_id', id)

      if (itens.length > 0) {
        await supabase.from('itens_orcamento').insert(
          itens.map((item) => ({
            orcamento_id: id!,
            item_preco_id: item.item_preco_id,
            nome: item.nome,
            unidade: item.unidade,
            preco_unitario: item.preco_unitario,
            quantidade: item.quantidade,
            subtotal: item.preco_unitario * item.quantidade,
          })),
        )
      }

      reset()
      navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)
    } catch {
      setSaveError('Erro ao finalizar orçamento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading vinculação ──────────────────────────────────────────────────────
  if (loadingVinculacao) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Verificando vinculação...</span>
      </div>
    )
  }

  // ── No approved vinculação: show CTA ───────────────────────────────────────
  if (!madeireiraId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
          <Link2 className="size-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">Vinculação necessária</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          Para criar orçamentos com preços reais, você precisa estar vinculado a uma madeireira
          com a solicitação aprovada.
        </p>
        <Button className="w-full" onClick={() => navigate(ROUTES.CARPINTEIRO_VINCULACAO)}>
          Ir para vinculações
        </Button>
      </div>
    )
  }

  // ── Shared header (save status + salvar rascunho button) ───────────────────
  const SaveHeader = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground">Novo orçamento</h1>
        {lastSaved ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Rascunho salvo às{' '}
            {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">Não salvo ainda</p>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={saveDraft}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Save className="size-3.5" />
        )}
        {saving ? 'Salvando...' : 'Salvar rascunho'}
      </Button>
    </div>
  )

  // ── Review phase ───────────────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
        {SaveHeader}

        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Revisão do orçamento</h2>
          <p className="text-sm text-muted-foreground">
            Confirme as informações antes de finalizar. Após finalizar, os preços ficam congelados.
          </p>
        </div>

        {/* Project & client summary */}
        <div className="rounded-[16px] bg-muted/50 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Projeto
          </p>
          <p className="font-semibold text-foreground">{stepProjeto.nome}</p>
          {stepProjeto.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">{stepProjeto.descricao}</p>
          )}
          <div className="mt-3 space-y-0.5">
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Cliente: </span>
              {stepProjeto.cliente_nome}
            </p>
            {stepProjeto.cliente_telefone && (
              <p className="text-sm text-muted-foreground">{stepProjeto.cliente_telefone}</p>
            )}
          </div>
        </div>

        {/* Materiais count */}
        <div className="rounded-[16px] bg-muted/50 px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Materiais
          </p>
          <p className="text-sm text-foreground">{itens.length} item(ns) selecionado(s)</p>
        </div>

        <ResumoOrcamento />

        {saveError && (
          <p className="rounded-[8px] bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {saveError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setPhase('wizard')}
            disabled={saving}
          >
            Voltar e editar
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
                Finalizando...
              </>
            ) : (
              <>
                <CheckCheck className="size-4" />
                Finalizar
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Wizard phase ───────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {SaveHeader}

      {/* Stepper */}
      <div className="flex items-start">
        {STEPS.map((label, index) => {
          const stepNum = (index + 1) as 1 | 2 | 3
          const isCompleted = step > stepNum
          const isActive = step === stepNum

          return (
            <div key={label} className="flex flex-1 items-center">
              {/* Step indicator + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="size-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mb-5 h-0.5 flex-1 mx-2 transition-colors',
                    step > stepNum ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {saveError && (
        <p className="rounded-[8px] bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {saveError}
        </p>
      )}

      {/* Step content */}
      {step === 1 && <StepProjeto onNext={() => {}} />}
      {step === 2 && <StepMateriais onNext={() => {}} onBack={() => {}} />}
      {step === 3 && (
        <StepFinanceiro
          onNext={() => setPhase('review')}
          onBack={() => {}}
        />
      )}
    </div>
  )
}
