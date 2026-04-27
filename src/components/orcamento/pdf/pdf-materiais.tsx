import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ItemOrcamento } from '@/types/orcamento'
import { formatBRL } from '@/lib/pdf'
import { C, shared } from './pdf-tokens'

const s = StyleSheet.create({
  table: { marginTop: 4, marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  tableRowEven: { backgroundColor: C.surfaceHigh },
  tableCell: { fontSize: 8, color: C.onSurface },
  tableCellMuted: { fontSize: 8, color: C.onSurfaceMuted },
  // Linha auxiliar para espécie/dimensões e acabamento em itens de madeira m³
  itemAuxLabel: {
    fontSize: 8,
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  colNome: { flex: 3 },
  colUnidade: { flex: 1, textAlign: 'center' },
  colQtd: { flex: 1, textAlign: 'center' },
  colPrecoUnit: { flex: 1.5, textAlign: 'right' },
  colSubtotal: { flex: 1.5, textAlign: 'right' },
})

export interface PdfMateriaisProps {
  itens: ItemOrcamento[]
  corPrimaria: string
}

// Formata a linha de espécie + dimensões para itens de madeira m³.
// Retorna null para itens legados ou outros_produtos (sem especie_nome).
function formatLinhaEspecie(item: ItemOrcamento): string | null {
  if (item.origem !== 'madeira_m3' || !item.especie_nome) return null
  const esp = item.espessura_cm != null ? String(item.espessura_cm) : '?'
  const larg = item.largura_cm != null ? String(item.largura_cm) : '?'
  const comp =
    item.comprimento_real_m != null
      ? ` · ${item.comprimento_real_m.toFixed(2).replace('.', ',')}m`
      : ''
  return `${item.especie_nome} · ${esp}×${larg}cm${comp}`
}

// Formata a linha de acabamento quando há acabamento aplicado ao item.
function formatLinhaAcabamento(item: ItemOrcamento): string | null {
  if (!item.acabamento_nome) return null
  const pct =
    item.acabamento_percentual != null ? ` (+${item.acabamento_percentual}%)` : ''
  return `Acabamento: ${item.acabamento_nome}${pct}`
}

export function PdfMateriais({ itens, corPrimaria }: PdfMateriaisProps) {
  return (
    <>
      <Text style={shared.sectionLabel}>Materiais</Text>
      <View style={s.table}>
        <View style={[s.tableHeader, { backgroundColor: corPrimaria }]} fixed>
          <Text style={[s.tableHeaderText, s.colNome]}>Item</Text>
          <Text style={[s.tableHeaderText, s.colUnidade]}>Unid.</Text>
          <Text style={[s.tableHeaderText, s.colQtd]}>Qtd.</Text>
          <Text style={[s.tableHeaderText, s.colPrecoUnit]}>Preço Unit.</Text>
          <Text style={[s.tableHeaderText, s.colSubtotal]}>Subtotal</Text>
        </View>

        {itens.map((item, idx) => {
          // Calcula as linhas auxiliares; null quando o item é legado ou outro produto
          const linhaEspecie = formatLinhaEspecie(item)
          const linhaAcabamento = formatLinhaAcabamento(item)
          return (
            <View
              key={item.id}
              style={[s.tableRow, idx % 2 !== 0 ? s.tableRowEven : {}]}
              wrap={false}
            >
              <View style={s.colNome}>
                <Text style={s.tableCell}>{item.nome}</Text>
                {linhaEspecie && <Text style={s.itemAuxLabel}>{linhaEspecie}</Text>}
                {linhaAcabamento && <Text style={s.itemAuxLabel}>{linhaAcabamento}</Text>}
              </View>
              <Text style={[s.tableCellMuted, s.colUnidade]}>{item.unidade}</Text>
              <Text style={[s.tableCellMuted, s.colQtd]}>
                {item.quantidade % 1 === 0
                  ? item.quantidade.toString()
                  : item.quantidade.toFixed(2)}
              </Text>
              <Text style={[s.tableCellMuted, s.colPrecoUnit]}>
                {formatBRL(item.preco_unitario)}
              </Text>
              <Text style={[s.tableCell, s.colSubtotal]}>
                {formatBRL(item.subtotal)}
              </Text>
            </View>
          )
        })}
      </View>
    </>
  )
}
