import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePdf } from '@/hooks/usePdf'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'

interface BotaoExportarPdfProps {
  orcamento: Orcamento
  itens: ItemOrcamento[]
  mostrarDetalhes?: boolean
}

export function BotaoExportarPdf({ orcamento, itens, mostrarDetalhes = true }: BotaoExportarPdfProps) {
  const { loading, exportar } = usePdf()
  // PDF exportável para orçamentos salvo, enviado e pedido_fechado; não para rascunho/cancelado
  const canExport = orcamento.status === 'salvo' || orcamento.status === 'enviado' || orcamento.status === 'pedido_fechado'

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={!canExport || loading}
      onClick={() => exportar(orcamento, itens, mostrarDetalhes)}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FileDown className="size-3.5" />
      )}
      {loading ? 'Gerando...' : 'PDF'}
    </Button>
  )
}
