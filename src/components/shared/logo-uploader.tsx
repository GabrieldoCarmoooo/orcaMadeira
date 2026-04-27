import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { logError } from '@/lib/log-error'
import { Button } from '@/components/ui/button'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
// Limite de dimensão para redução antes do upload — evita inflar o PDF com base64 enorme
const MAX_LOGO_DIMENSION = 400
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp'

/** Mapeia MIME type para extensão de arquivo. */
function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[mimeType] ?? 'jpg'
}

/**
 * Redimensiona a imagem para no máximo MAX_LOGO_DIMENSION × MAX_LOGO_DIMENSION px
 * mantendo a proporção original. PNG preserva canal alpha; JPEG e WebP saem com
 * qualidade 0.85 no formato de origem. Imagens já dentro do limite são devolvidas
 * sem recodificação para não degradar desnecessariamente.
 */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const { naturalWidth: w, naturalHeight: h } = img

      // Imagem já cabe nos limites — devolve sem recoding
      if (w <= MAX_LOGO_DIMENSION && h <= MAX_LOGO_DIMENSION) {
        resolve(file)
        return
      }

      // Escala proporcional até o maior lado caber no limite
      const scale = Math.min(MAX_LOGO_DIMENSION / w, MAX_LOGO_DIMENSION / h)
      const newWidth = Math.round(w * scale)
      const newHeight = Math.round(h * scale)

      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      // PNG preserva canal alpha; JPEG e WebP usam qualidade 0.85
      const outputType = file.type === 'image/png' ? 'image/png' : file.type
      const quality = outputType !== 'image/png' ? 0.85 : undefined

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('canvas.toBlob retornou null'))
            return
          }
          resolve(blob)
        },
        outputType,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Falha ao carregar imagem para redimensionar'))
    }

    img.src = objectUrl
  })
}

interface LogoUploaderProps {
  /** Current logo URL from the DB (null if none) */
  currentUrl: string | null
  /** Storage path prefix, e.g. the user's id — file stored as `{userId}/logo` */
  userId: string
  /** Called with the new public URL after a successful upload */
  onUploadSuccess: (publicUrl: string) => void
  disabled?: boolean
}

export default function LogoUploader({
  currentUrl,
  userId,
  onUploadSuccess,
  disabled = false,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync preview when currentUrl changes (e.g. form resets)
  useEffect(() => {
    setPreview(currentUrl)
  }, [currentUrl])

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Apenas imagens JPG, PNG ou WebP são aceitas.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `A imagem deve ter no máximo 2MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(1)}MB.`
    }
    return null
  }

  async function uploadFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setIsUploading(true)

    let resizedObjectUrl: string | null = null

    try {
      // Redimensiona para no máximo MAX_LOGO_DIMENSION px antes do upload —
      // logos em alta resolução embutidos como base64 no PDF inflam significativamente o arquivo
      const resizedBlob = await resizeImage(file)
      const outputMime = resizedBlob.type
      const ext = getExtFromMime(outputMime)
      const path = `${userId}/logo.${ext}`

      // Preview imediato da versão já redimensionada
      resizedObjectUrl = URL.createObjectURL(resizedBlob)
      setPreview(resizedObjectUrl)

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, resizedBlob, { upsert: true, contentType: outputMime })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      onUploadSuccess(data.publicUrl)
    } catch (err) {
      logError('logo-uploader/handleUpload', err)
      setError('Erro ao fazer upload. Tente novamente.')
      // Reverte preview ao URL original em caso de falha
      setPreview(currentUrl)
      if (resizedObjectUrl) URL.revokeObjectURL(resizedObjectUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (!file) return
      uploadFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, currentUrl],
  )

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  function handleRemove() {
    setPreview(null)
    setError(null)
    onUploadSuccess('')
  }

  return (
    <div className="space-y-2">
      {preview ? (
        /* Preview state */
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Logo"
            className="h-24 w-24 rounded-lg border border-border object-contain bg-muted"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
              aria-label="Remover logo"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          className={cn(
            'flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg transition-colors',
            isDragging
              ? 'bg-primary/10 ring-2 ring-primary/40'
              : 'bg-muted hover:bg-muted/70',
            (disabled || isUploading) && 'cursor-not-allowed opacity-60',
          )}
          aria-label="Área de upload de logo"
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!disabled && !isUploading) inputRef.current?.click()
            }
          }}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Enviando…</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Arraste ou{' '}
                <span className="font-medium text-foreground underline-offset-2 hover:underline">
                  clique para selecionar
                </span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Change button when preview is shown */}
      {preview && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="gap-1.5"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {isUploading ? 'Enviando…' : 'Trocar logo'}
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        aria-hidden
      />

      {/* Hint & error */}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP — máx. 2MB</p>
      )}
    </div>
  )
}
