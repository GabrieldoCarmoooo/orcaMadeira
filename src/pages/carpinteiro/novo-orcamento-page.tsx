import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Save, Loader2, CheckCheck, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useOrcamentoStore } from '@/stores/useOrcamentoStore'
import { StepProjeto } from '@/components/orcamento/step-projeto'
import { StepMateriais } from '@/components/orcamento/step-materiais'
import { StepFinanceiro } from '@/components/orcamento/step-financeiro'
import { ResumoOrcamento } from '@/components/orcamento/resumo-orcamento'
import { GrainProgress } from '@/components/ui/grain-progress'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { usePdf } from '@/hooks/usePdf'
import type { ItemOrcamentoCalculo } from '@/lib/calcular-orcamento'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'
import ToggleDetalhesPdf from '@/components/orcamento/toggle-detalhes-pdf'

// Valida integridade dos itens antes do insert para evitar violação do CHECK constraint no banco.
// Cada origem exige o campo relacional correspondente não-nulo.
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

export default function NovoOrcamentoPage() {
  const navigate = useNavigate()
  const { carpinteiro } = useAuthStore()
  const { step, stepProjeto, itens, stepFinanceiro, resumo, reset } = useOrcamentoStore()

  const { exportar } = usePdf()

  const [loadingVinculacao, setLoadingVinculacao] = useState(true)
  const [madeireiraId, setMadeireiraId] = useState<string | null>(null)
  const [tabelaId, setTabelaId] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>('wizard')
  const orcamentoIdRef = useRef<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Default desligado: PDFs novos não expõem mão de obra/materiais discriminados
  // até que o carpinteiro explicitamente ligue o toggle (com AlertDialog de confirmação)
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)

  useEffect(() => {
    // Pré-preenche defaults do perfil do carpinteiro; rascunhos retomados usam hydrate() e não passam por aqui
    reset({
      margem_lucro: carpinteiro?.margem_lucro_padrao ?? 0,
      valor_hora_mao_obra: carpinteiro?.valor_hora_mao_obra ?? 0,
      imposto: carpinteiro?.imposto_padrao ?? 0,
      custos_adicionais: carpinteiro?.custos_adicionais_padrao ?? 0,
      termos_condicoes: carpinteiro?.termos_condicoes_padrao ?? '',
    })
  }, [reset, carpinteiro])

  useEffect(() => {
    if (!carpinteiro) return
    async function checkVinculacao() {
      const { data: vinculacao } = await supabase
        .from('vinculacoes')
        .select('madeireira_id')
        .eq('carpinteiro_id', carpinteiro!.id)
        .eq('status', 'aprovada')
        .maybeSingle()

      if (!vinculacao) { setLoadingVinculacao(false); return }
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

  const saveDraft = useCallback(async () => {
    if (!carpinteiro || !madeireiraId || !tabelaId) return
    if (!stepProjeto.nome && itens.length === 0) return
    setSaving(true); setSaveError(null)
    try {
      const payload = {
        carpinteiro_id: carpinteiro.id, madeireira_id: madeireiraId,
        tabela_snapshot_id: tabelaId, status: 'rascunho' as const,
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
        const { data, error } = await supabase.from('orcamentos').insert(payload).select('id').single()
        if (error) throw error
        id = data.id as string
        orcamentoIdRef.current = id
      } else {
        const { error } = await supabase.from('orcamentos').update(payload).eq('id', id)
        if (error) throw error
      }
      // Valida integridade dos itens antes de deletar/reinserir — fail-fast no cliente
      validarItensParaInsert(itens)
      await supabase.from('itens_orcamento').delete().eq('orcamento_id', id)
      if (itens.length > 0) {
        await supabase.from('itens_orcamento').insert(
          itens.map((item) => mapItemParaInsert(id!, item))
        )
      }
      setLastSaved(new Date())
    } catch { setSaveError('Erro ao salvar rascunho.') }
    finally { setSaving(false) }
  }, [carpinteiro, madeireiraId, tabelaId, stepProjeto, itens, stepFinanceiro, resumo])

  useEffect(() => {
    if (!madeireiraId) return
    const timer = setInterval(saveDraft, 30_000)
    return () => clearInterval(timer)
  }, [madeireiraId, saveDraft])

  async function handleFinalizar() {
    if (!carpinteiro || !madeireiraId || !tabelaId) return
    setSaving(true); setSaveError(null)
    try {
      const payload = {
        carpinteiro_id: carpinteiro.id, madeireira_id: madeireiraId,
        tabela_snapshot_id: tabelaId, status: 'salvo' as const,
        tipo_projeto: stepProjeto.tipo_projeto,
        nome: stepProjeto.nome, descricao: stepProjeto.descricao || null,
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
        const { data, error } = await supabase.from('orcamentos').insert(payload).select('id').single()
        if (error) throw error
        id = data.id as string
        orcamentoIdRef.current = id
      } else {
        const { error } = await supabase.from('orcamentos').update(payload).eq('id', id)
        if (error) throw error
      }
      // Valida integridade dos itens antes de deletar/reinserir — fail-fast no cliente
      validarItensParaInsert(itens)
      await supabase.from('itens_orcamento').delete().eq('orcamento_id', id)
      if (itens.length > 0) {
        await supabase.from('itens_orcamento').insert(
          itens.map((item) => mapItemParaInsert(id!, item))
        )
      }

      // Monta snapshot local do orçamento finalizado para o download automático do PDF.
      // Evita um round-trip ao banco — todos os campos já estão disponíveis no state do wizard.
      const now = new Date().toISOString()
      const orcamentoParaPdf: Orcamento = {
        id: id!,
        carpinteiro_id: carpinteiro.id,
        madeireira_id: madeireiraId,
        tabela_snapshot_id: tabelaId,
        status: 'salvo',
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
        deslocamento: resumo.deslocamento,
        custos_adicionais: resumo.custos_adicionais,
        created_at: now,
        updated_at: now,
        finalizado_at: now,
      }
      // Mapeia itens do store para ItemOrcamento para passar ao gerador de PDF
      const itensParaPdf: ItemOrcamento[] = itens.map((item, idx) => ({
        id: item.uid ?? item.item_preco_id ?? String(idx),
        orcamento_id: id!,
        item_preco_id: item.item_preco_id,
        nome: item.nome,
        unidade: item.unidade,
        preco_unitario: item.preco_unitario,
        quantidade: item.quantidade,
        subtotal: item.preco_unitario * item.quantidade,
        origem: item.origem,
        madeira_m3_id: item.madeira_m3_id ?? null,
        outro_produto_id: item.outro_produto_id ?? null,
        especie_nome: item.especie_nome ?? null,
        espessura_cm: item.espessura_cm ?? null,
        largura_cm: item.largura_cm ?? null,
        comprimento_real_m: item.comprimento_real_m ?? null,
        comprimento_id: item.comprimento_id ?? null,
        acabamento_id: item.acabamento_id ?? null,
        acabamento_nome: item.acabamento_nome ?? null,
        acabamento_percentual: item.acabamento_percentual ?? null,
      }))

      // Dispara download em paralelo — fire-and-forget para não bloquear a navegação
      void exportar(orcamentoParaPdf, itensParaPdf, mostrarDetalhes)

      reset()
      navigate(ROUTES.CARPINTEIRO_ORCAMENTO_PROPOSTA(id!))
    } catch { setSaveError('Erro ao finalizar orçamento.') }
    finally { setSaving(false) }
  }

  // ── Loading vinculação ───────────────────────────────────────────────────────
  if (loadingVinculacao) {
    return (
      <div className="flex items-center justify-center py-24 text-on-surface-variant">
        <Loader2 className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Verificando vinculação...</span>
      </div>
    )
  }

  // ── No vinculação ────────────────────────────────────────────────────────────
  if (!madeireiraId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Link2 className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tighter text-on-surface">Vinculação necessária</h2>
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

  // Compute current step number for progress bar
  const currentStep = phase === 'review' ? TOTAL_STEPS : step
  const percent = Math.round((currentStep / TOTAL_STEPS) * 100)
  const stepLabel = STEP_LABELS[currentStep - 1]

  // ── Review phase ─────────────────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div className="space-y-8">
        {/* Progress bar */}
        <GrainProgress current={currentStep} total={TOTAL_STEPS} percent={percent} stepLabel={stepLabel} />

        {/* Save status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter text-on-surface">Revisão</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {lastSaved
                ? `Rascunho salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Não salvo ainda'}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? 'Salvando...' : 'Salvar rascunho'}
          </Button>
        </div>

        {/* Project summary */}
        <div className="bg-surface-container-highest rounded-lg p-6 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Projeto</p>
          <p className="font-bold text-on-surface">{stepProjeto.nome}</p>
          {stepProjeto.descricao && <p className="text-sm text-on-surface-variant">{stepProjeto.descricao}</p>}
          <div className="space-y-0.5 mt-3">
            <p className="text-sm text-on-surface">
              <span className="text-on-surface-variant">Cliente: </span>{stepProjeto.cliente_nome}
            </p>
            {stepProjeto.cliente_telefone && (
              <p className="text-sm text-on-surface-variant">{stepProjeto.cliente_telefone}</p>
            )}
          </div>
        </div>

        <div className="bg-surface-container-highest rounded-lg px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Materiais</p>
          <p className="text-sm text-on-surface">{itens.length} item(ns) selecionado(s)</p>
        </div>

        <ResumoOrcamento />

        {saveError && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{saveError}</div>
        )}

        {/* Dark total block */}
        <div className="rounded-lg bg-foreground text-background px-6 py-5 flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-widest opacity-70">Total da Proposta</span>
          <span className="text-3xl font-black tracking-tighter">
            {resumo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1 gap-1.5" onClick={() => setPhase('wizard')} disabled={saving}>
            <ArrowLeft className="size-4" />
            Editar
          </Button>
          <Button type="button" className="flex-1" size="lg" onClick={handleFinalizar} disabled={saving}>
            {saving ? (
              <><Loader2 className="size-4 animate-spin" />Finalizando...</>
            ) : (
              <><CheckCheck className="size-4" />Finalizar</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Wizard phase ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* Progress bar */}
      <GrainProgress current={currentStep} total={TOTAL_STEPS} percent={percent} stepLabel={stepLabel} />

      {/* Save header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-on-surface">Novo orçamento</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {lastSaved
              ? `Rascunho salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Não salvo ainda'}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {saveError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{saveError}</div>
      )}

      {/* Step content */}
      {step === 1 && <StepProjeto onNext={() => {}} />}
      {step === 2 && (
        <div className="space-y-6">
          <StepMateriais onNext={() => {}} onBack={() => {}} />
        </div>
      )}
      {step === 3 && (
        <div className="space-y-6">
          <StepFinanceiro onNext={() => setPhase('review')} onBack={() => {}} />

          {/* Dark total preview */}
          <div className="rounded-lg bg-foreground text-background px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-3">Prévia do Total</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest opacity-70">Total estimado</span>
              <span className="text-3xl font-black tracking-tighter">
                {resumo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="mt-4">
              {/* Componente compartilhado com AlertDialog de confirmação ao ligar */}
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

      {/* Navigation footer for step 2+ */}
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
