import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Orcamento } from '@/types/orcamento'
import type { Carpinteiro } from '@/types/carpinteiro'
import { formatDate } from '@/lib/pdf'
import { C } from './pdf-tokens'

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: C.primary,
    borderBottomStyle: 'solid',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 4, objectFit: 'contain' },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: C.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.primary },
  carpinteiroInfo: { flexDirection: 'column', gap: 2 },
  carpinteiroNome: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    letterSpacing: -0.3,
  },
  carpinteiroDetail: { fontSize: 8, color: C.onSurfaceMuted },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 3 },
  orcamentoLabel: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.secondary,
    letterSpacing: -0.5,
  },
  orcamentoMeta: { fontSize: 8, color: C.onSurfaceMuted },
  orcamentoMetaValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.onSurface },
})

export interface PdfHeaderProps {
  orcamento: Orcamento
  carpinteiro: Carpinteiro
  logoBase64?: string | undefined
  corPrimaria: string
}

// Calcula a data de validade somando validade_dias à data de finalização ou criação
function validadeLabel(orcamento: Orcamento): string {
  if (!orcamento.validade_dias) return '—'
  const base = orcamento.finalizado_at ?? orcamento.created_at
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + orcamento.validade_dias)
  return formatDate(d.toISOString())
}

export function PdfHeader({ orcamento, carpinteiro, logoBase64, corPrimaria }: PdfHeaderProps) {
  const idCurto = orcamento.id.slice(0, 8).toUpperCase()
  const dataEmissao = formatDate(orcamento.finalizado_at ?? orcamento.created_at)

  return (
    <View style={[s.header, { borderBottomColor: corPrimaria }]} fixed>
      <View style={s.headerLeft}>
        {logoBase64 ? (
          <Image style={s.logo} src={logoBase64} />
        ) : (
          <View style={s.logoPlaceholder}>
            <Text style={[s.logoPlaceholderText, { color: corPrimaria }]}>
              {carpinteiro.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={s.carpinteiroInfo}>
          <Text style={[s.carpinteiroNome, { color: corPrimaria }]}>{carpinteiro.nome}</Text>
          {carpinteiro.cpf_cnpj && (
            <Text style={s.carpinteiroDetail}>CPF/CNPJ: {carpinteiro.cpf_cnpj}</Text>
          )}
          {carpinteiro.telefone && (
            <Text style={s.carpinteiroDetail}>{carpinteiro.telefone}</Text>
          )}
          {carpinteiro.cidade && carpinteiro.estado && (
            <Text style={s.carpinteiroDetail}>
              {carpinteiro.cidade}, {carpinteiro.estado}
            </Text>
          )}
        </View>
      </View>

      <View style={s.headerRight}>
        <Text style={s.orcamentoLabel}>ORÇAMENTO</Text>
        <Text style={s.orcamentoMeta}>
          <Text style={s.orcamentoMetaValue}>#{idCurto}</Text>
        </Text>
        <Text style={s.orcamentoMeta}>
          Emitido em{' '}
          <Text style={s.orcamentoMetaValue}>{dataEmissao}</Text>
        </Text>
        <Text style={s.orcamentoMeta}>
          Válido até{' '}
          <Text style={s.orcamentoMetaValue}>{validadeLabel(orcamento)}</Text>
        </Text>
      </View>
    </View>
  )
}
