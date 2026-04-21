import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Valores válidos para as abas do catálogo de produtos
export type TabProdutoValue =
  | 'especies'
  | 'madeiras-m3'
  | 'outros-produtos'
  | 'acabamentos'
  | 'importar'

interface TabsProdutosProps {
  especies: ReactNode
  madeirasMc: ReactNode
  outrosProdutos: ReactNode
  acabamentos: ReactNode
  importar: ReactNode
  defaultValue?: TabProdutoValue
  className?: string
}

// Definição estática das abas para evitar repetição e facilitar manutenção
const ABAS: { value: TabProdutoValue; label: string }[] = [
  { value: 'especies', label: 'Espécies' },
  { value: 'madeiras-m3', label: 'Madeiras m³' },
  { value: 'outros-produtos', label: 'Outros Produtos' },
  { value: 'acabamentos', label: 'Acabamentos' },
  { value: 'importar', label: 'Importar Planilha' },
]

/**
 * Wrapper de abas do catálogo com estilo Timber Grain.
 * Sem sublinhado 1px — aba ativa usa bloco tonal (bg-surface-container-highest).
 * Container das abas em bg-surface-container-low com 16px de padding vertical entre abas e conteúdo.
 */
export function TabsProdutos({
  especies,
  madeirasMc,
  outrosProdutos,
  acabamentos,
  importar,
  defaultValue = 'especies',
  className,
}: TabsProdutosProps) {
  return (
    <Tabs defaultValue={defaultValue} className={cn('w-full', className)}>
      {/* Faixa de abas com fundo tonal inferior — define separação visual sem borda 1px */}
      <div className="bg-surface-container-low px-4 pt-2 overflow-x-auto">
        <TabsList
          className={cn(
            'h-auto bg-transparent rounded-none p-0 gap-1',
            'w-max min-w-full justify-start',
          )}
        >
          {ABAS.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                // Formato editorial: cantos superiores arredondados, fundo tonal ao ativar
                'rounded-t-lg rounded-b-none px-4 py-2.5',
                'text-sm font-medium tracking-tight',
                // Inativo: texto em variante de superfície (Timber Grain)
                'text-on-surface-variant',
                // Sem sombra nem borda — estrutura por tonal layering
                'shadow-none border-0',
                // Ativo: destaque tonal com texto primário (usa ! para sobrescrever padrão shadcn)
                'data-[state=active]:!bg-surface-container-highest data-[state=active]:!text-primary',
                'hover:text-primary/80 transition-colors',
              )}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Separação tonal de 16px entre abas e conteúdo do painel (Timber Grain) */}
      <div className="pt-4">
        <TabsContent value="especies" className="mt-0">
          {especies}
        </TabsContent>
        <TabsContent value="madeiras-m3" className="mt-0">
          {madeirasMc}
        </TabsContent>
        <TabsContent value="outros-produtos" className="mt-0">
          {outrosProdutos}
        </TabsContent>
        <TabsContent value="acabamentos" className="mt-0">
          {acabamentos}
        </TabsContent>
        <TabsContent value="importar" className="mt-0">
          {importar}
        </TabsContent>
      </div>
    </Tabs>
  )
}

export default TabsProdutos
