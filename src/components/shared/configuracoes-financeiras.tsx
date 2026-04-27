import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export interface ConfiguracoesFinanceirasValue {
  margem_lucro_padrao: number
  valor_hora_mao_obra: number
  imposto_padrao: number
  custos_adicionais_padrao: number
  termos_condicoes_padrao: string
}

// Chaves numéricas — excluindo o campo de texto livre para manter FinanceiroField tipado
type NumericKey = Exclude<keyof ConfiguracoesFinanceirasValue, 'termos_condicoes_padrao'>

interface ConfiguracoesFinanceirasProps {
  value: ConfiguracoesFinanceirasValue
  onChange: (value: ConfiguracoesFinanceirasValue) => void
  disabled?: boolean
}

interface FieldConfig {
  key: NumericKey
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
  {
    key: 'custos_adicionais_padrao',
    label: 'Custos adicionais padrão',
    suffix: 'R$',
    min: 0,
    step: 1,
    placeholder: '0',
  },
]

// Componente de campo individual com estado interno de string para permitir digitação livre
// (evita o problema de valor 0 forçar string vazia e confundir o isDirty do RHF no pai)
function FinanceiroField({
  fieldConfig,
  numericValue,
  onCommit,
  disabled,
}: {
  fieldConfig: FieldConfig
  numericValue: number
  onCommit: (key: NumericKey, value: number) => void
  disabled: boolean
}) {
  const { key, label, suffix, min, max, step, placeholder } = fieldConfig
  // Estado interno de string permite que o usuário delete o conteúdo e redigite sem que o
  // valor numérico 0 do pai substitua imediatamente o campo vazio
  const [inputStr, setInputStr] = useState(numericValue === 0 ? '' : String(numericValue))

  // Sincroniza o estado interno quando o valor externo muda (ex: reset do perfil).
  // Pattern intencional: o campo aceita strings incompletas (ex: "10." antes de "10.5"),
  // portanto não é possível derivar o valor sem estado local separado.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputStr(numericValue === 0 ? '' : String(numericValue))
  }, [numericValue])

  function handleChange(raw: string) {
    setInputStr(raw)
    const parsed = parseFloat(raw)
    onCommit(key, isNaN(parsed) ? 0 : parsed)
  }

  function handleBlur() {
    // Normaliza o campo vazio para '' ao perder o foco, mantendo a UX limpa
    if (inputStr === '' || inputStr === '-') {
      setInputStr('')
    }
  }

  return (
    <div className="space-y-1.5">
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
          value={inputStr}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          className="pr-12"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  )
}

export default function ConfiguracoesFinanceiras({
  value,
  onChange,
  disabled = false,
}: ConfiguracoesFinanceirasProps) {
  // Propaga alterações em campos numéricos mantendo o restante do objeto intacto
  function handleCommit(key: NumericKey, numeric: number) {
    onChange({ ...value, [key]: numeric })
  }

  // Propaga alterações no textarea de termos e condições
  function handleTermosChange(texto: string) {
    onChange({ ...value, termos_condicoes_padrao: texto })
  }

  return (
    <div className="space-y-4">
      {FIELDS.map((fieldConfig) => (
        <FinanceiroField
          key={fieldConfig.key}
          fieldConfig={fieldConfig}
          numericValue={value[fieldConfig.key]}
          onCommit={handleCommit}
          disabled={disabled}
        />
      ))}

      {/* Campo de texto livre para cláusulas padrão incluídas em todo novo orçamento */}
      <div className="space-y-1.5">
        <Label htmlFor="termos_condicoes_padrao">Termos e condições padrão</Label>
        <Textarea
          id="termos_condicoes_padrao"
          placeholder="Ex: Validade do orçamento: 15 dias. Prazo de entrega: 30 dias após aprovação..."
          value={value.termos_condicoes_padrao}
          onChange={(e) => handleTermosChange(e.target.value)}
          disabled={disabled}
          className="min-h-[100px]"
        />
      </div>
    </div>
  )
}
