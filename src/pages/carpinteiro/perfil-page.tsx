import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, User, Palette } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { validarCpfCnpj } from '@/lib/validar-cpf-cnpj'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TonalCard } from '@/components/ui/tonal-card'
import LogoUploader from '@/components/shared/logo-uploader'
import ConfiguracoesFinanceiras from '@/components/shared/configuracoes-financeiras'

const perfilCarpinteiroSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  cpf_cnpj: z.string().refine(validarCpfCnpj, 'CPF ou CNPJ inválido'),
  telefone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
  endereco: z.string().min(5, 'Endereço muito curto'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  margem_lucro_padrao: z.number().min(0).max(100),
  valor_hora_mao_obra: z.number().min(0),
  imposto_padrao: z.number().min(0).max(100),
})

type PerfilFormValues = z.infer<typeof perfilCarpinteiroSchema>

// Brand colors palette presets
const BRAND_COLORS = ['#7A5900', '#3D2B1F', '#1A4D2E', '#27374D', '#8E3E63', '#D65A31']

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={16} className="text-primary" />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-on-surface">{title}</h2>
    </div>
  )
}

export default function CarpinteiroPerfilPage() {
  const { carpinteiro } = useAuthStore()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedColor, setSelectedColor] = useState(BRAND_COLORS[0])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilCarpinteiroSchema),
    defaultValues: {
      nome: '', cpf_cnpj: '', telefone: '',
      endereco: '', cidade: '', estado: '',
      margem_lucro_padrao: 20, valor_hora_mao_obra: 0, imposto_padrao: 0,
    },
  })

  useEffect(() => {
    if (!carpinteiro) return
    reset({
      nome: carpinteiro.nome, cpf_cnpj: carpinteiro.cpf_cnpj,
      telefone: carpinteiro.telefone, endereco: carpinteiro.endereco,
      cidade: carpinteiro.cidade, estado: carpinteiro.estado,
      margem_lucro_padrao: carpinteiro.margem_lucro_padrao,
      valor_hora_mao_obra: carpinteiro.valor_hora_mao_obra,
      imposto_padrao: carpinteiro.imposto_padrao,
    })
    setLogoUrl(carpinteiro.logo_url)
  }, [carpinteiro, reset])

  const financeiroValue = {
    margem_lucro_padrao: watch('margem_lucro_padrao'),
    valor_hora_mao_obra: watch('valor_hora_mao_obra'),
    imposto_padrao: watch('imposto_padrao'),
  }

  function handleFinanceiroChange(v: typeof financeiroValue) {
    setValue('margem_lucro_padrao', v.margem_lucro_padrao, { shouldDirty: true })
    setValue('valor_hora_mao_obra', v.valor_hora_mao_obra, { shouldDirty: true })
    setValue('imposto_padrao', v.imposto_padrao, { shouldDirty: true })
  }

  async function onSubmit(values: PerfilFormValues) {
    if (!carpinteiro) return
    setSaveSuccess(false)
    try {
      const { error } = await supabase
        .from('carpinteiros')
        .update({ ...values, logo_url: logoUrl })
        .eq('id', carpinteiro.id)
      if (error) throw error

      const { data: { session } } = await supabase.auth.getSession()
      await useAuthStore.getState().setSession(session)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('root', { message: `Erro ao salvar: ${message}` })
    }
  }

  const nomeValue = watch('nome')
  const cidadeValue = watch('cidade')

  if (!carpinteiro) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column — forms */}
        <div className="lg:col-span-7 space-y-6">
          {/* Errors / Success */}
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

          {/* Profile section */}
          <TonalCard variant="default" asymmetric>
            <SectionHeader icon={User} title="Perfil do Usuário" />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" placeholder="João da Silva" aria-invalid={!!errors.nome} {...register('nome')} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
                  <Input id="cpf_cnpj" placeholder="000.000.000-00" aria-invalid={!!errors.cpf_cnpj} {...register('cpf_cnpj')} />
                  {errors.cpf_cnpj && <p className="text-xs text-destructive">{errors.cpf_cnpj.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" type="tel" placeholder="(00) 90000-0000" aria-invalid={!!errors.telefone} {...register('telefone')} />
                  {errors.telefone && <p className="text-xs text-destructive">{errors.telefone.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" placeholder="Rua das Madeiras, 100" aria-invalid={!!errors.endereco} {...register('endereco')} />
                {errors.endereco && <p className="text-xs text-destructive">{errors.endereco.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" placeholder="São Paulo" aria-invalid={!!errors.cidade} {...register('cidade')} />
                  {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" placeholder="SP" maxLength={2} className="uppercase" aria-invalid={!!errors.estado}
                    {...register('estado', { setValueAs: (v: string) => v.toUpperCase() })} />
                  {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
                </div>
              </div>
            </div>
          </TonalCard>

          {/* Brand identity section */}
          <TonalCard variant="default" asymmetric>
            <SectionHeader icon={Palette} title="Identidade Visual" />

            <div className="space-y-6">
              {/* Logo upload */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Logo da Marca</p>
                <LogoUploader
                  currentUrl={logoUrl}
                  userId={carpinteiro.user_id}
                  onUploadSuccess={(url) => setLogoUrl(url || null)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Brand color palette */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Cor Principal</p>
                <div className="flex flex-wrap gap-3">
                  {BRAND_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
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
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full border-2 border-dashed border-on-surface-variant/30 flex items-center justify-center text-on-surface-variant/50 hover:border-primary/50 transition-colors"
                    aria-label="Cor personalizada"
                  >
                    <span className="text-lg leading-none">+</span>
                  </button>
                </div>
              </div>

              {/* Financial settings */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Configurações Financeiras</p>
                <p className="text-xs text-on-surface-variant mb-4">Valores padrão ao criar novos orçamentos</p>
                <ConfiguracoesFinanceiras
                  value={financeiroValue}
                  onChange={handleFinanceiroChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </TonalCard>
        </div>

        {/* Right column — sticky PDF preview */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Prévia do Orçamento
            </p>

            {/* PDF preview mockup */}
            <div
              className="w-full aspect-[1/1.4] rounded-xl bg-white shadow-2xl overflow-hidden border border-outline-variant/10"
              aria-label="Prévia do PDF"
            >
              {/* PDF header bar */}
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
                      {nomeValue || carpinteiro.nome}
                    </p>
                    <p className="text-white/70 text-[10px]">{cidadeValue || carpinteiro.cidade}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-[10px] uppercase tracking-widest">Orçamento</p>
                  <p className="text-white font-black text-sm">#2024-01</p>
                </div>
              </div>

              {/* PDF content placeholders */}
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  {[80, 60, 90, 55].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full bg-gray-100"
                      style={{ width: `${w}%` }}
                    />
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

                {/* Signature line */}
                <div className="border-t border-dashed border-gray-200 pt-3 mt-4">
                  <div className="h-1.5 bg-gray-100 rounded-full w-2/3 mx-auto" />
                  <p className="text-center text-[9px] text-gray-400 mt-1">Assinatura do cliente</p>
                </div>
              </div>
            </div>

            {/* Save button */}
            <Button
              type="submit"
              className="w-full font-bold uppercase tracking-widest"
              size="lg"
              disabled={isSubmitting || (!isDirty && logoUrl === carpinteiro.logo_url)}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? 'Salvando…' : 'SALVAR ALTERAÇÕES'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
