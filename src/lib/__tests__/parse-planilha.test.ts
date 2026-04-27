import { describe, it, expect } from 'vitest'
import {
  validatePlanilha,
  parsePlanilha,
  ParseError,
  type ParseResult,
} from '@/lib/parse-planilha'

// Helper: cria um ParseResult sintético para testar validatePlanilha sem arquivo real
function makeResult(
  headers: string[],
  rows: Record<string, string>[],
): ParseResult {
  return { headers, rows }
}

// Helper: cria um File CSV a partir de texto plano
function makeCsvFile(content: string, filename = 'planilha.csv'): File {
  return new File([content], filename, { type: 'text/csv' })
}

// ─── validatePlanilha ──────────────────────────────────────────────────────────

describe('validatePlanilha', () => {

  // Caso 1 — detecção de headers obrigatórios ausentes
  describe('detecção de colunas obrigatórias', () => {
    it('lança ParseError quando "preco_unitario" está ausente', () => {
      const result = makeResult(
        ['nome', 'unidade'],
        [{ nome: 'Madeira', unidade: 'm³' }],
      )
      expect(() => validatePlanilha(result)).toThrow(ParseError)
      expect(() => validatePlanilha(result)).toThrow(/preco_unitario/)
    })

    it('lança ParseError listando todas as colunas ausentes', () => {
      // Apenas "nome" presente — "unidade" e "preco_unitario" devem aparecer no erro
      const result = makeResult(['nome'], [{ nome: 'Madeira' }])
      expect(() => validatePlanilha(result)).toThrow(/unidade/)
      expect(() => validatePlanilha(result)).toThrow(/preco_unitario/)
    })

    it('não lança quando todas as colunas obrigatórias estão presentes', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'X', unidade: 'un', preco_unitario: '1' }],
      )
      expect(() => validatePlanilha(result)).not.toThrow()
    })
  })

  // Caso 2 — linha completamente válida
  describe('linha válida', () => {
    it('importa linha com todos os campos obrigatórios preenchidos e preço positivo', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Madeira Ipê', unidade: 'm³', preco_unitario: '250.50' }],
      )
      const { rows, errors } = validatePlanilha(result)
      expect(errors).toHaveLength(0)
      expect(rows).toHaveLength(1)
      // noUncheckedIndexedAccess: ! seguro pois expect acima garante length >= 1
      expect(rows[0]!).toMatchObject({
        rowIndex: 1,
        nome: 'Madeira Ipê',
        unidade: 'm³',
        preco_unitario: 250.5,
      })
    })

    it('aceita preço zero (produto gratuito ou incluso)', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Brinde', unidade: 'un', preco_unitario: '0' }],
      )
      const { rows, errors } = validatePlanilha(result)
      expect(errors).toHaveLength(0)
      expect(rows[0]!.preco_unitario).toBe(0)
    })

    it('aceita vírgula como separador decimal (pt-BR)', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Prego', unidade: 'kg', preco_unitario: '12,75' }],
      )
      const { rows } = validatePlanilha(result)
      expect(rows[0]!.preco_unitario).toBe(12.75)
    })
  })

  // Caso 3 — rejeição de preço negativo
  describe('preço negativo', () => {
    it('rejeita linha com preco_unitario negativo e registra o erro', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Prego', unidade: 'kg', preco_unitario: '-5' }],
      )
      const { rows, errors } = validatePlanilha(result)
      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
      expect(errors[0]!.rowIndex).toBe(1)
      expect(errors[0]!.message).toMatch(/negativo/)
    })

    it('rejeita valor não-numérico em preco_unitario', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Prego', unidade: 'kg', preco_unitario: 'abc' }],
      )
      const { rows, errors } = validatePlanilha(result)
      expect(rows).toHaveLength(0)
      expect(errors[0]!.message).toMatch(/inválido/)
    })
  })

  // Caso 4 — rejeição de campo obrigatório vazio
  describe('campo obrigatório vazio', () => {
    it('rejeita linha com "nome" vazio', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: '', unidade: 'un', preco_unitario: '10' }],
      )
      const { rows, errors } = validatePlanilha(result)
      expect(rows).toHaveLength(0)
      expect(errors[0]!.message).toMatch(/nome/)
    })

    it('rejeita linha com "unidade" vazia', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Prego', unidade: '', preco_unitario: '10' }],
      )
      const { rows, errors } = validatePlanilha(result)
      expect(rows).toHaveLength(0)
      expect(errors[0]!.message).toMatch(/unidade/)
    })

    it('rejeita linha com "preco_unitario" vazio', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Prego', unidade: 'kg', preco_unitario: '' }],
      )
      const { rows, errors } = validatePlanilha(result)
      expect(rows).toHaveLength(0)
      expect(errors[0]!.message).toMatch(/preco_unitario/)
    })
  })

  // Caso 5 — linhas mistas (válidas e inválidas no mesmo arquivo)
  describe('linhas mistas', () => {
    it('importa linhas válidas mesmo quando há erros em outras', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [
          { nome: 'Madeira Ipê', unidade: 'm³', preco_unitario: '100' },  // válida → row 1
          { nome: '', unidade: 'kg', preco_unitario: '50' },               // inválida (nome vazio) → error 2
          { nome: 'Prego', unidade: 'kg', preco_unitario: '-1' },          // inválida (negativo) → error 3
          { nome: 'Tinta', unidade: 'L', preco_unitario: '35.00' },        // válida → row 4
        ],
      )
      const { rows, errors } = validatePlanilha(result)

      // Duas linhas válidas importadas
      expect(rows).toHaveLength(2)
      expect(rows[0]!.nome).toBe('Madeira Ipê')
      expect(rows[1]!.nome).toBe('Tinta')

      // Dois erros reportados com rowIndex correto
      expect(errors).toHaveLength(2)
      expect(errors[0]!.rowIndex).toBe(2)
      expect(errors[1]!.rowIndex).toBe(3)
    })

    it('reporta rowIndex baseado na posição original do arquivo (1-based)', () => {
      // Apenas a terceira linha tem erro — rowIndex deve ser 3
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [
          { nome: 'A', unidade: 'un', preco_unitario: '1' },
          { nome: 'B', unidade: 'un', preco_unitario: '2' },
          { nome: '', unidade: 'un', preco_unitario: '3' }, // inválida
        ],
      )
      const { errors } = validatePlanilha(result)
      expect(errors[0]!.rowIndex).toBe(3)
    })
  })

  // Caso 6 — colunas opcionais
  describe('colunas opcionais', () => {
    it('captura categoria, código, descrição e disponível quando presentes', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario', 'categoria', 'código', 'descrição', 'disponível'],
        [
          {
            nome: 'Ipê',
            unidade: 'm³',
            preco_unitario: '200',
            categoria: 'Madeira',
            'código': 'IPE-001',
            'descrição': 'Madeira de lei nobre',
            'disponível': 'true',
          },
        ],
      )
      const { rows } = validatePlanilha(result)
      expect(rows).toHaveLength(1)
      expect(rows[0]!.categoria).toBe('Madeira')
      expect(rows[0]!.codigo).toBe('IPE-001')
      expect(rows[0]!.descricao).toBe('Madeira de lei nobre')
      expect(rows[0]!.disponivel).toBe(true)
    })

    it('mapeia "disponível=false" para false', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario', 'disponível'],
        [{ nome: 'Item', unidade: 'un', preco_unitario: '10', 'disponível': 'false' }],
      )
      const { rows } = validatePlanilha(result)
      expect(rows[0]!.disponivel).toBe(false)
    })

    it('não inclui campos opcionais ausentes no objeto retornado', () => {
      const result = makeResult(
        ['nome', 'unidade', 'preco_unitario'],
        [{ nome: 'Prego', unidade: 'kg', preco_unitario: '5' }],
      )
      const { rows } = validatePlanilha(result)
      expect(rows[0]!.categoria).toBeUndefined()
      expect(rows[0]!.codigo).toBeUndefined()
      expect(rows[0]!.descricao).toBeUndefined()
      expect(rows[0]!.disponivel).toBeUndefined()
    })
  })
})

// ─── parsePlanilha ─────────────────────────────────────────────────────────────

describe('parsePlanilha', () => {
  it('lança ParseError para formato não suportado', async () => {
    const file = new File(['conteúdo'], 'arquivo.pdf', { type: 'application/pdf' })
    await expect(parsePlanilha(file)).rejects.toThrow(ParseError)
    await expect(parsePlanilha(file)).rejects.toThrow(/Formato não suportado/)
  })

  it('lança ParseError para arquivo acima do limite de 10 MB', async () => {
    // Cria um Blob simulando arquivo > 10 MB sem alocar memória real
    const bigBlob = new Blob([new Uint8Array(11 * 1024 * 1024)])
    const file = new File([bigBlob], 'grande.csv', { type: 'text/csv' })
    await expect(parsePlanilha(file)).rejects.toThrow(ParseError)
    await expect(parsePlanilha(file)).rejects.toThrow(/muito grande/)
  })

  it('parseia CSV com cabeçalho e retorna headers + rows corretos', async () => {
    const csv = 'nome,unidade,preco_unitario\nMadeira Ipê,m³,250.50\nPrego,kg,5'
    const file = makeCsvFile(csv)
    const result = await parsePlanilha(file)
    expect(result.headers).toEqual(['nome', 'unidade', 'preco_unitario'])
    expect(result.rows).toHaveLength(2)
    // noUncheckedIndexedAccess: ! seguro pois toHaveLength(2) garante existência
    expect(result.rows[0]!['nome']).toBe('Madeira Ipê')
    expect(result.rows[1]!['nome']).toBe('Prego')
  })

  it('normaliza headers CSV para minúsculas sem espaços extras', async () => {
    const csv = ' Nome , Unidade , Preco_Unitario \nTeste,un,10'
    const file = makeCsvFile(csv)
    const result = await parsePlanilha(file)
    expect(result.headers).toEqual(['nome', 'unidade', 'preco_unitario'])
  })
})
