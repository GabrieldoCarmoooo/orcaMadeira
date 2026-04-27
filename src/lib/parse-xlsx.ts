/** Linha bruta do arquivo, chaveada pelo nome do header normalizado */
type RawRow = Record<string, string>

interface ParseResult {
  headers: string[]
  rows: RawRow[]
}

/**
 * Faz o parse de um arquivo Excel (.xlsx / .xls) usando SheetJS carregado sob demanda.
 * O dynamic import garante que o xlsx (~1.5 MB minified) não entra no bundle principal —
 * só é baixado quando o usuário da madeireira efetivamente envia um arquivo Excel.
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx')

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('A planilha Excel está vazia ou não contém abas.')
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error('Não foi possível ler a aba da planilha.')
  }

  // Converte para array-de-arrays para tratar a primeira linha como cabeçalho
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })

  if (aoa.length === 0) {
    return { headers: [], rows: [] }
  }

  // Primeira linha = headers (normaliza para minúsculas sem espaços extras)
  // `aoa[0]` existe pois verificamos `aoa.length === 0` acima
  const rawHeaders = (aoa[0] ?? []).map((h) => String(h).trim().toLowerCase())

  const rows: RawRow[] = aoa.slice(1).reduce<RawRow[]>((acc, rowArr) => {
    // Ignora linhas completamente vazias
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
