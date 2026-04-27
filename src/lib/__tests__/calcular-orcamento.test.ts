import { describe, it, expect } from 'vitest'
import { calcularOrcamento } from '@/lib/calcular-orcamento'
import type { ItemOrcamentoCalculo, DadosFinanceiros } from '@/lib/calcular-orcamento'

// Helpers para montar fixtures mínimos e reutilizáveis por caso
function makeItem(overrides: Partial<ItemOrcamentoCalculo> = {}): ItemOrcamentoCalculo {
  return {
    item_preco_id: 'item-fixture',
    nome: 'Produto Teste',
    unidade: 'un',
    preco_unitario: 100,
    quantidade: 1,
    ...overrides,
  }
}

function makeFinanceiro(overrides: Partial<DadosFinanceiros> = {}): DadosFinanceiros {
  return {
    mao_obra_tipo: 'fixo',
    mao_obra_valor: 0,
    mao_obra_horas: null,
    margem_lucro: 0,
    imposto: 0,
    deslocamento: 0,
    custos_adicionais: 0,
    ...overrides,
  }
}

describe('calcularOrcamento', () => {
  // Garante que a soma dos materiais acumula preco_unitario × quantidade de cada item
  describe('subtotal_materiais', () => {
    it('soma vários itens com quantidades diferentes', () => {
      const itens = [
        makeItem({ item_preco_id: 'a', preco_unitario: 200, quantidade: 3 }), // 600
        makeItem({ item_preco_id: 'b', preco_unitario: 50,  quantidade: 4 }), // 200
        makeItem({ item_preco_id: 'c', preco_unitario: 100, quantidade: 1 }), // 100
      ]
      const resumo = calcularOrcamento(itens, makeFinanceiro())
      expect(resumo.subtotal_materiais).toBe(900)
    })

    it('retorna zero quando não há itens', () => {
      const resumo = calcularOrcamento([], makeFinanceiro())
      expect(resumo.subtotal_materiais).toBe(0)
    })
  })

  // Mão de obra fixa: usa mao_obra_valor direto, sem multiplicar por horas
  describe('mao_obra_tipo fixo', () => {
    it('usa mao_obra_valor como subtotal de mão de obra', () => {
      const resumo = calcularOrcamento(
        [],
        makeFinanceiro({ mao_obra_tipo: 'fixo', mao_obra_valor: 500 }),
      )
      expect(resumo.subtotal_mao_obra).toBe(500)
    })
  })

  // Mão de obra por hora: multiplica valor unitário pelas horas estimadas
  describe('mao_obra_tipo hora', () => {
    it('multiplica mao_obra_valor por mao_obra_horas', () => {
      const resumo = calcularOrcamento(
        [],
        makeFinanceiro({ mao_obra_tipo: 'hora', mao_obra_valor: 80, mao_obra_horas: 5 }),
      )
      expect(resumo.subtotal_mao_obra).toBe(400)
    })

    it('usa zero quando mao_obra_horas é null', () => {
      const resumo = calcularOrcamento(
        [],
        makeFinanceiro({ mao_obra_tipo: 'hora', mao_obra_valor: 80, mao_obra_horas: null }),
      )
      expect(resumo.subtotal_mao_obra).toBe(0)
    })
  })

  // deslocamento e custos_adicionais devem ser repassados no resumo e compor a base
  // antes de incidir margem e imposto (regra de negócio da migration 003)
  describe('deslocamento e custos_adicionais', () => {
    it('repassa ambos os campos no resumo retornado', () => {
      const resumo = calcularOrcamento(
        [],
        makeFinanceiro({ deslocamento: 50, custos_adicionais: 100 }),
      )
      expect(resumo.deslocamento).toBe(50)
      expect(resumo.custos_adicionais).toBe(100)
    })

    it('inclui deslocamento e custos_adicionais na base antes de aplicar margem', () => {
      // base = 0 (materiais) + 0 (mão de obra) + 60 (desloc) + 40 (custos) = 100
      // margem 10% → valor_margem = 10, total = 110
      const resumo = calcularOrcamento(
        [],
        makeFinanceiro({ deslocamento: 60, custos_adicionais: 40, margem_lucro: 10 }),
      )
      expect(resumo.valor_margem).toBeCloseTo(10)
      expect(resumo.total).toBeCloseTo(110)
    })
  })

  // Fórmula completa: (base) × (1 + margem%) × (1 + imposto%)
  // base = subtotal_materiais + subtotal_mao_obra + deslocamento + custos_adicionais
  describe('aplicação de margem e imposto', () => {
    it('calcula valor_margem e valor_imposto sobre a base completa', () => {
      // materiais=1000, mao_obra_fixo=200, desloc=50, custos=50 → base=1300
      // margem 10% → valor_margem=130, com_margem=1430
      // imposto 5%  → valor_imposto=71,50, total=1501,50
      const itens = [makeItem({ preco_unitario: 1000, quantidade: 1 })]
      const resumo = calcularOrcamento(
        itens,
        makeFinanceiro({
          mao_obra_tipo: 'fixo',
          mao_obra_valor: 200,
          deslocamento: 50,
          custos_adicionais: 50,
          margem_lucro: 10,
          imposto: 5,
        }),
      )
      expect(resumo.subtotal_materiais).toBe(1000)
      expect(resumo.subtotal_mao_obra).toBe(200)
      expect(resumo.valor_margem).toBeCloseTo(130)
      expect(resumo.valor_imposto).toBeCloseTo(71.5)
      expect(resumo.total).toBeCloseTo(1501.5)
    })
  })

  // Caso de borda: sem acréscimos → total deve ser idêntico à base
  describe('margem=0 e imposto=0', () => {
    it('total é igual à base quando margem e imposto são zero', () => {
      const itens = [makeItem({ preco_unitario: 300, quantidade: 2 })] // 600
      const resumo = calcularOrcamento(
        itens,
        makeFinanceiro({ mao_obra_tipo: 'fixo', mao_obra_valor: 100 }),
      )
      expect(resumo.valor_margem).toBe(0)
      expect(resumo.valor_imposto).toBe(0)
      expect(resumo.total).toBe(700)
    })
  })
})
