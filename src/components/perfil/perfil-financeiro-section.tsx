import { Palette } from 'lucide-react'
import { TonalCard } from '@/components/ui/tonal-card'
import LogoUploader from '@/components/shared/logo-uploader'
import ConfiguracoesFinanceiras, {
  type ConfiguracoesFinanceirasValue,
} from '@/components/shared/configuracoes-financeiras'
import { BRAND_COLORS } from '@/hooks/usePerfilCarpinteiro'

interface PerfilFinanceiroSectionProps {
  logoUrl: string | null
  onLogoChange: (url: string | null) => void
  userId: string
  selectedColor: string
  onColorSelect: (color: string) => void
  customColors: string[]
  onCustomColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCustomColorCommit: (e: React.FocusEvent<HTMLInputElement>) => void
  financeiroValue: ConfiguracoesFinanceirasValue
  onFinanceiroChange: (v: ConfiguracoesFinanceirasValue) => void
  isSubmitting: boolean
}

// Seção de identidade visual + configurações financeiras padrão do carpinteiro
export function PerfilFinanceiroSection({
  logoUrl,
  onLogoChange,
  userId,
  selectedColor,
  onColorSelect,
  customColors,
  onCustomColorChange,
  onCustomColorCommit,
  financeiroValue,
  onFinanceiroChange,
  isSubmitting,
}: PerfilFinanceiroSectionProps) {
  return (
    <TonalCard variant="default" asymmetric>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Palette size={16} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-on-surface">Identidade Visual</h2>
      </div>

      <div className="space-y-6">
        {/* Upload do logo — redimensionado para ≤ 400px antes do envio (ISSUE-026) */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Logo da Marca</p>
          <LogoUploader
            currentUrl={logoUrl}
            userId={userId}
            onUploadSuccess={(url) => onLogoChange(url ?? null)}
            disabled={isSubmitting}
          />
        </div>

        {/* Paleta de cores da marca com presets + picker nativo */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Cor Principal</p>
          <div className="flex flex-wrap gap-3">
            {BRAND_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorSelect(color)}
                className="w-12 h-12 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: color,
                  boxShadow: selectedColor === color
                    ? `0 0 0 3px white, 0 0 0 5px ${color}`
                    : undefined,
                }}
                aria-label={`Selecionar cor ${color}`}
                title={color}
              />
            ))}

            {/* Cores personalizadas adicionadas via picker nesta sessão */}
            {customColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorSelect(color)}
                className="w-12 h-12 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: color,
                  boxShadow: selectedColor === color
                    ? `0 0 0 3px white, 0 0 0 5px ${color}`
                    : undefined,
                }}
                aria-label={`Selecionar cor ${color}`}
                title={color}
              />
            ))}

            {/* Label abre o color picker nativo; input sr-only evita layout shift */}
            <label
              htmlFor="custom-color-input"
              className="w-12 h-12 rounded-full border-2 border-dashed border-on-surface-variant/30 flex items-center justify-center text-on-surface-variant/50 hover:border-primary/50 transition-colors cursor-pointer"
              aria-label="Escolher cor personalizada"
              title="Cor personalizada"
            >
              <span className="text-lg leading-none select-none">+</span>
              <input
                id="custom-color-input"
                type="color"
                className="sr-only"
                value={selectedColor}
                onChange={onCustomColorChange}
                onBlur={onCustomColorCommit}
              />
            </label>
          </div>
        </div>

        {/* Configurações financeiras e termos padrão para novos orçamentos */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">
            Configurações Financeiras
          </p>
          <p className="text-xs text-on-surface-variant mb-4">Valores padrão ao criar novos orçamentos</p>
          <ConfiguracoesFinanceiras
            value={financeiroValue}
            onChange={onFinanceiroChange}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </TonalCard>
  )
}
