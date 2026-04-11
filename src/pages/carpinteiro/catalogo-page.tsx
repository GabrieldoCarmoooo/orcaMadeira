import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Package, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useItensPreco } from '@/hooks/useItensPreco'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import type { ItemPreco } from '@/types/madeireira'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type Tab = 'madeireira' | 'meus'

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
}

function ProductCard({ item }: { item: ItemPreco }) {
  const categoria = item.categoria ?? 'Material'

  return (
    <div className="bg-surface-container-highest rounded-lg overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1">
      {/* Image placeholder with gradient */}
      <div className="h-40 bg-gradient-to-br from-surface-container-high to-surface-container-highest relative flex items-center justify-center">
        <Package className="h-12 w-12 text-on-surface-variant/20" />
        {/* Badge */}
        {item.disponivel && (
          <span className="absolute top-3 right-3 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
            Disponível
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-secondary">
            {categoria}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-widest text-on-surface-variant/60 mt-0.5">
            Preço por {item.unidade}
          </p>
        </div>

        <p className="text-sm font-bold text-on-surface leading-tight line-clamp-2">
          {item.nome}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xl font-black tracking-tighter text-on-surface">
            {BRL.format(item.preco_unitario)}
          </span>
          <button
            className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
            aria-label={`Adicionar ${item.nome}`}
            title="Adicionar ao orçamento"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CarpinteiroCatalogoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('madeireira')
  const { itens, loading, query, setQuery, tabelaId } = useItensPreco()

  const semVinculacao = tabelaId === null && !loading

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar em MDF, Ferragens, Vernizes..."
          className="input-editorial w-full pl-11 pr-4 py-3 text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20">
        {(['madeireira', 'meus'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-4 px-4 text-sm font-bold transition-colors capitalize',
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent',
            )}
          >
            {tab === 'madeireira' ? 'Madeireira' : 'Meus Produtos'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'madeireira' && (
        <>
          {semVinculacao ? (
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
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Package className="h-10 w-10 text-on-surface-variant/30" />
              <p className="text-sm font-medium text-on-surface">Nenhum produto encontrado</p>
              <p className="text-xs text-on-surface-variant">
                {query ? 'Tente outra busca.' : 'O catálogo da madeireira está vazio.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {itens.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'meus' && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
            <Package className="h-7 w-7 text-on-surface-variant/50" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-on-surface">Produtos personalizados</p>
            <p className="text-xs text-on-surface-variant max-w-xs">
              Itens personalizados que você criou em seus orçamentos aparecerão aqui.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.CARPINTEIRO_NOVO_ORCAMENTO}>Criar orçamento com item personalizado</Link>
          </Button>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-20">
        <Button
          asChild
          className="rounded-xl px-5 py-5 bg-primary text-primary-foreground font-bold shadow-lg gap-2 h-auto"
        >
          <Link to={ROUTES.CARPINTEIRO_NOVO_ORCAMENTO}>
            <Plus size={18} />
            Nova Proposta
          </Link>
        </Button>
      </div>
    </div>
  )
}
