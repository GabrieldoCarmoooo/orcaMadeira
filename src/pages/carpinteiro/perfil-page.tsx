import { Loader2, CheckCircle2 } from 'lucide-react'
import { usePerfilCarpinteiro } from '@/hooks/usePerfilCarpinteiro'
import { PerfilEmpresaSection } from '@/components/perfil/perfil-empresa-section'
import { PerfilFinanceiroSection } from '@/components/perfil/perfil-financeiro-section'
import { PerfilTermosSection } from '@/components/perfil/perfil-termos-section'

export default function CarpinteiroPerfilPage() {
  const {
    carpinteiro,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    onSubmit,
    handleValidationError,
    logoUrl,
    setLogoUrl,
    selectedColor,
    customColors,
    handleColorSelect,
    handleCustomColorChange,
    handleCustomColorCommit,
    financeiroValue,
    handleFinanceiroChange,
    nomeValue,
    cidadeValue,
    hasUnsavedChanges,
    saveSuccess,
  } = usePerfilCarpinteiro()

  if (!carpinteiro) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, handleValidationError)} noValidate>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* Coluna esquerda — seções empresa e financeiro */}
        <div className="lg:col-span-7 space-y-6">
          {errors.root && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Perfil salvo com sucesso.
            </div>
          )}

          <PerfilEmpresaSection
            register={register}
            errors={errors}
            isSubmitting={isSubmitting}
          />

          <PerfilFinanceiroSection
            logoUrl={logoUrl}
            onLogoChange={(url) => setLogoUrl(url)}
            userId={carpinteiro.user_id}
            selectedColor={selectedColor}
            onColorSelect={handleColorSelect}
            customColors={customColors}
            onCustomColorChange={handleCustomColorChange}
            onCustomColorCommit={handleCustomColorCommit}
            financeiroValue={financeiroValue}
            onFinanceiroChange={handleFinanceiroChange}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Coluna direita — prévia do PDF + botão salvar */}
        <div className="lg:col-span-5">
          <PerfilTermosSection
            logoUrl={logoUrl}
            selectedColor={selectedColor}
            nomeValue={nomeValue}
            cidadeValue={cidadeValue}
            carpinteiroNome={carpinteiro.nome}
            carpinteiroCidade={carpinteiro.cidade}
            isSubmitting={isSubmitting}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>

      </div>
    </form>
  )
}
