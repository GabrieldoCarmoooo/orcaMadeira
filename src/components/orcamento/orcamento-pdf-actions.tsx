import { Eye, FileDown, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import ToggleDetalhesPdf from '@/components/orcamento/toggle-detalhes-pdf'
import { usePdf } from '@/hooks/usePdf'
import { ROUTES } from '@/constants/routes'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'

interface OrcamentoPdfActionsProps {
  orcamento: Orcamento
  itens: ItemOrcamento[]
  mostrarDetalhes: boolean
  onToggleDetalhes: (value: boolean) => void
}

/**
 * Agrupa todas as ações de exportação e visualização de PDF do orçamento.
 * Usa uma única instância de usePdf para compartilhar o estado de loading
 * entre os botões "Baixar PDF" e "Baixar lista de materiais".
 */
export function OrcamentoPdfActions({
  orcamento,
  itens,
  mostrarDetalhes,
  onToggleDetalhes,
}: OrcamentoPdfActionsProps) {
  const navigate = useNavigate()
  const { exportar, exportarMateriais, loading } = usePdf()

  return (
    <>
      {/* Ações de PDF disponíveis em qualquer status do orçamento */}
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => exportar(orcamento, itens, mostrarDetalhes)}
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
        {loading ? 'Gerando...' : 'Baixar PDF'}
      </Button>

      {/* Baixa o PDF de materiais sem campos financeiros */}
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => exportarMateriais(orcamento, itens)}
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
        Baixar lista de materiais
      </Button>

      {/* Navega para a visualização in-app da proposta */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate(ROUTES.CARPINTEIRO_ORCAMENTO_PROPOSTA(orcamento.id))}
      >
        <Eye className="size-3.5" />
        Ver proposta
      </Button>

      {/* Componente com AlertDialog de confirmação ao ligar detalhes no PDF */}
      <ToggleDetalhesPdf value={mostrarDetalhes} onChange={onToggleDetalhes} />
    </>
  )
}
