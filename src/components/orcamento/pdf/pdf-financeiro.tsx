import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Orcamento } from '@/types/orcamento'
import { formatBRL } from '@/lib/pdf'
import { C, shared } from './pdf-tokens'

const s = StyleSheet.create({
  financeiroBox: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignSelf: 'flex-end',
    width: 260,
  },
  financeiroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  financeiroLabel: { fontSize: 8, color: C.onSurfaceMuted },
  financeiroValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.onSurface },
  financeiroSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: C.primary,
    borderBottomStyle: 'solid',
    marginVertical: 6,
    opacity: 0.3,
  },
  financeiroTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  financeiroTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.primary },
  financeiroTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.secondary,
    letterSpacing: -0.4,
  },
  termosBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  termosText: { fontSize: 7.5, color: C.onSurfaceMuted, lineHeight: 1.5 },
})

export interface PdfFinanceiroProps {
  orcamento: Orcamento
  corPrimaria: string
  mostrarDetalhes: boolean
}

// Formata o label de mão de obra diferenciando entre tipo fixo e por hora
function maoObraLabel(orcamento: Orcamento): string {
  if (orcamento.mao_obra_tipo === 'hora') {
    const horas = orcamento.mao_obra_horas ?? 0
    return `${horas}h × ${formatBRL(orcamento.mao_obra_valor)}/h`
  }
  return formatBRL(orcamento.subtotal_mao_obra)
}

export function PdfFinanceiro({ orcamento, corPrimaria, mostrarDetalhes }: PdfFinanceiroProps) {
  return (
    <>
      {/* Caixa do resumo financeiro — alinhada à direita da página */}
      <View style={s.financeiroBox} wrap={false}>
        {/* Breakdown detalhado só aparece quando mostrarDetalhes=true */}
        {mostrarDetalhes && (
          <>
            <View style={s.financeiroRow}>
              <Text style={s.financeiroLabel}>Materiais</Text>
              <Text style={s.financeiroValue}>{formatBRL(orcamento.subtotal_materiais)}</Text>
            </View>

            <View style={s.financeiroRow}>
              <Text style={s.financeiroLabel}>
                Mão de Obra ({orcamento.mao_obra_tipo === 'hora' ? 'por hora' : 'fixo'})
              </Text>
              <Text style={s.financeiroValue}>{maoObraLabel(orcamento)}</Text>
            </View>

            {/* valor_margem, deslocamento e custos_adicionais são omitidos intencionalmente:
                custos internos do carpinteiro nunca aparecem na proposta ao cliente,
                independente do toggle mostrarDetalhes. */}

            {orcamento.imposto > 0 && (
              <View style={s.financeiroRow}>
                <Text style={s.financeiroLabel}>Impostos ({orcamento.imposto}%)</Text>
                <Text style={s.financeiroValue}>{formatBRL(orcamento.valor_imposto)}</Text>
              </View>
            )}

            <View style={[s.financeiroSeparator, { borderBottomColor: corPrimaria }]} />
          </>
        )}

        <View style={s.financeiroTotalRow}>
          <Text style={[s.financeiroTotalLabel, { color: corPrimaria }]}>TOTAL</Text>
          <Text style={s.financeiroTotalValue}>{formatBRL(orcamento.total)}</Text>
        </View>
      </View>

      {/* Termos e condições — exibidos abaixo do resumo financeiro quando presentes */}
      {orcamento.termos_condicoes && (
        <>
          <Text style={shared.sectionLabel}>Termos e Condições</Text>
          <View style={s.termosBox}>
            <Text style={s.termosText}>{orcamento.termos_condicoes}</Text>
          </View>
        </>
      )}
    </>
  )
}
