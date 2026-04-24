import { useState, useRef, type ChangeEvent } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePortfolios } from '@/hooks/usePortfolios'
import type { Portfolio } from '@/types/portfolio'
import { cn } from '@/lib/utils'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB por arquivo

interface NovoPortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Chamado após criação bem-sucedida com o portfólio recém-criado
  onCreate?: (portfolio: Portfolio) => void
}

// Aceita imagens (qualquer MIME image/*) e PDFs
function isArquivoAceito(file: File): boolean {
  return file.type.startsWith('image/') || file.type === 'application/pdf'
}

export function NovoPortfolioDialog({ open, onOpenChange, onCreate }: NovoPortfolioDialogProps) {
  const { create } = usePortfolios()
  const [nome, setNome] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Limpa o estado ao fechar; bloqueia fechar durante upload
  function handleOpenChange(next: boolean) {
    if (isLoading) return
    if (!next) {
      setNome('')
      setFiles([])
      setError(null)
    }
    onOpenChange(next)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return

    const novos: File[] = []
    for (const file of Array.from(e.target.files)) {
      if (!isArquivoAceito(file)) {
        setError(`"${file.name}" não é um formato aceito (imagens ou PDF).`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" excede o limite de 10 MB.`)
        continue
      }
      novos.push(file)
    }

    if (novos.length) {
      setError(null)
      setFiles((prev) => [...prev, ...novos])
    }

    // Permite re-selecionar os mesmos arquivos
    if (inputRef.current) inputRef.current.value = ''
  }

  function removerArquivo(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!nome.trim()) {
      setError('Informe um nome para o portfólio.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const portfolio = await create({ nome: nome.trim(), files })
      onCreate?.(portfolio)
      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar portfólio.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo portfólio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome do portfólio */}
          <div className="space-y-1.5">
            <Label htmlFor="portfolio-nome">Nome</Label>
            <Input
              id="portfolio-nome"
              placeholder="Ex.: Móveis planejados 2025"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Zona de upload — clique para abrir seletor de arquivos */}
          <div className="space-y-1.5">
            <Label>Arquivos</Label>
            <label
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-muted px-4 py-6 text-center transition-colors hover:bg-muted/80',
                isLoading && 'pointer-events-none opacity-50',
              )}
            >
              <Upload className="h-6 w-6 text-on-surface-variant" />
              <span className="text-xs text-on-surface-variant">
                Clique para adicionar imagens e PDFs
                <br />
                <span className="text-muted-foreground">máx. 10 MB por arquivo</span>
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="sr-only"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
          </div>

          {/* Lista dos arquivos selecionados com botão de remoção individual */}
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                >
                  {file.type === 'application/pdf' ? (
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="flex-1 truncate text-on-surface">{file.name}</span>
                  <span className="shrink-0 text-xs text-on-surface-variant">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => removerArquivo(i)}
                    disabled={isLoading}
                    className="shrink-0 text-on-surface-variant transition-colors hover:text-destructive"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !nome.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              'Criar portfólio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
