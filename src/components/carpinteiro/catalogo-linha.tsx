import { cn } from '@/lib/utils'
import { calcularValorVendaM3, calcularValorMadeiraM3 } from '@/lib/calcular-madeira'
import type { CatalogoItem } from '@/types/produto'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Configuração visual do badge por origem do item no catálogo
const ORIGEM_CONFIG: Record<
  CatalogoItem['origem'],
  { label: string; className: string }
> = {
  madeira_m3: {
    label: 'Madeira',
    className: 'bg-primary/10 text-primary',
  },
  outro_produto: {
    label: 'Produto',
    className: 'bg-secondary/10 text-secondary',
  },
  legado_planilha: {
    label: 'Planilha',
    className: 'bg-muted text-muted-foreground',
  },
}

interface CatalogoLinhaProps {
  item: CatalogoItem
  className?: string
}

// Linha unificada do catálogo: nome, dimensões/unidade, espécie (quando madeira m³), preço e badge de origem.
// Usada na aba Madeireira de catalogo-page.tsx — somente exibição, sem ação de adição.
export function CatalogoLinha({ item, className }: CatalogoLinhaProps) {
  const { label, className: badgeClass } = ORIGEM_CONFIG[item.origem]

  // Extrai informações de exibição de acordo com o tipo de item
  let subtitulo: string
  let preco: number | null = null

  if (item.origem === 'madeira_m3') {
    const { espessura_cm, largura_cm, comprimento_m, especie } = item.data

    // Dimensões no formato "5×15 cm · Espécie" — comprimento_m é o valor de referência
    subtitulo = `${espessura_cm}×${largura_cm} cm · ${comprimento_m} m`
    if (especie) {
      subtitulo += ` · ${especie.nome}`
    }

    // Calcula o preço para o comprimento de referência da peça usando a fórmula do domínio
    if (especie) {
      const valorM3 = calcularValorVendaM3(especie.custo_m3, especie.margem_lucro_pct)
      preco = calcularValorMadeiraM3(espessura_cm, largura_cm, comprimento_m, valorM3)
    }
  } else {
    // outro_produto e legado_planilha — preço fixo por unidade
    subtitulo = item.data.unidade
    preco = item.data.preco_unitario
  }

  return (
    <div className={cn('flex items-center gap-3 rounded-[8px] bg-muted/50 px-3 py-2.5', className)}>
      {/* Nome e subtítulo (dimensões ou unidade + espécie) */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.data.nome}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
      </div>

      {/* Preço e badge de origem */}
      <div className="flex shrink-0 items-center gap-2">
        {preco !== null && (
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {BRL.format(preco)}
          </span>
        )}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest',
            badgeClass,
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
