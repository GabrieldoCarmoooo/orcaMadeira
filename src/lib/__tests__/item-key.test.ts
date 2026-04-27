import { describe, it, expect } from 'vitest'
import { buildMadeiraKey, parseMadeiraKey } from '@/lib/item-key'

describe('buildMadeiraKey', () => {
  it('constrói chave com acabamento explícito', () => {
    expect(buildMadeiraKey({ id: 'id-madeira', comprimentoId: 'id-comp', acabamentoId: 'id-acab' }))
      .toBe('madeira:id-madeira:id-comp:id-acab')
  })

  it('usa sentinel "none" quando acabamento é omitido', () => {
    expect(buildMadeiraKey({ id: 'id-madeira', comprimentoId: 'id-comp' }))
      .toBe('madeira:id-madeira:id-comp:none')
  })

  it('usa sentinel "none" quando acabamento é null', () => {
    expect(buildMadeiraKey({ id: 'id-madeira', comprimentoId: 'id-comp', acabamentoId: null }))
      .toBe('madeira:id-madeira:id-comp:none')
  })

  it('usa sentinel "none" quando acabamento é undefined', () => {
    expect(buildMadeiraKey({ id: 'id-madeira', comprimentoId: 'id-comp' }))
      .toBe('madeira:id-madeira:id-comp:none')
  })

  it('funciona com UUIDs reais como ids', () => {
    const result = buildMadeiraKey({
      id: '550e8400-e29b-41d4-a716-446655440000',
      comprimentoId: '550e8400-e29b-41d4-a716-446655440001',
      acabamentoId: '550e8400-e29b-41d4-a716-446655440002',
    })
    expect(result).toBe(
      'madeira:550e8400-e29b-41d4-a716-446655440000:550e8400-e29b-41d4-a716-446655440001:550e8400-e29b-41d4-a716-446655440002',
    )
  })
})

describe('parseMadeiraKey', () => {
  it('parseia chave com acabamento', () => {
    expect(parseMadeiraKey('madeira:id-madeira:id-comp:id-acab')).toEqual({
      madeira_m3_id: 'id-madeira',
      comprimento_id: 'id-comp',
      acabamento_id: 'id-acab',
    })
  })

  it('converte sentinel "none" para undefined', () => {
    expect(parseMadeiraKey('madeira:id-madeira:id-comp:none')).toEqual({
      madeira_m3_id: 'id-madeira',
      comprimento_id: 'id-comp',
      acabamento_id: undefined,
    })
  })

  it('retorna null para chave com prefixo errado', () => {
    expect(parseMadeiraKey('outro:id-madeira:id-comp:none')).toBeNull()
  })

  it('retorna null para chave com partes insuficientes', () => {
    expect(parseMadeiraKey('madeira:id-madeira:id-comp')).toBeNull()
  })

  it('retorna null para string sem separador', () => {
    expect(parseMadeiraKey('invalido')).toBeNull()
  })

  it('retorna null para string vazia', () => {
    expect(parseMadeiraKey('')).toBeNull()
  })
})

describe('roundtrip buildMadeiraKey ↔ parseMadeiraKey', () => {
  it('é roundtrip-safe com acabamento', () => {
    const params = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      comprimentoId: '550e8400-e29b-41d4-a716-446655440001',
      acabamentoId: '550e8400-e29b-41d4-a716-446655440002',
    }
    const key = buildMadeiraKey(params)
    const parsed = parseMadeiraKey(key)
    expect(parsed).toEqual({
      madeira_m3_id: params.id,
      comprimento_id: params.comprimentoId,
      acabamento_id: params.acabamentoId,
    })
  })

  it('é roundtrip-safe sem acabamento (undefined)', () => {
    const params = { id: 'uuid-1', comprimentoId: 'uuid-2' }
    const key = buildMadeiraKey(params)
    const parsed = parseMadeiraKey(key)
    expect(parsed).toEqual({
      madeira_m3_id: params.id,
      comprimento_id: params.comprimentoId,
      acabamento_id: undefined,
    })
  })

  it('é roundtrip-safe sem acabamento (null)', () => {
    const key = buildMadeiraKey({ id: 'uuid-1', comprimentoId: 'uuid-2', acabamentoId: null })
    const parsed = parseMadeiraKey(key)
    expect(parsed?.acabamento_id).toBeUndefined()
  })
})
