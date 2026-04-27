import { describe, it, expect } from 'vitest'
import { validarItensParaInsert, mapItemParaInsert } from '@/hooks/useOrcamentoWizard'
import type { ItemOrcamentoCalculo } from '@/lib/calcular-orcamento'

// Helper para montar item de fixture com valores padrão
function makeItem(overrides: Partial<ItemOrcamentoCalculo> = {}): ItemOrcamentoCalculo {
  return {
    item_preco_id: 'item-fixture',
    nome: 'Produto Teste',
    unidade: 'un',
    preco_unitario: 100,
    quantidade: 2,
    ...overrides,
  }
}

// ── validarItensParaInsert ────────────────────────────────────────────────────

describe('validarItensParaInsert', () => {
  it('não lança para lista vazia', () => {
    expect(() => validarItensParaInsert([])).not.toThrow()
  })

  it('não lança para item legado_planilha sem campos relacionais', () => {
    expect(() =>
      validarItensParaInsert([makeItem({ origem: 'legado_planilha' })]),
    ).not.toThrow()
  })

  it('não lança para item sem origem definida (compatibilidade legado)', () => {
    expect(() => validarItensParaInsert([makeItem()])).not.toThrow()
  })

  it('não lança para madeira_m3 com madeira_m3_id definido', () => {
    expect(() =>
      validarItensParaInsert([makeItem({ origem: 'madeira_m3', madeira_m3_id: 'mad-1' })]),
    ).not.toThrow()
  })

  it('lança para madeira_m3 sem madeira_m3_id — violaria CHECK constraint no banco', () => {
    expect(() =>
      validarItensParaInsert([makeItem({ nome: 'Viga Cambará', origem: 'madeira_m3' })]),
    ).toThrow('Viga Cambará')
  })

  it('não lança para outro_produto com outro_produto_id definido', () => {
    expect(() =>
      validarItensParaInsert([makeItem({ origem: 'outro_produto', outro_produto_id: 'prod-1' })]),
    ).not.toThrow()
  })

  it('lança para outro_produto sem outro_produto_id — violaria CHECK constraint no banco', () => {
    expect(() =>
      validarItensParaInsert([makeItem({ nome: 'Parafuso 3/8', origem: 'outro_produto' })]),
    ).toThrow('Parafuso 3/8')
  })

  it('valida todos os itens — lança no primeiro inválido encontrado', () => {
    const itens = [
      makeItem({ origem: 'madeira_m3', madeira_m3_id: 'mad-1' }), // válido
      makeItem({ nome: 'Item ruim', origem: 'madeira_m3' }),        // inválido
    ]
    expect(() => validarItensParaInsert(itens)).toThrow('Item ruim')
  })
})

// ── mapItemParaInsert — branch legado_planilha ────────────────────────────────

describe('mapItemParaInsert — branch legado_planilha', () => {
  const ORC_ID = 'orc-abc'

  it('preserva item_preco_id e define origem legado_planilha', () => {
    const row = mapItemParaInsert(ORC_ID, makeItem({ item_preco_id: 'preco-42' })) as Record<
      string,
      unknown
    >
    expect(row.orcamento_id).toBe(ORC_ID)
    expect(row.origem).toBe('legado_planilha')
    expect(row.item_preco_id).toBe('preco-42')
  })

  it('calcula subtotal como preco_unitario × quantidade', () => {
    const row = mapItemParaInsert(ORC_ID, makeItem({ preco_unitario: 75, quantidade: 4 }))
    expect(row.subtotal).toBe(300)
  })
})

// ── mapItemParaInsert — branch madeira_m3 ────────────────────────────────────

describe('mapItemParaInsert — branch madeira_m3', () => {
  const ORC_ID = 'orc-123'

  it('inclui snapshot completo de dimensões e acabamento', () => {
    const item = makeItem({
      origem: 'madeira_m3',
      madeira_m3_id: 'mad-1',
      especie_nome: 'Cambará',
      espessura_cm: 5,
      largura_cm: 15,
      comprimento_real_m: 1,
      comprimento_id: 'comp-1',
      acabamento_id: 'acab-1',
      acabamento_nome: 'Verniz',
      acabamento_percentual: 10,
    })
    const row = mapItemParaInsert(ORC_ID, item) as Record<string, unknown>
    expect(row.origem).toBe('madeira_m3')
    expect(row.item_preco_id).toBeNull()
    expect(row.madeira_m3_id).toBe('mad-1')
    expect(row.especie_nome).toBe('Cambará')
    expect(row.espessura_cm).toBe(5)
    expect(row.largura_cm).toBe(15)
    expect(row.comprimento_real_m).toBe(1)
    expect(row.comprimento_id).toBe('comp-1')
    expect(row.acabamento_nome).toBe('Verniz')
    expect(row.acabamento_percentual).toBe(10)
  })

  it('campos de snapshot ficam null quando ausentes — preserva schema correto', () => {
    const row = mapItemParaInsert(
      ORC_ID,
      makeItem({ origem: 'madeira_m3', madeira_m3_id: 'mad-2' }),
    ) as Record<string, unknown>
    expect(row.especie_nome).toBeNull()
    expect(row.espessura_cm).toBeNull()
    expect(row.acabamento_id).toBeNull()
    expect(row.acabamento_nome).toBeNull()
    expect(row.acabamento_percentual).toBeNull()
  })

  it('calcula subtotal corretamente', () => {
    const row = mapItemParaInsert(
      ORC_ID,
      makeItem({ origem: 'madeira_m3', madeira_m3_id: 'mad-3', preco_unitario: 31.5, quantidade: 3 }),
    )
    expect(row.subtotal).toBeCloseTo(94.5)
  })
})

// ── mapItemParaInsert — branch outro_produto ──────────────────────────────────

describe('mapItemParaInsert — branch outro_produto', () => {
  const ORC_ID = 'orc-999'

  it('inclui outro_produto_id e anula item_preco_id', () => {
    const row = mapItemParaInsert(
      ORC_ID,
      makeItem({ origem: 'outro_produto', outro_produto_id: 'prod-99' }),
    ) as Record<string, unknown>
    expect(row.origem).toBe('outro_produto')
    expect(row.item_preco_id).toBeNull()
    expect(row.outro_produto_id).toBe('prod-99')
  })

  it('não inclui campos de madeira no payload', () => {
    const row = mapItemParaInsert(
      ORC_ID,
      makeItem({ origem: 'outro_produto', outro_produto_id: 'prod-10' }),
    ) as Record<string, unknown>
    expect(row).not.toHaveProperty('madeira_m3_id')
    expect(row).not.toHaveProperty('especie_nome')
    expect(row).not.toHaveProperty('espessura_cm')
  })
})
