import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePdf } from '@/hooks/usePdf'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'

interface BotaoExportarPdfProps {
  orcamento: Orcamento
  itens: ItemOrcamento[]
  mostrarDetalhes?: boolean
}

export function BotaoExportarPdf({ orcamento, itens, mostrarDetalhes = false }: BotaoExportarPdfProps) {
  const { loading, exportar } = usePdf()

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={() => exportar(orcamento, itens, mostrarDetalhes)}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FileDown className="size-3.5" />
      )}
      {loading ? 'Gerando...' : 'Baixar PDF'}
    </Button>
  )
}
