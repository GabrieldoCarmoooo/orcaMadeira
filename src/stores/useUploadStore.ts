import { create } from 'zustand'
import type { ParseResult, RawRow } from '@/lib/parse-planilha'

/** System field names the user can map columns to */
export const SYSTEM_FIELDS = {
  // Required
  nome: { label: 'Nome do produto', required: true },
  unidade: { label: 'Unidade (m³, un, kg…)', required: true },
  preco_unitario: { label: 'Preço unitário (R$)', required: true },
  // Optional
  codigo: { label: 'Código', required: false },
  descricao: { label: 'Descrição', required: false },
  especie: { label: 'Espécie da madeira', required: false },
  espessura: { label: 'Espessura (cm)', required: false },
  largura: { label: 'Largura (cm)', required: false },
  comprimento: { label: 'Comprimento (m)', required: false },
} as const

export type SystemField = keyof typeof SYSTEM_FIELDS

/** Maps system field → detected column header from the file */
export type ColumnMap = Partial<Record<SystemField, string>>

export type UploadStep = 'idle' | 'parsing' | 'mapping' | 'previewing'

interface UploadStore {
  // State
  step: UploadStep
  file: File | null
  parseResult: ParseResult | null
  /** system field → raw header from file */
  columnMap: ColumnMap
  error: string | null

  // Derived helper — returns rows remapped to system field keys
  getMappedRows: () => RawRow[]

  // Actions
  startParsing: (file: File) => void
  setParsed: (result: ParseResult) => void
  setColumnMap: (map: ColumnMap) => void
  confirmMapping: () => void
  setError: (msg: string) => void
  reset: () => void
}

const INITIAL_STATE = {
  step: 'idle' as UploadStep,
  file: null,
  parseResult: null,
  columnMap: {} as ColumnMap,
  error: null,
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  ...INITIAL_STATE,

  getMappedRows() {
    const { parseResult, columnMap } = get()
    if (!parseResult) return []

    return parseResult.rows.map((raw) => {
      const mapped: RawRow = {}
      for (const [sysField, detectedHeader] of Object.entries(columnMap)) {
        if (detectedHeader) {
          mapped[sysField] = raw[detectedHeader] ?? ''
        }
      }
      return mapped
    })
  },

  startParsing(file) {
    set({ ...INITIAL_STATE, step: 'parsing', file })
  },

  setParsed(result) {
    // Auto-detect mapping: if a detected header exactly matches a system field, pre-fill it
    const autoMap: ColumnMap = {}
    for (const field of Object.keys(SYSTEM_FIELDS) as SystemField[]) {
      if (result.headers.includes(field)) {
        autoMap[field] = field
      }
    }
    set({ step: 'mapping', parseResult: result, columnMap: autoMap, error: null })
  },

  setColumnMap(map) {
    set({ columnMap: map })
  },

  confirmMapping() {
    set({ step: 'previewing' })
  },

  setError(msg) {
    set({ error: msg, step: 'idle' })
  },

  reset() {
    set(INITIAL_STATE)
  },
}))
