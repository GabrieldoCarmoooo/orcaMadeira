import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export interface ConfiguracoesFinanceirasValue {
  margem_lucro_padrao: number
  valor_hora_mao_obra: number
  imposto_padrao: number
}

interface ConfiguracoesFinanceirasProps {
  value: ConfiguracoesFinanceirasValue
  onChange: (value: ConfiguracoesFinanceirasValue) => void
  disabled?: boolean
}

interface FieldConfig {
  key: keyof ConfiguracoesFinanceirasValue
  label: string
  suffix: string
  min: number
  max?: number
  step: number
  placeholder: string
}

const FIELDS: FieldConfig[] = [
  {
    key: 'margem_lucro_padrao',
    label: 'Margem de lucro padrão',
    suffix: '%',
    min: 0,
    max: 100,
    step: 0.5,
    placeholder: '20',
  },
  {
    key: 'valor_hora_mao_obra',
    label: 'Valor da hora de mão de obra',
    suffix: 'R$/h',
    min: 0,
    step: 1,
    placeholder: '80',
  },
  {
    key: 'imposto_padrao',
    label: 'Imposto padrão (ISS, etc.)',
    suffix: '%',
    min: 0,
    max: 100,
    step: 0.5,
    placeholder: '5',
  },
]

export default function ConfiguracoesFinanceiras({
  value,
  onChange,
  disabled = false,
}: ConfiguracoesFinanceirasProps) {
  function handleChange(key: keyof ConfiguracoesFinanceirasValue, raw: string) {
    const parsed = parseFloat(raw)
    onChange({
      ...value,
      [key]: isNaN(parsed) ? 0 : parsed,
    })
  }

  return (
    <div className="space-y-4">
      {FIELDS.map(({ key, label, suffix, min, max, step, placeholder }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key}>{label}</Label>
          <div className="relative">
            <Input
              id={key}
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              value={value[key] === 0 ? '' : value[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={disabled}
              className="pr-12"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              {suffix}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
