import { useState, useEffect, useMemo } from 'react'
import type { ComponentType, ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Loader2, FileText, AlertCircle, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrcamento } from '@/hooks/useOrcamento'
import { usePdf } from '@/hooks/usePdf'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROUTES } from '@/constants/routes'
import ToggleDetalhesPdf from '@/components/orcamento/toggle-detalhes-pdf'
import type { OrcamentoPdfProps } from '@/components/orcamento/pdf-document'

// ─── Types ────────────────────────────────────────────────────────────────────

// Tipo do PDFViewer carregado dinamicamente.
// children: ReactElement<DocumentProps> espelha o tipo real de PDFViewerProps,
// resolvendo a incompatibilidade de contravariance no assign.
type PDFViewerComp = ComponentType<{
  width?: string | number
  height?: string | number
  children?: ReactElement<DocumentProps>
}>

// Módulos PDF carregados lazily para não inflar o bundle principal.
// OrcamentoPdfDocument retorna ReactElement<DocumentProps> para satisfazer PDFViewerComp.children.
interface PdfModules {
  PDFViewer: PDFViewerComp
  OrcamentoPdfDocument: (props: OrcamentoPdfProps) => ReactElement<DocumentProps>
  logoBase64: string | undefined
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Converte URL de logo para base64 para evitar erros de CORS dentro do renderer PDF
async function fetchLogoBase64(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(undefined)
      reader.readAsDataURL(blob)
    })
  } catch {
    return undefined
  }
}

// Gera o blob da proposta PDF para uso no Web Share API sem depender dos módulos já em state
async function buildPropostaBlob(props: OrcamentoPdfProps): Promise<Blob> {
  const [{ pdf }, { OrcamentoPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/orcamento/pdf-document'),
  ])
  const el = OrcamentoPdfDocument(props)
  return pdf(el).toBlob()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropostaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { carpinteiro } = useAuthStore()
  const { orcamento, itens, loading: orcamentoLoading, error } = useOrcamento(id)
  const { loading: pdfLoading, exportar, exportarMateriais } = usePdf()

  const [mostrarDetalhes, setMostrarDetalhes] = useState(true)
  const [pdfModules, setPdfModules] = useState<PdfModules | null>(null)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [sharing, setSharing] = useState(false)

  // Detecta mobile: PDFViewer não renderiza corretamente em browsers mobile — usa fallback
  const isMobile = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
    [],
  )

  // Verifica suporte a Web Share API — botão "Compartilhar" só aparece quando disponível
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  // Carrega PDFViewer e OrcamentoPdfDocument de forma lazy ao receber os dados do orçamento.
  // Roda uma única vez por orçamento para evitar re-imports desnecessários.
  useEffect(() => {
    if (!orcamento || !carpinteiro) return

    let cancelled = false
    setViewerLoading(true)

    const load = async () => {
      try {
        const [logoB64, { PDFViewer }, { OrcamentoPdfDocument }] = await Promise.all([
          carpinteiro.logo_url ? fetchLogoBase64(carpinteiro.logo_url) : Promise.resolve(undefined),
          import('@react-pdf/renderer'),
          import('@/components/orcamento/pdf-document'),
        ])
        if (!cancelled) {
          setPdfModules({ PDFViewer, OrcamentoPdfDocument, logoBase64: logoB64 })
        }
      } finally {
        if (!cancelled) setViewerLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcamento?.id, carpinteiro?.id])

  // Elemento do Document PDF recriado apenas quando mostrarDetalhes ou os dados mudam
  const docElement = useMemo<ReactElement<DocumentProps> | null>(() => {
    if (!pdfModules || !orcamento || !carpinteiro) return null
    return pdfModules.OrcamentoPdfDocument({
      orcamento,
      itens,
      carpinteiro,
      logoBase64: pdfModules.logoBase64,
      mostrarDetalhes,
    })
  }, [pdfModules, orcamento, itens, carpinteiro, mostrarDetalhes])

  // Compartilha a proposta via Web Share API; baixa diretamente quando arquivos não suportados
  async function handleCompartilhar() {
    if (!orcamento || !carpinteiro || sharing) return
    setSharing(true)
    try {
      const blob = await buildPropostaBlob({
        orcamento,
        itens,
        carpinteiro,
        logoBase64: pdfModules?.logoBase64,
        mostrarDetalhes,
      })
      const slug = orcamento.cliente_nome
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      const file = new File(
        [blob],
        `orcamento-${orcamento.id.slice(0, 8)}-${slug}.pdf`,
        { type: 'application/pdf' },
      )

      // navigator.canShare verifica se o dispositivo aceita compartilhamento de arquivos
      const shareData: ShareData = { files: [file], title: orcamento.nome }
      if (typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.share({ title: orcamento.nome, text: `Proposta: ${orcamento.nome}` })
      }
    } catch (err) {
      // AbortError é esperado quando o usuário fecha o seletor nativo sem compartilhar
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Erro ao compartilhar proposta:', err)
      }
    } finally {
      setSharing(false)
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (orcamentoLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error || !orcamento) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error ?? 'Orçamento não encontrado.'}</p>
        <Button variant="outline" onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para orçamentos
        </Button>
      </div>
    )
  }

  // Alias com inicial maiúscula exigida pelo JSX para componentes dinâmicos
  const Viewer = pdfModules?.PDFViewer

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO(id!))}
          aria-label="Voltar ao orçamento"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight text-foreground">
            {orcamento.nome}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{orcamento.cliente_nome}</p>
        </div>

        <ToggleDetalhesPdf value={mostrarDetalhes} onChange={setMostrarDetalhes} />
      </header>

      {/* ── Área de visualização do PDF ────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
        {isMobile ? (
          // Fallback mobile: exibe CTA em vez do viewer (não suportado em mobile browsers)
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Proposta pronta!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use os botões abaixo para baixar ou compartilhar a proposta com seu cliente.
              </p>
            </div>
          </div>
        ) : viewerLoading || !docElement || !Viewer ? (
          // Aguardando carga dos módulos PDF em desktop
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando proposta...</p>
            </div>
          </div>
        ) : (
          // Viewer desktop — renderiza o PDF em iframe fornecido pelo @react-pdf/renderer
          <div className="flex-1" style={{ minHeight: '500px', height: '70vh' }}>
            <Viewer width="100%" height="100%">
              {docElement}
            </Viewer>
          </div>
        )}
      </main>

      {/* ── Barra de ações fixa na parte inferior ──────────────────────────── */}
      <footer className="sticky bottom-0 z-10 border-t bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Regera e baixa a proposta com a configuração atual de detalhes */}
            <Button
              onClick={() => exportar(orcamento, itens, mostrarDetalhes)}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar novamente
            </Button>

            {/* Compartilhar — exibido apenas quando o browser suporta Web Share API */}
            {canShare && (
              <Button
                variant="outline"
                onClick={handleCompartilhar}
                disabled={sharing || pdfLoading}
              >
                {sharing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Compartilhar
              </Button>
            )}

            {/* PDF reduzido com apenas a lista de materiais (sem valores financeiros) */}
            <Button
              variant="outline"
              onClick={() => exportarMateriais(orcamento, itens)}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="mr-2 h-4 w-4" />
              )}
              Baixar lista de materiais
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTOS)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para orçamentos
          </Button>
        </div>
      </footer>
    </div>
  )
}
