import { create } from 'zustand'
import {
  calcularOrcamento,
  type DadosFinanceiros,
  type ItemOrcamentoCalculo,
  type ResumoOrcamento,
  type StepFinanceiroData,
  type StepProjetoData,
} from '@/lib/calcular-orcamento'

export type WizardStep = 1 | 2 | 3

const DEFAULT_FINANCEIRO: StepFinanceiroData = {
  mao_obra_tipo: 'fixo',
  mao_obra_valor: 0,
  mao_obra_horas: null,
  margem_lucro: 0,
  imposto: 0,
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
  reset: () => void
}

// Retorna a chave única da linha: uid composto (madeira m³) ou item_preco_id (legado/outro_produto)
function getItemKey(item: ItemOrcamentoCalculo): string {
  return item.uid ?? item.item_preco_id
}

function recalcular(
  itens: ItemOrcamentoCalculo[],
  financeiro: StepFinanceiroData,
): ResumoOrcamento {
  const dados: DadosFinanceiros = {
    mao_obra_tipo: financeiro.mao_obra_tipo,
    mao_obra_valor: financeiro.mao_obra_valor,
    mao_obra_horas: financeiro.mao_obra_horas,
    margem_lucro: financeiro.margem_lucro,
    imposto: financeiro.imposto,
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

  reset() {
    set({
      step: 1,
      stepProjeto: { ...DEFAULT_PROJETO },
      itens: [],
      stepFinanceiro: { ...DEFAULT_FINANCEIRO },
      resumo: { ...EMPTY_RESUMO },
    })
  },
}))
