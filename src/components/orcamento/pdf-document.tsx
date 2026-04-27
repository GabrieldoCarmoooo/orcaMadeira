import { Document, Page, StyleSheet } from '@react-pdf/renderer'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'
import type { Carpinteiro } from '@/types/carpinteiro'
import { C } from './pdf/pdf-tokens'
import { PdfHeader } from './pdf/pdf-header'
import { PdfCliente } from './pdf/pdf-cliente'
import { PdfMateriais } from './pdf/pdf-materiais'
import { PdfFinanceiro } from './pdf/pdf-financeiro'
import { PdfFooter } from './pdf/pdf-footer'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    paddingTop: 40,
    paddingBottom: 52,
    paddingHorizontal: 40,
    fontSize: 9,
    color: C.onSurface,
  },
})

export interface OrcamentoPdfProps {
  orcamento: Orcamento
  itens: ItemOrcamento[]
  carpinteiro: Carpinteiro
  logoBase64?: string | undefined
  /** Quando false, omite a tabela de materiais e o breakdown; exibe só o total */
  mostrarDetalhes?: boolean
}

export function OrcamentoPdfDocument({
  orcamento,
  itens,
  carpinteiro,
  logoBase64,
  mostrarDetalhes = true,
}: OrcamentoPdfProps) {
  // Usa a cor primária do perfil do carpinteiro; fallback para Wood Gold do Timber Grain
  const corPrimaria = carpinteiro.cor_primaria ?? C.primary

  return (
    <Document
      title={`Orçamento ${orcamento.id.slice(0, 8).toUpperCase()}`}
      author={carpinteiro.nome}
      subject={orcamento.nome}
      creator="OrçaMadeira"
      producer="OrçaMadeira"
    >
      <Page size="A4" style={s.page}>
        <PdfHeader
          orcamento={orcamento}
          carpinteiro={carpinteiro}
          logoBase64={logoBase64}
          corPrimaria={corPrimaria}
        />
        <PdfCliente orcamento={orcamento} corPrimaria={corPrimaria} />
        {mostrarDetalhes && <PdfMateriais itens={itens} corPrimaria={corPrimaria} />}
        <PdfFinanceiro
          orcamento={orcamento}
          corPrimaria={corPrimaria}
          mostrarDetalhes={mostrarDetalhes}
        />
        <PdfFooter corPrimaria={corPrimaria} />
      </Page>
    </Document>
  )
}
