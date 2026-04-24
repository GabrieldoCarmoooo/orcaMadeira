import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package, Link2, Plus, Trash2, ExternalLink, MessageCircle, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCatalogoProdutos } from '@/hooks/useCatalogoProdutos'
import { usePortfolios, getPortfolioThumbnails } from '@/hooks/usePortfolios'
import { CatalogoLinha } from '@/components/carpinteiro/catalogo-linha'
import { NovoPortfolioDialog } from '@/components/carpinteiro/novo-portfolio-dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Portfolio } from '@/types/portfolio'

type Tab = 'madeireira' | 'meus'

// Linhas skeleton para o estado de carregamento — mantém altura próxima das linhas reais
function SkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-[8px] bg-muted" />
      ))}
    </div>
  )
}

// Skeleton para os cards de portfólio
function PortfolioSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-muted">
          <div className="aspect-square w-full rounded-t-lg bg-muted-foreground/10" />
          <div className="p-3 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-muted-foreground/10" />
            <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CarpinteiroCatalogoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('madeireira')
  const [query, setQuery] = useState('')
  const [dialogAberto, setDialogAberto] = useState(false)
  const [portfolioParaExcluir, setPortfolioParaExcluir] = useState<Portfolio | null>(null)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  // useCatalogoProdutos unifica as 3 fontes: madeira_m3, outro_produto, legado_planilha
  const { items, isLoading, hasVinculacao } = useCatalogoProdutos(query)
  const { portfolios, isLoading: isLoadingPortfolios, remove: removerPortfolio } = usePortfolios()

  // Exibe "sem vinculação" apenas quando o loading terminou e não há vínculo aprovado
  const semVinculacao = !isLoading && !hasVinculacao

  // Busca a primeira imagem de cada portfólio para exibir como thumbnail nos cards
  useEffect(() => {
    if (!portfolios.length) {
      setThumbnails({})
      return
    }
    const ids = portfolios.map((p) => p.id)
    getPortfolioThumbnails(ids).then(setThumbnails)
  }, [portfolios])

  async function confirmarExclusao() {
    if (!portfolioParaExcluir) return
    await removerPortfolio(portfolioParaExcluir.id)
    setPortfolioParaExcluir(null)
  }

  function abrirWhatsApp(portfolio: Portfolio) {
    const url = `${window.location.origin}/p/${portfolio.slug ?? ''}`
    const texto = encodeURIComponent(`Olha meu portfólio: ${url}`)
    window.open(`https://wa.me/?text=${texto}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      {/* Campo de busca — compartilhado entre abas */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar em madeiras, produtos, ferragens..."
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {/* Abas Madeireira / Meus Produtos */}
      <div className="flex border-b border-outline-variant/20">
        {(['madeireira', 'meus'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-4 px-4 text-sm font-bold transition-colors',
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent',
            )}
          >
            {tab === 'madeireira' ? 'Madeireira' : 'Meus Produtos'}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba Madeireira */}
      {activeTab === 'madeireira' && (
        <>
          {semVinculacao ? (
            // Estado: carpinteiro sem vinculação aprovada
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Link2 className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-on-surface">Nenhuma madeireira vinculada</p>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Vincule-se a uma madeireira para acessar o catálogo de produtos e preços.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to={ROUTES.CARPINTEIRO_VINCULACAO}>
                  <Link2 size={14} />
                  Vincular madeireira
                </Link>
              </Button>
            </div>
          ) : isLoading ? (
            <SkeletonList />
          ) : items.length === 0 ? (
            // Estado: catálogo vazio ou sem resultado na busca
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Package className="h-10 w-10 text-on-surface-variant/30" />
              <p className="text-sm font-medium text-on-surface">Nenhum produto encontrado</p>
              <p className="text-xs text-on-surface-variant">
                {query.trim() ? 'Tente outra busca.' : 'O catálogo da madeireira está vazio.'}
              </p>
            </div>
          ) : (
            // Lista unificada das 3 fontes com badge de origem em cada linha
            <div className="space-y-2">
              {items.map((item) => (
                <CatalogoLinha key={`${item.origem}:${item.data.id}`} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Conteúdo da aba Meus Produtos — portfólios do carpinteiro */}
      {activeTab === 'meus' && (
        <div className="space-y-4">
          {/* Cabeçalho da aba com botão de criação */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              {portfolios.length > 0
                ? `${portfolios.length} portfólio${portfolios.length > 1 ? 's' : ''}`
                : 'Nenhum portfólio ainda'}
            </p>
            <Button size="sm" onClick={() => setDialogAberto(true)}>
              <Plus size={14} />
              Novo portfólio
            </Button>
          </div>

          {isLoadingPortfolios ? (
            <PortfolioSkeleton />
          ) : portfolios.length === 0 ? (
            // Estado vazio: orienta o carpinteiro a criar o primeiro portfólio
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
                <FolderOpen className="h-7 w-7 text-on-surface-variant/50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-on-surface">Crie seu primeiro portfólio</p>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Adicione fotos e PDFs dos seus trabalhos e compartilhe com clientes via WhatsApp.
                </p>
              </div>
              <Button size="sm" onClick={() => setDialogAberto(true)}>
                <Plus size={14} />
                Criar portfólio
              </Button>
            </div>
          ) : (
            // Grade de cards — 2 colunas no mobile, 3 no desktop
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {portfolios.map((portfolio) => {
                const thumbnail = thumbnails[portfolio.id]
                const dataFormatada = new Date(portfolio.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })

                return (
                  <div
                    key={portfolio.id}
                    className="flex flex-col overflow-hidden rounded-lg bg-surface-container-highest"
                  >
                    {/* Thumbnail: primeira imagem do portfólio ou ícone genérico */}
                    <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={`Thumbnail de ${portfolio.nome}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <FolderOpen className="h-8 w-8 text-on-surface-variant/30" />
                      )}
                    </div>

                    {/* Informações e ações do card */}
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div>
                        <p className="text-sm font-bold text-on-surface line-clamp-1">
                          {portfolio.nome}
                        </p>
                        <p className="text-xs text-on-surface-variant">{dataFormatada}</p>
                      </div>

                      {/* Ações: ver página pública, compartilhar no WhatsApp, excluir */}
                      <div className="mt-auto flex items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          asChild
                          title="Ver página pública"
                          className="text-on-surface-variant hover:text-on-surface"
                        >
                          <Link
                            to={ROUTES.PORTFOLIO_PUBLICO(portfolio.slug ?? '')}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={14} />
                            <span className="sr-only">Ver portfólio</span>
                          </Link>
                        </Button>

                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => abrirWhatsApp(portfolio)}
                          title="Compartilhar no WhatsApp"
                          className="text-on-surface-variant hover:text-[#25D366]"
                        >
                          <MessageCircle size={14} />
                          <span className="sr-only">Compartilhar no WhatsApp</span>
                        </Button>

                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPortfolioParaExcluir(portfolio)}
                          title="Excluir portfólio"
                          className="ml-auto text-on-surface-variant hover:text-destructive"
                        >
                          <Trash2 size={14} />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Dialog de criação de portfólio */}
      <NovoPortfolioDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
      />

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog
        open={!!portfolioParaExcluir}
        onOpenChange={(open) => { if (!open) setPortfolioParaExcluir(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir portfólio</AlertDialogTitle>
            <AlertDialogDescription>
              "{portfolioParaExcluir?.nome}" será excluído permanentemente, incluindo todos os arquivos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
