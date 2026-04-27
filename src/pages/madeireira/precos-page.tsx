import { useState } from 'react'
import { useNavigate, useMatch } from 'react-router-dom'
import { Upload, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUploadStore } from '@/stores/useUploadStore'
import { ROUTES } from '@/constants/routes'
import { logError } from '@/lib/log-error'
import { Button } from '@/components/ui/button'
import UploadPlanilha from '@/components/madeireira/upload-planilha'
import MapeamentoColunas from '@/components/madeireira/mapeamento-colunas'
import PreviaDados from '@/components/madeireira/previa-dados'
import { type ValidatedItemPreco } from '@/lib/schemas/preco-item-schema'
import HistoricoUploads from '@/components/madeireira/historico-uploads'
import { TabsProdutos } from '@/components/madeireira/catalogo/tabs-produtos'
import { EspeciesPanel } from '@/components/madeireira/catalogo/especies-panel'
import { MadeirasMcPanel } from '@/components/madeireira/catalogo/madeiras-m3-panel'
import { OutrosProdutosPanel } from '@/components/madeireira/catalogo/outros-produtos-panel'
import { AcabamentosPanel } from '@/components/madeireira/catalogo/acabamentos-panel'

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = [
  { key: 'upload', label: 'Arquivo' },
  { key: 'mapping', label: 'Mapeamento' },
  { key: 'preview', label: 'Prévia' },
] as const

type StepKey = (typeof STEPS)[number]['key']

function activeStep(step: string): StepKey {
  if (step === 'idle' || step === 'parsing') return 'upload'
  if (step === 'mapping') return 'mapping'
  return 'preview'
}

function StepIndicator({ step }: { step: string }) {
  const active = activeStep(step)
  const activeIdx = STEPS.findIndex((s) => s.key === active)

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const isDone = i < activeIdx
        const isCurrent = i === activeIdx

        return (
          <div key={s.key} className="flex items-center">
            {/* Circle */}
            <div
              className={[
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                isDone
                  ? 'bg-primary text-primary-foreground'
                  : isCurrent
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>

            {/* Label */}
            <span
              className={[
                'ml-2 text-xs font-medium',
                isCurrent ? 'text-foreground' : 'text-muted-foreground',
              ].join(' ')}
            >
              {s.label}
            </span>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'mx-3 h-px w-8 transition-colors',
                  i < activeIdx ? 'bg-primary' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

/** Inserts rows in chunks to avoid hitting request-size limits. */
async function batchInsert(
  tabelaId: string,
  validRows: ValidatedItemPreco[],
  chunkSize = 500,
) {
  for (let i = 0; i < validRows.length; i += chunkSize) {
    const chunk = validRows.slice(i, i + chunkSize).map((row) => ({
      tabela_id: tabelaId,
      nome: row.nome,
      unidade: row.unidade,
      preco_unitario: row.preco_unitario,
      codigo: row.codigo ?? null,
      descricao: row.descricao ?? null,
      disponivel: true,
    }))

    const { error } = await supabase.from('itens_preco').insert(chunk)
    if (error) throw new Error(error.message)
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MadeireiraPrecosPage() {
  const navigate = useNavigate()
  const isNovoRoute = useMatch(ROUTES.MADEIREIRA_PRECOS_NOVO)

  const { madeireira } = useAuthStore()
  const { step, file, reset } = useUploadStore()

  /** Refresh key passed to HistoricoUploads to trigger re-fetch after a new upload */
  const [refreshKey, setRefreshKey] = useState(0)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Show wizard when on /novo route OR when the upload flow is already in progress
  const showWizard = Boolean(isNovoRoute) || step !== 'idle'

  function handleStartUpload() {
    reset()
    setSaveError(null)
    setSuccessMessage(null)
    navigate(ROUTES.MADEIREIRA_PRECOS_NOVO)
  }

  function handleCancelUpload() {
    reset()
    setSaveError(null)
    navigate(ROUTES.MADEIREIRA_PRECOS)
  }

  async function handleConfirm(validRows: ValidatedItemPreco[]) {
    if (!madeireira) return

    setSaving(true)
    setSaveError(null)

    // Build a descriptive table name from the filename + current date
    const dateStr = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date())
    const baseName = file
      ? file.name.replace(/\.[^/.]+$/, '')
      : 'Importação'
    const tabelaNome = `${baseName} – ${dateStr}`

    try {
      // Step 1: create the new price table (inactive while items aren't inserted yet)
      const { data: tabela, error: tabelaError } = await supabase
        .from('tabelas_preco')
        .insert({ madeireira_id: madeireira.id, nome: tabelaNome, ativo: false })
        .select('id')
        .single()

      if (tabelaError || !tabela) {
        throw new Error(tabelaError?.message ?? 'Erro ao criar tabela de preços.')
      }

      // Step 2: batch insert all valid items — rollback on failure
      try {
        await batchInsert(tabela.id, validRows)
      } catch (err) {
        // Rollback: delete the orphaned table
        logError('precos/batchInsert', err)
        await supabase.from('tabelas_preco').delete().eq('id', tabela.id)
        throw err
      }

      // Step 3: atomic swap — deactivate all previous tables, then activate the new one
      await supabase
        .from('tabelas_preco')
        .update({ ativo: false })
        .eq('madeireira_id', madeireira.id)
        .neq('id', tabela.id)

      const { error: activateError } = await supabase
        .from('tabelas_preco')
        .update({ ativo: true })
        .eq('id', tabela.id)

      if (activateError) throw new Error(activateError.message)

      // Success — reset wizard, refresh history, navigate back
      reset()
      setRefreshKey((k) => k + 1)
      setSuccessMessage(
        `${validRows.length} ${validRows.length === 1 ? 'produto importado' : 'produtos importados'} com sucesso!`,
      )
      navigate(ROUTES.MADEIREIRA_PRECOS)
    } catch (err) {
      logError('precos/handleSalvar', err)
      setSaveError(
        err instanceof Error ? err.message : 'Erro inesperado ao salvar. Tente novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  // ── Wizard view ─────────────────────────────────────────────────────────────
  if (showWizard) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button
            onClick={handleCancelUpload}
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Tabela de Preços
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">Novo Upload</span>
        </nav>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Step content */}
        <div className="rounded-2xl bg-card shadow-tinted p-6 space-y-4">
          {(step === 'idle' || step === 'parsing') && (
            <>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold">Selecione o arquivo</h3>
                <p className="text-xs text-muted-foreground">
                  CSV, XLSX ou XLS com os produtos e preços da sua tabela.
                </p>
              </div>
              <UploadPlanilha />
            </>
          )}

          {step === 'mapping' && <MapeamentoColunas />}

          {step === 'previewing' && (
            <>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold">Prévia dos dados</h3>
                <p className="text-xs text-muted-foreground">
                  Verifique os dados antes de confirmar. Linhas com erro não serão importadas.
                </p>
              </div>
              <PreviaDados onConfirm={handleConfirm} />
            </>
          )}

          {/* Saving feedback */}
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando produtos no banco de dados…
            </div>
          )}

          {/* Save error */}
          {saveError && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}
        </div>

        {/* Cancel link */}
        <div className="text-center">
          <button
            onClick={handleCancelUpload}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Cancelar e voltar
          </button>
        </div>
      </div>
    )
  }

  // ── Conteúdo da aba "Importar Planilha" — histórico + botão para abrir wizard ──
  const importarContent = (
    <div className="space-y-6">
      {/* Cabeçalho com CTA de novo upload */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Importar Planilha</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Importe CSV ou XLSX para adicionar produtos em massa à tabela de preços.
          </p>
        </div>
        <Button onClick={handleStartUpload} className="shrink-0">
          <Upload className="h-4 w-4" />
          Novo Upload
        </Button>
      </div>

      {/* Banner de sucesso após import bem-sucedido */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Histórico de uploads anteriores */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">
          Histórico de uploads
        </h2>
        <HistoricoUploads refreshKey={refreshKey} />
      </section>
    </div>
  )

  // ── Tabbed layout (default) ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabeçalho da página com novo título */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Produtos & Preços</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie o catálogo de produtos disponibilizado aos carpinteiros parceiros.
        </p>
      </div>

      {/* Layout com abas: 4 categorias do catálogo relacional + importação via planilha */}
      <TabsProdutos
        especies={<EspeciesPanel />}
        madeirasMc={<MadeirasMcPanel />}
        outrosProdutos={<OutrosProdutosPanel />}
        acabamentos={<AcabamentosPanel />}
        importar={importarContent}
      />
    </div>
  )
}
