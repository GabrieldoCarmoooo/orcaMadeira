import { useUploadStore, SYSTEM_FIELDS, type ColumnMap, type SystemField } from '@/stores/useUploadStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const REQUIRED_FIELDS = (Object.keys(SYSTEM_FIELDS) as SystemField[]).filter(
  (f) => SYSTEM_FIELDS[f].required,
)

function allRequiredMapped(map: ColumnMap): boolean {
  return REQUIRED_FIELDS.every((f) => !!map[f])
}

/** Extracts the first non-empty example value for a given header from raw rows */
function exampleValue(header: string, rows: import('@/lib/parse-planilha').RawRow[]): string {
  for (const row of rows.slice(0, 5)) {
    const val = row[header]?.trim()
    if (val) return val
  }
  return '—'
}

export default function MapeamentoColunas() {
  const { parseResult, columnMap, setColumnMap, confirmMapping } = useUploadStore()

  if (!parseResult) return null

  const { headers, rows } = parseResult

  function handleChange(field: SystemField, value: string) {
    const next: ColumnMap = { ...columnMap, [field]: value || undefined }
    setColumnMap(next)
  }

  const canContinue = allRequiredMapped(columnMap)

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">Mapeamento de colunas</h3>
        <p className="text-xs text-muted-foreground">
          Associe cada campo do sistema à coluna correspondente no seu arquivo.
          <span className="text-destructive"> *</span> campos obrigatórios.
        </p>
      </div>

      {/* Headers detected */}
      <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Colunas detectadas: </span>
        {headers.join(', ')}
      </div>

      {/* Mapping rows */}
      <div className="divide-y divide-border rounded-xl overflow-hidden bg-card shadow-tinted">
        {(Object.keys(SYSTEM_FIELDS) as SystemField[]).map((field) => {
          const meta = SYSTEM_FIELDS[field]
          const selectedHeader = columnMap[field] ?? ''
          const preview = selectedHeader ? exampleValue(selectedHeader, rows) : null

          return (
            <div
              key={field}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* System field label */}
              <div className="w-full sm:w-48 shrink-0">
                <p className="text-sm font-medium">
                  {meta.label}
                  {meta.required && <span className="ml-1 text-destructive">*</span>}
                </p>
                {!meta.required && (
                  <p className="text-[11px] text-muted-foreground">opcional</p>
                )}
              </div>

              {/* Select */}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <select
                  value={selectedHeader}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className={cn(
                    'h-8 w-full rounded-lg bg-muted px-2.5 text-sm outline-none transition-colors',
                    'focus:ring-2 focus:ring-ring/50',
                    meta.required && !selectedHeader
                      ? 'border-2 border-destructive/50 bg-destructive/5'
                      : 'border-0',
                  )}
                >
                  <option value="">— Não mapear —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>

                {/* Example value */}
                {preview !== null && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Ex: <span className="font-medium text-foreground">{preview}</span>
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button disabled={!canContinue} onClick={confirmMapping}>
          Continuar para prévia
        </Button>
      </div>

      {!canContinue && (
        <p className="text-xs text-destructive text-right -mt-4">
          Mapeie os campos obrigatórios (*) para continuar.
        </p>
      )}
    </div>
  )
}
