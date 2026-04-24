import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, MessageCircle, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { getPortfolioBySlug, getStoragePublicUrl } from '@/hooks/usePortfolios'
import type { PortfolioComArquivos } from '@/types/portfolio'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

// Página pública acessível sem autenticação via /p/:slug
export default function PortfolioPublicoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [portfolio, setPortfolio] = useState<PortfolioComArquivos | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    getPortfolioBySlug(slug)
      .then((data) => {
        if (!data) setNotFound(true)
        else setPortfolio(data)
      })
      .finally(() => setIsLoading(false))
  }, [slug])

  // URL pública desta página — usada no compartilhamento via WhatsApp
  const paginaUrl = `${window.location.origin}/p/${slug ?? ''}`

  function compartilharWhatsApp() {
    const texto = encodeURIComponent(`Olha meu portfólio: ${paginaUrl}`)
    window.open(`https://wa.me/?text=${texto}`, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (notFound || !portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="space-y-2">
          <p className="text-lg font-bold text-on-surface">Portfólio não encontrado</p>
          <p className="text-sm text-on-surface-variant">
            O link pode ter expirado ou o portfólio foi removido.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.LOGIN}>
            <ArrowLeft size={14} />
            Ir para o início
          </Link>
        </Button>
      </div>
    )
  }

  // Separa arquivos por tipo para exibição organizada
  const imagens = portfolio.arquivos.filter((a) => a.tipo === 'imagem')
  const pdfs = portfolio.arquivos.filter((a) => a.tipo === 'pdf')

  return (
    <div className="min-h-screen bg-background">
      {/* Header com nome do portfólio e ações */}
      <header className="sticky top-0 z-10 border-b border-outline-variant/20 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-on-surface-variant">Portfólio</p>
            <h1 className="text-base font-bold text-on-surface">{portfolio.nome}</h1>
          </div>
          <Button size="sm" onClick={compartilharWhatsApp}>
            <MessageCircle size={14} />
            Compartilhar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* Galeria de imagens */}
        {imagens.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">
              Galeria
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {imagens.map((arq) => {
                const url = getStoragePublicUrl(arq.storage_path)
                return (
                  <a
                    key={arq.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-lg bg-muted"
                  >
                    <img
                      src={url}
                      alt={`Imagem do portfólio ${portfolio.nome}`}
                      className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* Estado vazio quando não há imagens */}
        {imagens.length === 0 && pdfs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ImageIcon className="h-10 w-10 text-on-surface-variant/30" />
            <p className="text-sm text-on-surface-variant">Nenhum arquivo neste portfólio.</p>
          </div>
        )}

        {/* Lista de PDFs para download */}
        {pdfs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">
              Documentos
            </h2>
            <ul className="space-y-2">
              {pdfs.map((arq, i) => {
                const url = getStoragePublicUrl(arq.storage_path)
                // Extrai nome amigável a partir do caminho no Storage
                const nomeArquivo = arq.storage_path.split('/').pop() ?? `Documento ${i + 1}`
                return (
                  <li key={arq.id}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm transition-colors hover:bg-muted/80"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-primary" />
                      <span className="flex-1 truncate text-on-surface">{nomeArquivo}</span>
                      <span className="shrink-0 text-xs text-on-surface-variant">Abrir PDF</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Botão WhatsApp repetido no rodapé para facilitar acesso em mobile */}
        <div className="flex justify-center pt-4">
          <Button onClick={compartilharWhatsApp} variant="outline">
            <MessageCircle size={16} />
            Compartilhar no WhatsApp
          </Button>
        </div>
      </main>
    </div>
  )
}
