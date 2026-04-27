import { create } from 'zustand'
import {
  calcularOrcamento,
  type DadosFinanceiros,
  type ItemOrcamentoCalculo,
  type ResumoOrcamento,
  type StepFinanceiroData,
  type StepProjetoData,
} from '@/lib/calcular-orcamento'
import { buildMadeiraKey } from '@/lib/item-key'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'

export type WizardStep = 1 | 2 | 3

const DEFAULT_FINANCEIRO: StepFinanceiroData = {
  mao_obra_tipo: 'fixo',
  mao_obra_valor: 0,
  mao_obra_horas: null,
  margem_lucro: 0,
  imposto: 0,
  deslocamento: 0,
  custos_adicionais: 0,
  validade_dias: 30,
  termos_condicoes: '',
}

const DEFAULT_PROJETO: StepProjetoData = {
  tipo_projeto: 'movel',
  nome: '',
  descricao: '',
  cliente_nome: '',
  cliente_telefone: '',
  cliente_email: '',
}

const EMPTY_RESUMO: ResumoOrcamento = {
  subtotal_materiais: 0,
  subtotal_mao_obra: 0,
  valor_margem: 0,
  valor_imposto: 0,
  total: 0,
  deslocamento: 0,
  custos_adicionais: 0,
}

interface OrcamentoStore {
  // Wizard navigation
  step: WizardStep

  // Step data
  stepProjeto: StepProjetoData
  itens: ItemOrcamentoCalculo[]
  stepFinanceiro: StepFinanceiroData

  // Derived — recalculated on every mutating action
  resumo: ResumoOrcamento

  // Actions
  setStep: (step: WizardStep) => void
  setStepProjeto: (data: Partial<StepProjetoData>) => void
  addItem: (item: ItemOrcamentoCalculo) => void
  // uid é o identificador único da linha (item.uid ?? item.item_preco_id)
  removeItem: (uid: string) => void
  updateQuantidade: (uid: string, quantidade: number) => void
  setFinanceiro: (data: Partial<StepFinanceiroData>) => void
  // Popula todas as steps a partir de um orçamento existente — usado pela tela de edição
  hydrate: (orcamento: Orcamento, itens: ItemOrcamento[]) => void
  // Defaults opcionais pré-preenchidos a partir do perfil do carpinteiro (novo orçamento).
  // Quando `valor_hora_mao_obra` vem preenchido, assumimos mao_obra_tipo='hora' para que
  // o valor configurado no perfil seja aplicado automaticamente; o usuário pode trocar depois.
  reset: (defaults?: {
    margem_lucro?: number
    valor_hora_mao_obra?: number
    imposto?: number
    custos_adicionais?: number
    termos_condicoes?: string
  }) => void
}

// Retorna a chave única da linha: uid composto (madeira m³) ou item_preco_id (legado/outro_produto)
function getItemKey(item: ItemOrcamentoCalculo): string {
  return item.uid ?? item.item_preco_id
}

// Reconstrói uid e mapeia snapshot do banco para o formato de cálculo do store
function itemOrcamentoToCalculo(item: ItemOrcamento): ItemOrcamentoCalculo {
  // uid composto para madeira m³ — recria exatamente o padrão "madeira:{id}:{comprimento_id}:{acabamento_id|none}"
  // garantindo que removeItem e updateQuantidade funcionem corretamente após hydrate
  const uid =
    item.origem === 'madeira_m3' && item.madeira_m3_id && item.comprimento_id
      ? buildMadeiraKey({ id: item.madeira_m3_id, comprimentoId: item.comprimento_id, acabamentoId: item.acabamento_id ?? null })
      : undefined

  // exactOptionalPropertyTypes: campos opcionais só são incluídos quando possuem valor real,
  // pois passar `chave: undefined` explicitamente viola o contrato da flag.
  return {
    ...(uid !== undefined ? { uid } : {}),
    item_preco_id: item.item_preco_id,
    nome: item.nome,
    unidade: item.unidade,
    preco_unitario: item.preco_unitario,
    quantidade: item.quantidade,
    ...(item.origem !== undefined ? { origem: item.origem } : {}),
    ...(item.madeira_m3_id != null ? { madeira_m3_id: item.madeira_m3_id } : {}),
    ...(item.outro_produto_id != null ? { outro_produto_id: item.outro_produto_id } : {}),
    ...(item.especie_nome != null ? { especie_nome: item.especie_nome } : {}),
    ...(item.espessura_cm != null ? { espessura_cm: item.espessura_cm } : {}),
    ...(item.largura_cm != null ? { largura_cm: item.largura_cm } : {}),
    ...(item.comprimento_id != null ? { comprimento_id: item.comprimento_id } : {}),
    ...(item.comprimento_real_m != null ? { comprimento_real_m: item.comprimento_real_m } : {}),
    ...(item.acabamento_id != null ? { acabamento_id: item.acabamento_id } : {}),
    ...(item.acabamento_nome != null ? { acabamento_nome: item.acabamento_nome } : {}),
    ...(item.acabamento_percentual != null ? { acabamento_percentual: item.acabamento_percentual } : {}),
  }
}

function recalcular(
  itens: ItemOrcamentoCalculo[],
  financeiro: StepFinanceiroData,
): ResumoOrcamento {
  // Mapeia campos do wizard para a interface de cálculo puro
  const dados: DadosFinanceiros = {
    mao_obra_tipo: financeiro.mao_obra_tipo,
    mao_obra_valor: financeiro.mao_obra_valor,
    mao_obra_horas: financeiro.mao_obra_horas,
    margem_lucro: financeiro.margem_lucro,
    imposto: financeiro.imposto,
    deslocamento: financeiro.deslocamento,
    custos_adicionais: financeiro.custos_adicionais,
  }
  return calcularOrcamento(itens, dados)
}

export const useOrcamentoStore = create<OrcamentoStore>((set) => ({
  step: 1,
  stepProjeto: { ...DEFAULT_PROJETO },
  itens: [],
  stepFinanceiro: { ...DEFAULT_FINANCEIRO },
  resumo: { ...EMPTY_RESUMO },

  setStep(step) {
    set({ step })
  },

  setStepProjeto(data) {
    set((state) => ({
      stepProjeto: { ...state.stepProjeto, ...data },
    }))
  },

  addItem(item) {
    set((state) => {
      // Deduplicação por uid composto — garante que madeira m³ com comprimento/acabamento
      // diferentes sejam linhas separadas; legado e outro_produto usam item_preco_id
      const key = getItemKey(item)
      const existing = state.itens.find((i) => getItemKey(i) === key)
      const itens = existing
        ? state.itens.map((i) =>
            getItemKey(i) === key
              ? { ...i, quantidade: i.quantidade + item.quantidade }
              : i,
          )
        : [...state.itens, item]
      return { itens, resumo: recalcular(itens, state.stepFinanceiro) }
    })
  },

  removeItem(uid) {
    set((state) => {
      const itens = state.itens.filter((i) => getItemKey(i) !== uid)
      return { itens, resumo: recalcular(itens, state.stepFinanceiro) }
    })
  },

  updateQuantidade(uid, quantidade) {
    set((state) => {
      const itens =
        quantidade <= 0
          ? state.itens.filter((i) => getItemKey(i) !== uid)
          : state.itens.map((i) =>
              getItemKey(i) === uid ? { ...i, quantidade } : i,
            )
      return { itens, resumo: recalcular(itens, state.stepFinanceiro) }
    })
  },

  setFinanceiro(data) {
    set((state) => {
      const stepFinanceiro = { ...state.stepFinanceiro, ...data }
      return { stepFinanceiro, resumo: recalcular(state.itens, stepFinanceiro) }
    })
  },

  hydrate(orcamento, itens) {
    // Popula step de projeto com dados do orçamento existente
    const stepProjeto: StepProjetoData = {
      tipo_projeto: orcamento.tipo_projeto,
      nome: orcamento.nome,
      descricao: orcamento.descricao ?? '',
      cliente_nome: orcamento.cliente_nome,
      cliente_telefone: orcamento.cliente_telefone ?? '',
      cliente_email: orcamento.cliente_email ?? '',
    }

    // Popula step financeiro com todos os campos do orçamento salvo, incluindo custos extras
    const stepFinanceiro: StepFinanceiroData = {
      mao_obra_tipo: orcamento.mao_obra_tipo,
      mao_obra_valor: orcamento.mao_obra_valor,
      mao_obra_horas: orcamento.mao_obra_horas,
      margem_lucro: orcamento.margem_lucro,
      imposto: orcamento.imposto,
      deslocamento: orcamento.deslocamento,
      custos_adicionais: orcamento.custos_adicionais,
      validade_dias: orcamento.validade_dias,
      termos_condicoes: orcamento.termos_condicoes ?? '',
    }

    // Converte itens do banco para o formato do store, reconstituindo uids compostos
    const itensCalculo = itens.map(itemOrcamentoToCalculo)

    // Recalcula resumo a partir dos dados hidratados
    const resumo = recalcular(itensCalculo, stepFinanceiro)

    set({ step: 1, stepProjeto, itens: itensCalculo, stepFinanceiro, resumo })
  },

  reset(defaults) {
    // Mescla defaults do perfil do carpinteiro ao step financeiro inicial;
    // valores explícitos sobrescrevem os defaults da constante apenas quando fornecidos.
    // Se o perfil tem valor/hora cadastrado, o tipo de mão de obra inicia como 'hora'
    // (o usuário pode alternar para 'fixo' manualmente no StepFinanceiro).
    const temValorHora = defaults?.valor_hora_mao_obra && defaults.valor_hora_mao_obra > 0
    set({
      step: 1,
      stepProjeto: { ...DEFAULT_PROJETO },
      itens: [],
      stepFinanceiro: {
        ...DEFAULT_FINANCEIRO,
        mao_obra_tipo: temValorHora ? 'hora' : DEFAULT_FINANCEIRO.mao_obra_tipo,
        mao_obra_valor: defaults?.valor_hora_mao_obra ?? DEFAULT_FINANCEIRO.mao_obra_valor,
        margem_lucro: defaults?.margem_lucro ?? DEFAULT_FINANCEIRO.margem_lucro,
        imposto: defaults?.imposto ?? DEFAULT_FINANCEIRO.imposto,
        custos_adicionais: defaults?.custos_adicionais ?? DEFAULT_FINANCEIRO.custos_adicionais,
        termos_condicoes: defaults?.termos_condicoes ?? DEFAULT_FINANCEIRO.termos_condicoes,
      },
      resumo: { ...EMPTY_RESUMO },
    })
  },
}))
