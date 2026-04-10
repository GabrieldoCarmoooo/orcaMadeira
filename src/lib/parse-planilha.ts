import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { MAX_UPLOAD_SIZE } from '@/constants/upload'

/** A single raw row from the spreadsheet — string values, keyed by header name */
export type RawRow = Record<string, string>

export interface ParseResult {
  /** Detected headers from the first row */
  headers: string[]
  /** All data rows (first row used as headers, excluded from rows) */
  rows: RawRow[]
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

/**
 * Parse a CSV or Excel file into a unified `ParseResult`.
 * Throws `ParseError` for size violations or unsupported formats.
 */
export async function parsePlanilha(file: File): Promise<ParseResult> {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new ParseError(
      `O arquivo é muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite é 10 MB.`,
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'csv') {
    return parseCsv(file)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file)
  }

  throw new ParseError(
    `Formato não suportado: .${ext}. Envie um arquivo .csv, .xlsx ou .xls.`,
  )
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete(results) {
        const headers = results.meta.fields ?? []
        resolve({ headers, rows: results.data })
      },
      error(err) {
        reject(new ParseError(`Erro ao ler CSV: ${err.message}`))
      },
    })
  })
}

async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new ParseError('A planilha Excel está vazia ou não contém abas.')
  }

  const sheet = workbook.Sheets[sheetName]

  // Convert to array-of-arrays so we can treat the first row as headers
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })

  if (aoa.length === 0) {
    return { headers: [], rows: [] }
  }

  // First row = headers (normalise to lowercase trimmed strings)
  const rawHeaders = aoa[0].map((h) => String(h).trim().toLowerCase())

  const rows: RawRow[] = aoa.slice(1).reduce<RawRow[]>((acc, rowArr) => {
    // Skip entirely empty rows
    const values = rowArr.map((v) => String(v).trim())
    if (values.every((v) => v === '')) return acc

    const row: RawRow = {}
    rawHeaders.forEach((header, i) => {
      row[header] = values[i] ?? ''
    })
    acc.push(row)
    return acc
  }, [])

  return { headers: rawHeaders, rows }
}
