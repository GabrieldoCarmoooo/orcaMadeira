import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { logError } from '@/lib/log-error'
import {
  perfilCarpinteiroSchema,
  type PerfilFormValues,
} from '@/lib/schemas/perfil-carpinteiro-schema'
import type { ConfiguracoesFinanceirasValue } from '@/components/shared/configuracoes-financeiras'

// Paleta de cores da marca — presets do design system Timber Grain
export const BRAND_COLORS = ['#7A5900', '#3D2B1F', '#1A4D2E', '#27374D', '#8E3E63', '#D65A31']
// Cor padrão explicitamente tipada como string (BRAND_COLORS[0] seria string | undefined com noUncheckedIndexedAccess)
export const DEFAULT_BRAND_COLOR = '#7A5900'

export function usePerfilCarpinteiro() {
  const { carpinteiro } = useAuthStore()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_BRAND_COLOR)
  // Cores personalizadas adicionadas via color picker durante a sessão
  const [customColors, setCustomColors] = useState<string[]>([])
  // Originais para detectar mudanças de logo/cor não capturadas pelo isDirty do RHF
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null)
  const [originalColor, setOriginalColor] = useState<string>(DEFAULT_BRAND_COLOR)

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
      custos_adicionais_padrao: 0, termos_condicoes_padrao: '',
    },
  })

  // Sincroniza o form com os dados do carpinteiro após o carregamento do auth store
  useEffect(() => {
    if (!carpinteiro) return
    reset({
      nome: carpinteiro.nome, cpf_cnpj: carpinteiro.cpf_cnpj,
      telefone: carpinteiro.telefone, endereco: carpinteiro.endereco,
      cidade: carpinteiro.cidade, estado: carpinteiro.estado,
      margem_lucro_padrao: carpinteiro.margem_lucro_padrao,
      valor_hora_mao_obra: carpinteiro.valor_hora_mao_obra,
      imposto_padrao: carpinteiro.imposto_padrao,
      custos_adicionais_padrao: carpinteiro.custos_adicionais_padrao ?? 0,
      termos_condicoes_padrao: carpinteiro.termos_condicoes_padrao ?? '',
    })
    // Sincroniza logo e cor a partir do perfil salvo, guardando os originais para comparação
    setLogoUrl(carpinteiro.logo_url)
    setOriginalLogoUrl(carpinteiro.logo_url)
    const savedColor = carpinteiro.cor_primaria ?? DEFAULT_BRAND_COLOR
    setSelectedColor(savedColor)
    setOriginalColor(savedColor)
    // Se a cor salva não for um preset, adiciona à paleta personalizada para exibição
    if (carpinteiro.cor_primaria && !BRAND_COLORS.includes(carpinteiro.cor_primaria)) {
      setCustomColors([carpinteiro.cor_primaria])
    }
  }, [carpinteiro, reset])

  // Agrega campos financeiros + termos em um objeto para o componente ConfiguracoesFinanceiras
  const financeiroValue: ConfiguracoesFinanceirasValue = {
    margem_lucro_padrao: watch('margem_lucro_padrao'),
    valor_hora_mao_obra: watch('valor_hora_mao_obra'),
    imposto_padrao: watch('imposto_padrao'),
    custos_adicionais_padrao: watch('custos_adicionais_padrao'),
    termos_condicoes_padrao: watch('termos_condicoes_padrao'),
  }

  function handleFinanceiroChange(v: ConfiguracoesFinanceirasValue) {
    // shouldTouch é necessário para isDirty detectar mudanças em campos controlados externamente pelo RHF
    setValue('margem_lucro_padrao', v.margem_lucro_padrao, { shouldDirty: true, shouldTouch: true })
    setValue('valor_hora_mao_obra', v.valor_hora_mao_obra, { shouldDirty: true, shouldTouch: true })
    setValue('imposto_padrao', v.imposto_padrao, { shouldDirty: true, shouldTouch: true })
    setValue('custos_adicionais_padrao', v.custos_adicionais_padrao, { shouldDirty: true, shouldTouch: true })
    setValue('termos_condicoes_padrao', v.termos_condicoes_padrao, { shouldDirty: true, shouldTouch: true })
  }

  // Durante o arrasto no picker nativo, atualiza apenas a prévia sem tocar na paleta
  // (onChange dispara a cada hover; adicionar aqui criaria dezenas de bolinhas intermediárias)
  function handleCustomColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedColor(e.target.value)
  }

  // Commit: adiciona à paleta apenas quando o picker é fechado (blur no input oculto)
  function handleCustomColorCommit(e: React.FocusEvent<HTMLInputElement>) {
    const color = e.target.value
    setCustomColors(prev => prev.includes(color) ? prev : [...prev, color])
    setSelectedColor(color)
  }

  async function onSubmit(values: PerfilFormValues) {
    if (!carpinteiro) return
    setSaveSuccess(false)
    try {
      // Persiste todos os campos do perfil, incluindo logo e cor_primaria controlados por estado local
      const { error } = await supabase
        .from('carpinteiros')
        .update({ ...values, logo_url: logoUrl, cor_primaria: selectedColor })
        .eq('id', carpinteiro.id)
      if (error) throw error

      const { data: { session } } = await supabase.auth.getSession()
      await useAuthStore.getState().setSession(session)
      setSaveSuccess(true)
      // Sincroniza os originais após salvar para que o botão de salvar volte a ficar desabilitado
      setOriginalLogoUrl(logoUrl)
      setOriginalColor(selectedColor)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      logError('perfil-carpinteiro/handleSubmit', err)
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('root', { message: `Erro ao salvar: ${message}` })
    }
  }

  // Feedback de validação quando o RHF rejeita o submit por campos inválidos
  function handleValidationError() {
    setError('root', { message: 'Corrija os campos com erro antes de salvar.' })
  }

  const nomeValue = watch('nome')
  const cidadeValue = watch('cidade')

  // Fallback para isDirty: compara logo e cor diretamente pois campos externos ao RHF não ativam isDirty
  const hasUnsavedChanges =
    isDirty || logoUrl !== originalLogoUrl || selectedColor !== originalColor

  return {
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
    handleColorSelect: setSelectedColor,
    handleCustomColorChange,
    handleCustomColorCommit,
    financeiroValue,
    handleFinanceiroChange,
    nomeValue,
    cidadeValue,
    hasUnsavedChanges,
    saveSuccess,
  }
}
