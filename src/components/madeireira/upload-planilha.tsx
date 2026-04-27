import { useCallback, useRef, useState } from 'react'
import { Upload, FileSpreadsheet, Loader2, X } from 'lucide-react'
import { parsePlanilha, ParseError } from '@/lib/parse-planilha'
import { useUploadStore } from '@/stores/useUploadStore'
import { logError } from '@/lib/log-error'
import { Button } from '@/components/ui/button'
import { ACCEPTED_TYPES, MAX_UPLOAD_SIZE } from '@/constants/upload'

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function UploadPlanilha() {
  const { step, file, startParsing, setParsed, setError } = useUploadStore()
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isParsing = step === 'parsing'

  const processFile = useCallback(
    async (selected: File) => {
      // Client-side validation before parsing
      const ext = selected.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        setError(`Formato não suportado: .${ext}. Use .csv, .xlsx ou .xls.`)
        return
      }
      if (selected.size > MAX_UPLOAD_SIZE) {
        setError(
          `Arquivo muito grande (${formatBytes(selected.size)}). O limite é ${formatBytes(MAX_UPLOAD_SIZE)}.`,
        )
        return
      }

      startParsing(selected)
      try {
        const result = await parsePlanilha(selected)
        if (result.rows.length === 0) {
          setError('O arquivo não contém dados. Verifique se há linhas após o cabeçalho.')
          return
        }
        setParsed(result)
      } catch (err) {
        logError('upload-planilha/handleFile', err)
        setError(err instanceof ParseError ? err.message : 'Erro inesperado ao ler o arquivo.')
      }
    },
    [startParsing, setParsed, setError],
  )

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    processFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  // Already has a file in later steps — show file name + reset button
  if (file && step !== 'idle') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-tinted px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({formatBytes(file.size)})
          </span>
        </div>
        {!isParsing ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => useUploadStore.getState().reset()}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        )}
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Área de upload de planilha"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-10 text-center cursor-pointer transition-colors',
        dragging
          ? 'bg-accent/30 shadow-tinted'
          : 'bg-muted/60 hover:bg-muted shadow-tinted',
      ].join(' ')}
    >
      <Upload className="h-8 w-8 text-muted-foreground/60" />
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Arraste um arquivo ou{' '}
          <span className="text-primary underline underline-offset-2">clique para selecionar</span>
        </p>
        <p className="text-xs text-muted-foreground">
          CSV, XLSX ou XLS — máximo {formatBytes(MAX_UPLOAD_SIZE)}
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        // Allow re-selecting the same file
        onClick={(e) => ((e.target as HTMLInputElement).value = '')}
      />
    </div>
  )
}

