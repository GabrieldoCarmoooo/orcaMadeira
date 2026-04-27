import { describe, it, expect } from 'vitest'
import {
  calcularValorVendaM3,
  calcularValorMadeiraM3,
  aplicarAcabamento,
  calcularPrecoLinhaMadeiraM3,
} from '@/lib/calcular-madeira'

describe('calcularValorVendaM3', () => {
  // Exemplo canônico do CLAUDE.md: Cambará a R$ 3.500 com margem 20% → R$ 4.200/m³
  it('aplica margem sobre o custo por m³ (caso Cambará CLAUDE.md)', () => {
    expect(calcularValorVendaM3(3500, 20)).toBe(4200)
  })

  // Margem zero: preço de venda deve ser igual ao custo (sem acréscimo)
  it('retorna custo_m3 quando margem é 0%', () => {
    expect(calcularValorVendaM3(3500, 0)).toBe(3500)
  })

  it('calcula margens fracionárias corretamente', () => {
    // custo=1000, margem=12.5% → 1000 × 1.125 = 1125
    expect(calcularValorVendaM3(1000, 12.5)).toBeCloseTo(1125)
  })
})

describe('calcularValorMadeiraM3', () => {
  // Caso completo do CLAUDE.md: Viga 5×15 Cambará, 1m, espécie a R$ 4.200/m³ → R$ 31,50
  // Fórmula: (5/100) × (15/100) × 1 × 4.200 = 0,0075 × 4.200 = 31,50
  it('retorna 31,50 para o exemplo Cambará do CLAUDE.md', () => {
    const valorVendaM3 = calcularValorVendaM3(3500, 20) // R$ 4.200
    const preco = calcularValorMadeiraM3(5, 15, 1, valorVendaM3)
    expect(preco).toBeCloseTo(31.5, 5)
  })

  // Verifica o cálculo com comprimento diferente de 1m (proporcional)
  it('escala proporcionalmente para comprimentos maiores', () => {
    const valorVendaM3 = calcularValorVendaM3(3500, 20) // R$ 4.200
    const preco2m = calcularValorMadeiraM3(5, 15, 2, valorVendaM3)
    expect(preco2m).toBeCloseTo(63.0, 5)
  })

  // Dimensões fracionárias (ex: espessura 2,5 cm, largura 7,5 cm, 1,2 m)
  it('lida com dimensões fracionárias sem perda de precisão', () => {
    // (2.5/100) × (7.5/100) × 1.2 × 4000 = 0.025 × 0.075 × 1.2 × 4000 = 9.00
    const preco = calcularValorMadeiraM3(2.5, 7.5, 1.2, 4000)
    expect(preco).toBeCloseTo(9.0, 5)
  })

  // Quando valorVendaM3 = 0, qualquer peça deve custar R$ 0 (borda)
  it('retorna zero quando valor_m3_venda é zero', () => {
    expect(calcularValorMadeiraM3(5, 15, 1, 0)).toBe(0)
  })
})

describe('calcularPrecoLinhaMadeiraM3', () => {
  const especieCambara = { custo_m3: 3500, margem_lucro_pct: 20 }
  const dimsViga = { espessura_cm: 5, largura_cm: 15, comprimento_m: 1 }

  // Caso canônico: Cambará 5×15×1m sem acabamento → R$ 31,50
  it('retorna 31,50 para Cambará 5×15×1m sem acabamento (caso CLAUDE.md)', () => {
    expect(calcularPrecoLinhaMadeiraM3(especieCambara, dimsViga)).toBeCloseTo(31.5, 5)
  })

  // Acabamento +10% sobre o preço base de R$ 31,50 → R$ 34,65
  it('aplica acabamento multiplicativo sobre o preço base', () => {
    const acabamento = { percentual_acrescimo: 10 }
    expect(calcularPrecoLinhaMadeiraM3(especieCambara, dimsViga, acabamento)).toBeCloseTo(34.65, 5)
  })

  // Sem espécie vinculada deve retornar 0 (produto incompleto no catálogo)
  it('retorna 0 quando espécie é null', () => {
    expect(calcularPrecoLinhaMadeiraM3(null, dimsViga)).toBe(0)
  })

  // Sem espécie vinculada mesmo com acabamento informado → 0
  it('retorna 0 quando espécie é undefined, ignorando acabamento', () => {
    const acabamento = { percentual_acrescimo: 50 }
    expect(calcularPrecoLinhaMadeiraM3(undefined, dimsViga, acabamento)).toBe(0)
  })

  // Acabamento null equivale a sem acabamento (retorna preço base)
  it('trata acabamento null como ausente', () => {
    expect(calcularPrecoLinhaMadeiraM3(especieCambara, dimsViga, null)).toBeCloseTo(31.5, 5)
  })
})

describe('aplicarAcabamento', () => {
  // Acabamento 10% sobre R$ 31,50 → R$ 34,65 (caso citado no CLAUDE.md)
  it('aplica markup multiplicativo de 10% sobre o preço base', () => {
    expect(aplicarAcabamento(31.5, 10)).toBeCloseTo(34.65, 5)
  })

  // Acabamento 0%: preço não deve mudar
  it('retorna preco_base inalterado quando percentual é 0%', () => {
    expect(aplicarAcabamento(31.5, 0)).toBeCloseTo(31.5, 5)
  })

  // Percentual fracionário
  it('aplica percentual fracionário corretamente', () => {
    // 100 × (1 + 0.075) = 107.50
    expect(aplicarAcabamento(100, 7.5)).toBeCloseTo(107.5, 5)
  })
})
