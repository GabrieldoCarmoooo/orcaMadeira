import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface EditorialInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  // Permite string | undefined para compatibilidade com fieldState.error?.message
  error?: string | undefined
}

/**
 * Pencil-mark input: border-b only, bg surface-container-low.
 * Focused state shows a 2px bottom border in primary color.
 * Named after the design spec: "It mimics a pencil mark on a piece of lumber."
 */
export const EditorialInput = forwardRef<HTMLInputElement, EditorialInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-[10px] font-bold uppercase tracking-widest text-secondary mb-1"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'input-editorial w-full px-3 py-3 text-on-surface placeholder:text-on-surface-variant/50 text-sm',
            error && 'border-b-destructive!',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    )
  },
)

EditorialInput.displayName = 'EditorialInput'

export default EditorialInput
