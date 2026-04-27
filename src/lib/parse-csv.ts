/** Linha bruta do arquivo, chaveada pelo nome do header normalizado */
type RawRow = Record<string, string>

interface ParseResult {
  headers: string[]
  rows: RawRow[]
}

/**
 * Faz o parse de um arquivo CSV usando PapaParse carregado sob demanda.
 * O dynamic import garante que o PapaParse (~75 KB) não entra no bundle principal —
 * só é baixado quando o usuário da madeireira abre o fluxo de upload.
 */
export async function parseCsv(file: File): Promise<ParseResult> {
  const { default: Papa } = await import('papaparse')

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
        reject(new Error(`Erro ao ler CSV: ${err.message}`))
      },
    })
  })
}
