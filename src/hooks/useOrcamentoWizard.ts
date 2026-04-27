import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useOrcamentoStore, type WizardStep } from '@/stores/useOrcamentoStore'
import { useOrcamento, ORCAMENTO_QUERY_KEY } from '@/hooks/useOrcamento'
import type {
  ItemOrcamentoCalculo,
  ResumoOrcamento,
  StepProjetoData,
  StepFinanceiroData,
} from '@/lib/calcular-orcamento'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'
import type { OrcamentoStatus } from '@/types/common'
import { ORCAMENTO_STATUS } from '@/constants/orcamento-status'
import { logError } from '@/lib/log-error'

// ── Helpers puros exportados para testabilidade ──────────────────────────────

// Valida integridade dos itens antes do insert para evitar violação do CHECK
// constraint (origem × campo relacional) no banco. Fail-fast no cliente.
export function validarItensParaInsert(itens: ItemOrcamentoCalculo[]): void {
  for (const item of itens) {
    if (item.origem === 'madeira_m3' && !item.madeira_m3_id) {
      throw new Error(
        `Item "${item.nome}" é do tipo madeira_m3 mas não tem madeira_m3_id definido.`,
      )
    }
    if (item.origem === 'outro_produto' && !item.outro_produto_id) {
      throw new Error(
        `Item "${item.nome}" é do tipo outro_produto mas não tem outro_produto_id definido.`,
      )
    }
  }
}

// Mapeia um item do store para o formato de insert em itens_orcamento,
// propagando os campos de snapshot corretos de acordo com a origem do item.
export function mapItemParaInsert(orcamentoId: string, item: ItemOrcamentoCalculo) {
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

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface SalvarOptions {
  // Quando omitido em modo edição, o status existente é preservado no banco.
  // Em modo novo, o default é rascunho quando não informado.
  status?: OrcamentoStatus
  // Passado na finalização para preservar a data original de finalizações anteriores
  finalizado_at?: string
}

export interface OrcamentoSnapshot {
  orcamento: Orcamento
  itens: ItemOrcamento[]
}

export interface UseOrcamentoWizardReturn {
  // Estado do wizard (lido do store)
  step: WizardStep
  setStep: (step: WizardStep) => void
  resumo: ResumoOrcamento
  stepProjeto: StepProjetoData
  itens: ItemOrcamentoCalculo[]
  stepFinanceiro: StepFinanceiroData

  // Estado de persistência
  isSaving: boolean
  lastSaved: Date | null
  saveError: string | null

  // Vinculação (modo novo apenas)
  loadingVinculacao: boolean
  madeireiraId: string | null

  // Carregamento do orçamento existente (modo edição apenas)
  loadingOrcamento: boolean
  orcamentoError: string | null
  orcamento: Orcamento | null
  hydrated: boolean

  // Toggle de detalhes no PDF
  mostrarDetalhes: boolean
  setMostrarDetalhes: (v: boolean) => void

  // Ações
  salvar: (options?: SalvarOptions) => Promise<string | null>
  salvarRascunho: () => Promise<void>
  // Monta snapshot local para geração do PDF sem round-trip ao banco
  buildSnapshotParaPdf: (id: string) => OrcamentoSnapshot
}

// ── Hook principal ────────────────────────────────────────────────────────────

/**
 * Centraliza toda a lógica do wizard de orçamento — novo e edição.
 * Quando `orcamentoId` é fornecido, opera em modo edição (UPDATE apenas).
 * Sem `orcamentoId`, opera em modo novo (INSERT na primeira save, UPDATE nas demais).
 */
export function useOrcamentoWizard(orcamentoId?: string): UseOrcamentoWizardReturn {
  const { carpinteiro } = useAuthStore()
  const queryClient = useQueryClient()

  // Modo edição: carrega o orçamento existente e seus itens
  const {
    orcamento,
    itens: itensOriginais,
    loading: loadingOrcamento,
    error: orcamentoError,
  } = useOrcamento(orcamentoId)

  // Selectors granulares: cada subscrição é independente, evitando re-renders em cascata
  // quando apenas um campo do store muda (ex: digitar em stepProjeto não re-renderiza stepFinanceiro)
  const step = useOrcamentoStore(s => s.step)
  const stepProjeto = useOrcamentoStore(s => s.stepProjeto)
  const itens = useOrcamentoStore(s => s.itens)
  const stepFinanceiro = useOrcamentoStore(s => s.stepFinanceiro)
  const resumo = useOrcamentoStore(s => s.resumo)
  const hydrate = useOrcamentoStore(s => s.hydrate)
  const reset = useOrcamentoStore(s => s.reset)
  const setStep = useOrcamentoStore(s => s.setStep)

  // ── Modo novo: vinculação ────────────────────────────────────────────────────
  // Carrega apenas quando não há orçamento existente para editar
  const [loadingVinculacao, setLoadingVinculacao] = useState(!orcamentoId)
  const [madeireiraId, setMadeireiraId] = useState<string | null>(null)
  const [tabelaId, setTabelaId] = useState<string | null>(null)

  // ── Estado de persistência ───────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)

  // Ref que guarda o ID criado pelo INSERT inicial no modo novo.
  // Null até o primeiro save — a partir daí todas as operações são UPDATE.
  const orcamentoIdRef = useRef<string | null>(null)

  // Ref que garante hydrate único — evita re-hidratação por mudanças de referência
  const hydratedRef = useRef(false)
  const [hydrated, setHydrated] = useState(false)

  // ── Modo novo: defaults do perfil ────────────────────────────────────────────
  useEffect(() => {
    if (orcamentoId) return
    // Pré-preenche campos financeiros a partir do perfil do carpinteiro;
    // o usuário pode sobrescrever em StepFinanceiro.
    reset({
      margem_lucro: carpinteiro?.margem_lucro_padrao ?? 0,
      valor_hora_mao_obra: carpinteiro?.valor_hora_mao_obra ?? 0,
      imposto: carpinteiro?.imposto_padrao ?? 0,
      custos_adicionais: carpinteiro?.custos_adicionais_padrao ?? 0,
      termos_condicoes: carpinteiro?.termos_condicoes_padrao ?? '',
    })
  }, [reset, carpinteiro, orcamentoId])

  // ── Modo novo: verifica vinculação aprovada para obter madeireiraId e tabelaId ─
  useEffect(() => {
    if (orcamentoId || !carpinteiro) return
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
    void checkVinculacao()
  }, [carpinteiro, orcamentoId])

  // ── Modo edição: hydrate do store com dados do orçamento carregado ───────────
  useEffect(() => {
    if (!orcamento || hydratedRef.current) return
    hydratedRef.current = true
    hydrate(orcamento, itensOriginais)
    setHydrated(true)
  }, [orcamento, itensOriginais, hydrate])

  // ── Modo edição: limpa o store ao desmontar para não contaminar próxima sessão ─
  useEffect(() => {
    if (!orcamentoId) return
    return () => reset()
  }, [reset, orcamentoId])

  // ── Função central de persistência ───────────────────────────────────────────
  const salvar = useCallback(
    async (options: SalvarOptions = {}): Promise<string | null> => {
      setIsSaving(true)
      setSaveError(null)

      try {
        let savedId: string

        if (orcamentoId) {
          // Modo edição: UPDATE sempre, com guarda server-side contra pedido_fechado.
          // status omitido → banco mantém o existente (patch parcial via spread condicional).
          const payload = {
            ...(options.status ? { status: options.status } : {}),
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
            // Custos extras precisam persistir — sem eles o banco grava 0 e reabertura perde os valores
            deslocamento: resumo.deslocamento,
            custos_adicionais: resumo.custos_adicionais,
            ...(options.finalizado_at ? { finalizado_at: options.finalizado_at } : {}),
          }

          // Guarda server-side: neq impede mutação de pedido_fechado mesmo via request direto
          const { data: linhas, error } = await supabase
            .from('orcamentos')
            .update(payload)
            .eq('id', orcamentoId)
            .neq('status', ORCAMENTO_STATUS.pedido_fechado.value)
            .select('id')
          if (error) throw error
          if (!linhas || linhas.length === 0) {
            setSaveError('Pedido fechado não pode ser editado.')
            return null
          }
          savedId = orcamentoId
        } else {
          // Modo novo: INSERT na primeira save, UPDATE nas seguintes
          if (!carpinteiro || !madeireiraId || !tabelaId) return null

          const payload = {
            carpinteiro_id: carpinteiro.id,
            madeireira_id: madeireiraId,
            tabela_snapshot_id: tabelaId,
            status: options.status ?? ORCAMENTO_STATUS.rascunho.value,
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
            deslocamento: resumo.deslocamento,
            custos_adicionais: resumo.custos_adicionais,
            ...(options.finalizado_at ? { finalizado_at: options.finalizado_at } : {}),
          }

          let id = orcamentoIdRef.current
          if (!id) {
            // Primeira save: INSERT e armazena o ID para todas as saves subsequentes
            const { data, error } = await supabase
              .from('orcamentos')
              .insert(payload)
              .select('id')
              .single()
            if (error) throw error
            id = data.id as string
            orcamentoIdRef.current = id
          } else {
            // Saves subsequentes: UPDATE no registro já criado
            const { error } = await supabase.from('orcamentos').update(payload).eq('id', id)
            if (error) throw error
          }
          savedId = id
        }

        // Sincroniza itens via delete + reinsert — estratégia atômica e segura
        validarItensParaInsert(itens)
        await supabase.from('itens_orcamento').delete().eq('orcamento_id', savedId)
        if (itens.length > 0) {
          await supabase
            .from('itens_orcamento')
            .insert(itens.map((item) => mapItemParaInsert(savedId, item)))
        }

        setLastSaved(new Date())

        // Invalida cache do orçamento salvo para que a tela de detalhe recarregue dados frescos
        void queryClient.invalidateQueries({ queryKey: [ORCAMENTO_QUERY_KEY, savedId] })

        return savedId
      } catch (err) {
        logError('useOrcamentoWizard/salvar', err)
        setSaveError('Erro ao salvar orçamento.')
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [orcamentoId, carpinteiro, madeireiraId, tabelaId, stepProjeto, stepFinanceiro, resumo, itens],
  )

  // salvarRascunho: conveniência para o autosave.
  // No modo novo: só salva quando há conteúdo mínimo (nome ou itens) e vinculação pronta.
  // No modo edição: preserva o status existente (não força rascunho).
  const salvarRascunho = useCallback(async () => {
    if (orcamentoId) {
      await salvar()
    } else {
      if (!carpinteiro || !madeireiraId || !tabelaId) return
      if (!stepProjeto.nome && itens.length === 0) return
      await salvar({ status: ORCAMENTO_STATUS.rascunho.value })
    }
  }, [salvar, orcamentoId, carpinteiro, madeireiraId, tabelaId, stepProjeto.nome, itens.length])

  // Autosave a cada 30s — inicia apenas quando os pré-requisitos estão prontos.
  // O cleanup do useEffect cancela o timer ao desmontar, evitando memory leak.
  useEffect(() => {
    const ready = orcamentoId ? hydrated : madeireiraId !== null
    if (!ready) return
    const timer = setInterval(() => void salvarRascunho(), 30_000)
    return () => clearInterval(timer)
  }, [orcamentoId, hydrated, madeireiraId, salvarRascunho])

  // ── Snapshot para PDF ─────────────────────────────────────────────────────────
  // Monta orcamento + itens a partir do estado atual do store, sem round-trip ao banco.
  // Modo edição: parte do orçamento carregado e sobrescreve com o estado atual.
  // Modo novo: constrói do zero com os dados disponíveis no hook.
  const buildSnapshotParaPdf = useCallback(
    (id: string): OrcamentoSnapshot => {
      const now = new Date().toISOString()

      const baseOrcamento = orcamento
        ? { ...orcamento }
        : {
            id,
            carpinteiro_id: carpinteiro?.id ?? '',
            madeireira_id: madeireiraId ?? '',
            tabela_snapshot_id: tabelaId ?? '',
            status: ORCAMENTO_STATUS.salvo.value,
            created_at: now,
            updated_at: now,
            finalizado_at: now,
          }

      const orcamentoParaPdf: Orcamento = {
        ...baseOrcamento,
        status: ORCAMENTO_STATUS.salvo.value,
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
        // Preserva data original de finalização se o orçamento já foi finalizado antes
        finalizado_at: orcamento?.finalizado_at ?? now,
      }

      // Mapeia itens do store para o formato esperado pelo gerador de PDF.
      // exactOptionalPropertyTypes: `origem` é opcional em ItemOrcamento — usa spread condicional.
      const itensParaPdf: ItemOrcamento[] = itens.map((item, idx) => ({
        id: item.uid ?? item.item_preco_id ?? String(idx),
        orcamento_id: id,
        item_preco_id: item.item_preco_id,
        nome: item.nome,
        unidade: item.unidade,
        preco_unitario: item.preco_unitario,
        quantidade: item.quantidade,
        subtotal: item.preco_unitario * item.quantidade,
        ...(item.origem !== undefined ? { origem: item.origem } : {}),
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

      return { orcamento: orcamentoParaPdf, itens: itensParaPdf }
    },
    [orcamento, carpinteiro, madeireiraId, tabelaId, stepProjeto, stepFinanceiro, resumo, itens],
  )

  return {
    step,
    setStep,
    resumo,
    stepProjeto,
    itens,
    stepFinanceiro,
    isSaving,
    lastSaved,
    saveError,
    loadingVinculacao,
    madeireiraId,
    loadingOrcamento,
    orcamentoError,
    orcamento,
    hydrated,
    mostrarDetalhes,
    setMostrarDetalhes,
    salvar,
    salvarRascunho,
    buildSnapshotParaPdf,
  }
}
