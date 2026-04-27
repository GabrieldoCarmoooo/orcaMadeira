import { MAX_UPLOAD_SIZE, COLUNAS_OBRIGATORIAS } from '@/constants/upload'

/** Linha bruta do arquivo, chaveada pelo nome do header normalizado */
export type RawRow = Record<string, string>

export interface ParseResult {
  /** Headers detectados na primeira linha */
  headers: string[]
  /** Todas as linhas de dados (header excluído) */
  rows: RawRow[]
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

// ─── Tipos de validação ───────────────────────────────────────────────────────

/** Linha validada com campos tipados e opcionais mapeados */
export interface ValidatedRow {
  /** Número da linha de origem no arquivo (1-based, para relatório de erros) */
  rowIndex: number
  nome: string
  unidade: string
  preco_unitario: number
  categoria?: string
  codigo?: string
  descricao?: string
  disponivel?: boolean
}

/** Erro de validação associado a uma linha específica */
export interface RowError {
  rowIndex: number
  message: string
}

export interface ValidationResult {
  rows: ValidatedRow[]
  errors: RowError[]
}

/**
 * Valida um ParseResult aplicando as regras de negócio de importação de catálogo:
 * - Exige presença das colunas obrigatórias nos headers (lança ParseError se ausentes)
 * - Rejeita linhas com campos obrigatórios vazios ou preço negativo/inválido
 * - Linhas válidas são retornadas mesmo quando outras têm erros (relatório parcial)
 * - Colunas opcionais são incluídas no objeto retornado quando presentes e não-vazias
 */
export function validatePlanilha(result: ParseResult): ValidationResult {
  // Verifica que todas as colunas obrigatórias estão nos headers detectados
  const missing = COLUNAS_OBRIGATORIAS.filter((col) => !result.headers.includes(col))
  if (missing.length > 0) {
    throw new ParseError(`Colunas obrigatórias ausentes: ${missing.join(', ')}.`)
  }

  const rows: ValidatedRow[] = []
  const errors: RowError[] = []

  result.rows.forEach((raw, index) => {
    const rowIndex = index + 1 // 1-based para facilitar leitura do relatório
    const fieldErrors: string[] = []

    const nome = raw['nome']?.trim() ?? ''
    const unidade = raw['unidade']?.trim() ?? ''
    const precoStr = raw['preco_unitario']?.trim() ?? ''

    // Valida campos obrigatórios não-vazios
    if (!nome) fieldErrors.push('campo "nome" está vazio')
    if (!unidade) fieldErrors.push('campo "unidade" está vazio')

    let preco: number | null = null
    if (!precoStr) {
      fieldErrors.push('campo "preco_unitario" está vazio')
    } else {
      // Aceita vírgula como separador decimal (pt-BR)
      const parsed = parseFloat(precoStr.replace(',', '.'))
      if (isNaN(parsed)) {
        fieldErrors.push(`"preco_unitario" com valor inválido: "${precoStr}"`)
      } else if (parsed < 0) {
        fieldErrors.push(`preço negativo não permitido (${parsed})`)
      } else {
        preco = parsed
      }
    }

    if (fieldErrors.length > 0) {
      errors.push({ rowIndex, message: `Linha ${rowIndex}: ${fieldErrors.join('; ')}.` })
      return
    }

    // Linha aprovada na validação — monta objeto com campos opcionais
    const validatedRow: ValidatedRow = {
      rowIndex,
      nome,
      unidade,
      preco_unitario: preco!,
    }

    const categoria = raw['categoria']?.trim()
    if (categoria) validatedRow.categoria = categoria

    // Aceita 'código' (com acento, saída do PapaParse) e 'codigo' (sem acento)
    const codigo = (raw['código'] ?? raw['codigo'])?.trim()
    if (codigo) validatedRow.codigo = codigo

    // Aceita 'descrição' e 'descricao'
    const descricao = (raw['descrição'] ?? raw['descricao'])?.trim()
    if (descricao) validatedRow.descricao = descricao

    // 'disponível'/'disponivel': falso apenas para 'false', '0', 'não', 'nao', 'n'
    const dispStr = (raw['disponível'] ?? raw['disponivel'])?.trim()
    if (dispStr !== undefined && dispStr !== '') {
      validatedRow.disponivel = !['false', '0', 'não', 'nao', 'n'].includes(
        dispStr.toLowerCase(),
      )
    }

    rows.push(validatedRow)
  })

  return { rows, errors }
}

/**
 * Wrapper principal de parse: detecta a extensão do arquivo e carrega o módulo
 * correto sob demanda via dynamic import, mantendo papaparse e xlsx fora do
 * bundle principal. Somente o caminho de upload da madeireira chega até aqui.
 */
export async function parsePlanilha(file: File): Promise<ParseResult> {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new ParseError(
      `O arquivo é muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite é 10 MB.`,
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'csv') {
    try {
      const { parseCsv } = await import('@/lib/parse-csv')
      return await parseCsv(file)
    } catch (err) {
      if (err instanceof ParseError) throw err
      throw new ParseError(err instanceof Error ? err.message : 'Erro inesperado ao ler CSV.')
    }
  }

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const { parseExcel } = await import('@/lib/parse-xlsx')
      return await parseExcel(file)
    } catch (err) {
      if (err instanceof ParseError) throw err
      throw new ParseError(err instanceof Error ? err.message : 'Erro inesperado ao ler Excel.')
    }
  }

  throw new ParseError(
    `Formato não suportado: .${ext}. Envie um arquivo .csv, .xlsx ou .xls.`,
  )
}
