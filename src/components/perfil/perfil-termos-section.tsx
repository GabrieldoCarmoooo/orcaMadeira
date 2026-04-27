import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PerfilTermosSectionProps {
  logoUrl: string | null
  selectedColor: string
  /** Nome em digitação no form — atualiza a prévia em tempo real */
  nomeValue: string
  /** Cidade em digitação no form — atualiza a prévia em tempo real */
  cidadeValue: string
  /** Fallback quando o campo ainda não foi preenchido */
  carpinteiroNome: string
  carpinteiroCidade: string
  isSubmitting: boolean
  hasUnsavedChanges: boolean
}

// Seção de prévia do PDF com as cores/logo da marca + botão de salvar perfil
// O nome "termos" refere-se ao painel que mostra como os termos e condições aparecem no documento final
export function PerfilTermosSection({
  logoUrl,
  selectedColor,
  nomeValue,
  cidadeValue,
  carpinteiroNome,
  carpinteiroCidade,
  isSubmitting,
  hasUnsavedChanges,
}: PerfilTermosSectionProps) {
  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        Prévia do Orçamento
      </p>

      {/* Mockup do PDF — reflete cor e logo em tempo real para feedback imediato ao carpinteiro */}
      <div
        className="w-full aspect-[1/1.4] rounded-xl bg-white shadow-2xl overflow-hidden border border-outline-variant/10"
        aria-label="Prévia do PDF"
      >
        {/* Cabeçalho com a cor da marca selecionada */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: selectedColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/70 text-[10px] font-bold uppercase">Logo</span>
              )}
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">
                {nomeValue || carpinteiroNome}
              </p>
              <p className="text-white/70 text-[10px]">{cidadeValue || carpinteiroCidade}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[10px] uppercase tracking-widest">Orçamento</p>
            <p className="text-white font-black text-sm">#2024-01</p>
          </div>
        </div>

        {/* Placeholders de linhas de conteúdo — representam materiais, valores e termos */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            {[80, 60, 90, 55].map((w, i) => (
              <div key={i} className="h-2 rounded-full bg-gray-100" style={{ width: `${w}%` }} />
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            {[
              ['Materiais', '60%'],
              ['Mão de obra', '45%'],
              ['Margem', '35%'],
            ].map(([label, w]) => (
              <div key={label} className="flex justify-between items-center">
                <div className="h-2 rounded-full bg-gray-100" style={{ width: w }} />
                <div className="h-2 rounded-full bg-gray-200 w-16" />
              </div>
            ))}
          </div>

          <div
            className="rounded-lg p-3 flex items-center justify-between mt-auto"
            style={{ backgroundColor: `${selectedColor}15` }}
          >
            <div className="h-2 rounded-full bg-gray-200 w-20" />
            <div className="h-4 rounded-full bg-gray-300 w-24" />
          </div>

          {/* Linha de assinatura — bloco de termos e condições no rodapé do PDF */}
          <div className="border-t border-dashed border-gray-200 pt-3 mt-4">
            <div className="h-1.5 bg-gray-100 rounded-full w-2/3 mx-auto" />
            <p className="text-center text-[9px] text-gray-400 mt-1">Assinatura do cliente</p>
          </div>
        </div>
      </div>

      {/* Botão de salvar — habilitado apenas quando há mudanças não persistidas */}
      <Button
        type="submit"
        className="w-full font-bold uppercase tracking-widest"
        size="lg"
        disabled={isSubmitting || !hasUnsavedChanges}
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? 'Salvando…' : 'SALVAR ALTERAÇÕES'}
      </Button>
    </div>
  )
}
