import { type Control } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { EditorialInput } from '@/components/ui/editorial-input'
import type { MadeiraM3Input } from '@/lib/schemas/madeira-m3-schema'

interface DimensoesFieldsProps {
  /** Control do React Hook Form do formulário pai — necessário para registrar os campos */
  control: Control<MadeiraM3Input>
}

// Campos de dimensão transversal da madeira m³ extraídos do form principal
// para manter cada arquivo dentro do limite de linhas e facilitar revisão isolada
export function DimensoesFields({ control }: DimensoesFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Espessura em cm — usada no cálculo do volume m³ */}
      <FormField
        control={control}
        name="espessura_cm"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <EditorialInput
                label="Espessura (cm)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5"
                error={fieldState.error?.message}
                value={Number.isFinite(field.value) ? field.value : ''}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Largura em cm — usada no cálculo do volume m³ */}
      <FormField
        control={control}
        name="largura_cm"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <EditorialInput
                label="Largura (cm)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="15"
                error={fieldState.error?.message}
                value={Number.isFinite(field.value) ? field.value : ''}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
