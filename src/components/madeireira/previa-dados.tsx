import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUploadStore } from '@/stores/useUploadStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { itemPrecoSchema, type ValidatedItemPreco } from '@/lib/schemas/preco-item-schema'

interface ValidatedRow {
  index: number
  raw: Record<string, string>
  valid: boolean
  errors: string[]
  data?: ValidatedItemPreco
}

interface PreviaDadosProps {
  onConfirm: (rows: ValidatedItemPreco[]) => void
}

const PAGE_SIZE = 50

export default function PreviaDados({ onConfirm }: PreviaDadosProps) {
  const { getMappedRows } = useUploadStore()
  const [page, setPage] = useState(0)

  // Validate all rows once — memoised so large datasets don't re-validate on every render
  const validatedRows = useMemo<ValidatedRow[]>(() => {
    const rows = getMappedRows()
    return rows.map((raw, index) => {
      const result = itemPrecoSchema.safeParse(raw)
      if (result.success) {
        return { index, raw, valid: true, errors: [], data: result.data }
      }
      const errors = result.error.issues.map((e) => e.message)
      return { index, raw, valid: false, errors }
    })
  }, [getMappedRows])

  const validCount = validatedRows.filter((r) => r.valid).length
  const errorCount = validatedRows.length - validCount
  const validRows = validatedRows.filter((r) => r.valid).map((r) => r.data!)

  const totalPages = Math.ceil(validatedRows.length / PAGE_SIZE)
  const paginated = validatedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Summary counts */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 px-3 py-1.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-700 dark:text-green-400">{validCount}</span>
          <span className="text-green-600/70 dark:text-green-500/80">
            {validCount === 1 ? 'linha válida' : 'linhas válidas'}
          </span>
        </div>

        {errorCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive">{errorCount}</span>
            <span className="text-destructive/70">
              {errorCount === 1 ? 'linha com erro' : 'linhas com erro'} (não bloqueiam o import)
            </span>
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-3 py-2 font-medium text-muted-foreground w-10 tabular-nums">#</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Nome</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Unidade</th>
              <th className="px-3 py-2 font-medium text-muted-foreground">Preço (R$)</th>
              <th className="px-3 py-2 font-medium text-muted-foreground w-8 text-center">
                <span className="sr-only">Status</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((row) => (
              <tr
                key={row.index}
                className={cn(
                  'transition-colors',
                  row.valid
                    ? 'hover:bg-muted/30'
                    : 'bg-destructive/5 hover:bg-destructive/10',
                )}
              >
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{row.index + 1}</td>

                <td className="px-3 py-2 max-w-[200px]">
                  <span className="block truncate" title={row.raw.nome}>
                    {row.raw.nome || (
                      <span className="italic text-muted-foreground">vazio</span>
                    )}
                  </span>
                </td>

                <td className="px-3 py-2">
                  {row.raw.unidade || (
                    <span className="italic text-muted-foreground">vazio</span>
                  )}
                </td>

                <td className="px-3 py-2">
                  {row.raw.preco_unitario || (
                    <span className="italic text-muted-foreground">vazio</span>
                  )}
                </td>

                {/* Status icon with hover tooltip listing errors */}
                <td className="px-3 py-2 text-center">
                  {row.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                  ) : (
                    <div className="relative group inline-block">
                      <XCircle className="h-4 w-4 text-destructive cursor-help" />
                      <div className="absolute right-0 top-5 z-10 hidden group-hover:block min-w-[160px] max-w-[240px] rounded-lg bg-popover text-popover-foreground shadow-md border border-border px-3 py-2 text-xs space-y-0.5">
                        {row.errors.map((e, i) => (
                          <p key={i}>{e}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {page + 1} de {totalPages} ({validatedRows.length} linhas)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm action */}
      <div className="flex flex-col items-end gap-1.5">
        <Button disabled={validCount === 0} onClick={() => onConfirm(validRows)}>
          Confirmar importação ({validCount} {validCount === 1 ? 'item' : 'itens'})
        </Button>
        {validCount === 0 && (
          <p className="text-xs text-destructive">
            Nenhuma linha válida. Corrija os erros e faça o upload novamente.
          </p>
        )}
      </div>
    </div>
  )
}
