import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ToggleDetalhesPdfProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** Estilo visual alternativo para uso em fundos escuros (ex: painel de resumo) */
  variant?: 'default' | 'inverted'
  label?: string
}

/**
 * Toggle "Detalhes no PDF" com confirmação ao ligar.
 * - false → true: abre AlertDialog antes de confirmar (regra de negócio: carpinteiro
 *   deve estar ciente de que mão de obra e materiais serão exibidos na proposta).
 * - true → false: desliga direto, sem aviso.
 */
export default function ToggleDetalhesPdf({
  value,
  onChange,
  disabled = false,
  variant = 'default',
  label = 'Detalhes no PDF',
}: ToggleDetalhesPdfProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleClick() {
    if (disabled) return

    if (!value) {
      // false → true: exige confirmação para evitar exposição acidental de valores
      setConfirmOpen(true)
    } else {
      // true → false: desliga direto
      onChange(false)
    }
  }

  function handleConfirm() {
    onChange(true)
    setConfirmOpen(false)
  }

  function handleCancel() {
    // Mantém o toggle desligado; o dialog fecha via AlertDialogCancel (Radix)
    setConfirmOpen(false)
  }

  const isInverted = variant === 'inverted'

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 cursor-pointer select-none',
          isInverted ? 'text-[10px] opacity-60' : 'text-[11px] text-muted-foreground',
          disabled && 'cursor-not-allowed opacity-40',
        )}
      >
        <span className={isInverted ? 'font-medium' : undefined}>{label}</span>

        {isInverted ? (
          /* Estilo do painel de resumo (fundo escuro) */
          <span
            className={cn(
              'relative inline-flex h-6 w-12 shrink-0 rounded-full items-center px-0.5 transition-colors',
              value ? 'bg-background/40' : 'bg-background/20',
            )}
          >
            <span
              className={cn(
                'h-5 w-5 rounded-full bg-background shadow-sm transition-transform',
                value ? 'translate-x-6' : 'translate-x-0',
              )}
            />
          </span>
        ) : (
          /* Estilo padrão (fundo claro) */
          <span
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 rounded-full items-center px-0.5 transition-colors',
              value ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
          >
            <span
              className={cn(
                'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                value ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </span>
        )}
      </button>

      {/* Dialog de confirmação exibido apenas ao tentar ligar o toggle */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mostrar detalhes na proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Ativar &ldquo;Detalhes no PDF&rdquo; fará com que valores de mão de obra e
              materiais apareçam discriminados na proposta entregue ao cliente. Deseja
              continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Sim, mostrar detalhes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
