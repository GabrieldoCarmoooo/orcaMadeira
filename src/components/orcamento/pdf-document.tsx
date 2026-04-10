import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'
import type { Carpinteiro } from '@/types/carpinteiro'
import { formatBRL, formatDate } from '@/lib/pdf'

// ─── Design tokens (Timber Grain palette) ────────────────────────────────────
const C = {
  primary: '#7A5900',
  primaryContainer: '#FFBC00',
  secondary: '#9D422B',
  surface: '#FEF8F4',
  surfaceHigh: '#F5EDE4',
  onSurface: '#1D1B19',
  onSurfaceMuted: '#6B5E53',
  white: '#FFFFFF',
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
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

  // ── Header ──────────────────────────────────────────────────────────────────
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 4,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: C.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },
  carpinteiroInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  carpinteiroNome: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    letterSpacing: -0.3,
  },
  carpinteiroDetail: {
    fontSize: 8,
    color: C.onSurfaceMuted,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 3,
  },
  orcamentoLabel: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.secondary,
    letterSpacing: -0.5,
  },
  orcamentoMeta: {
    fontSize: 8,
    color: C.onSurfaceMuted,
  },
  orcamentoMetaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.onSurface,
  },

  // ── Sections ────────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 16,
  },
  clienteBox: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  clienteNome: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.onSurface,
    marginBottom: 3,
  },
  clienteDetail: {
    fontSize: 8,
    color: C.onSurfaceMuted,
  },

  // ── Projeto ──────────────────────────────────────────────────────────────────
  projetoBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projetoCol: {
    flexDirection: 'column',
    gap: 2,
  },
  projetoNome: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 2,
  },
  projetoDesc: {
    fontSize: 8,
    color: C.onSurfaceMuted,
    maxWidth: 300,
  },
  projetoBadge: {
    backgroundColor: C.primaryContainer,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  projetoBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    textTransform: 'uppercase',
  },

  // ── Materials Table ──────────────────────────────────────────────────────────
  table: {
    marginTop: 4,
    marginBottom: 16,
  },
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
  tableRowEven: {
    backgroundColor: C.surfaceHigh,
  },
  tableCell: {
    fontSize: 8,
    color: C.onSurface,
  },
  tableCellMuted: {
    fontSize: 8,
    color: C.onSurfaceMuted,
  },

  // Column widths
  colNome: { flex: 3 },
  colUnidade: { flex: 1, textAlign: 'center' },
  colQtd: { flex: 1, textAlign: 'center' },
  colPrecoUnit: { flex: 1.5, textAlign: 'right' },
  colSubtotal: { flex: 1.5, textAlign: 'right' },

  // ── Financial Breakdown ──────────────────────────────────────────────────────
  financeiroBox: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignSelf: 'flex-end',
    width: 260,
  },
  financeiroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  financeiroLabel: {
    fontSize: 8,
    color: C.onSurfaceMuted,
  },
  financeiroValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.onSurface,
  },
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
  financeiroTotalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },
  financeiroTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.secondary,
    letterSpacing: -0.4,
  },

  // ── Terms ────────────────────────────────────────────────────────────────────
  termosBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  termosText: {
    fontSize: 7.5,
    color: C.onSurfaceMuted,
    lineHeight: 1.5,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.surfaceHigh,
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: C.onSurfaceMuted,
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },
})

// ─── Props ────────────────────────────────────────────────────────────────────
export interface OrcamentoPdfProps {
  orcamento: Orcamento
  itens: ItemOrcamento[]
  carpinteiro: Carpinteiro
  logoBase64?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function tipoProjeto(tipo: string): string {
  return tipo === 'movel' ? 'Móveis' : 'Estruturas'
}

function validadeLabel(orcamento: Orcamento): string {
  if (!orcamento.validade_dias) return '—'
  const base = orcamento.finalizado_at ?? orcamento.created_at
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + orcamento.validade_dias)
  return formatDate(d.toISOString())
}

function maoObraLabel(orcamento: Orcamento): string {
  if (orcamento.mao_obra_tipo === 'hora') {
    const horas = orcamento.mao_obra_horas ?? 0
    return `${horas}h × ${formatBRL(orcamento.mao_obra_valor)}/h`
  }
  return formatBRL(orcamento.subtotal_mao_obra)
}

// ─── Component ────────────────────────────────────────────────────────────────
export function OrcamentoPdfDocument({
  orcamento,
  itens,
  carpinteiro,
  logoBase64,
}: OrcamentoPdfProps) {
  const idCurto = orcamento.id.slice(0, 8).toUpperCase()
  const dataEmissao = formatDate(orcamento.finalizado_at ?? orcamento.created_at)

  return (
    <Document
      title={`Orçamento ${idCurto}`}
      author={carpinteiro.nome}
      subject={orcamento.nome}
      creator="OrçaMadeira"
      producer="OrçaMadeira"
    >
      <Page size="A4" style={s.page}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            {logoBase64 ? (
              <Image style={s.logo} src={logoBase64} />
            ) : (
              <View style={s.logoPlaceholder}>
                <Text style={s.logoPlaceholderText}>
                  {carpinteiro.nome.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={s.carpinteiroInfo}>
              <Text style={s.carpinteiroNome}>{carpinteiro.nome}</Text>
              {carpinteiro.cpf_cnpj && (
                <Text style={s.carpinteiroDetail}>
                  CPF/CNPJ: {carpinteiro.cpf_cnpj}
                </Text>
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

        {/* ── Cliente ─────────────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>Cliente</Text>
        <View style={s.clienteBox}>
          <Text style={s.clienteNome}>{orcamento.cliente_nome}</Text>
          {orcamento.cliente_telefone && (
            <Text style={s.clienteDetail}>{orcamento.cliente_telefone}</Text>
          )}
          {orcamento.cliente_email && (
            <Text style={s.clienteDetail}>{orcamento.cliente_email}</Text>
          )}
        </View>

        {/* ── Projeto ─────────────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>Projeto</Text>
        <View style={s.projetoBox}>
          <View style={s.projetoCol}>
            <Text style={s.projetoNome}>{orcamento.nome}</Text>
            {orcamento.descricao && (
              <Text style={s.projetoDesc}>{orcamento.descricao}</Text>
            )}
          </View>
          <View style={s.projetoBadge}>
            <Text style={s.projetoBadgeText}>
              {tipoProjeto(orcamento.tipo_projeto)}
            </Text>
          </View>
        </View>

        {/* ── Materiais ───────────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>Materiais</Text>
        <View style={s.table}>
          {/* Table header — repeats on every page */}
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderText, s.colNome]}>Item</Text>
            <Text style={[s.tableHeaderText, s.colUnidade]}>Unid.</Text>
            <Text style={[s.tableHeaderText, s.colQtd]}>Qtd.</Text>
            <Text style={[s.tableHeaderText, s.colPrecoUnit]}>Preço Unit.</Text>
            <Text style={[s.tableHeaderText, s.colSubtotal]}>Subtotal</Text>
          </View>

          {itens.map((item, idx) => (
            <View
              key={item.id}
              style={[s.tableRow, idx % 2 !== 0 ? s.tableRowEven : {}]}
              wrap={false}
            >
              <Text style={[s.tableCell, s.colNome]}>{item.nome}</Text>
              <Text style={[s.tableCellMuted, s.colUnidade]}>
                {item.unidade}
              </Text>
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
          ))}
        </View>

        {/* ── Resumo Financeiro ───────────────────────────────────────────── */}
        <View style={s.financeiroBox} wrap={false}>
          <View style={s.financeiroRow}>
            <Text style={s.financeiroLabel}>Materiais</Text>
            <Text style={s.financeiroValue}>
              {formatBRL(orcamento.subtotal_materiais)}
            </Text>
          </View>

          <View style={s.financeiroRow}>
            <Text style={s.financeiroLabel}>
              Mão de Obra ({orcamento.mao_obra_tipo === 'hora' ? 'por hora' : 'fixo'})
            </Text>
            <Text style={s.financeiroValue}>{maoObraLabel(orcamento)}</Text>
          </View>

          {orcamento.margem_lucro > 0 && (
            <View style={s.financeiroRow}>
              <Text style={s.financeiroLabel}>
                Margem de Lucro ({orcamento.margem_lucro}%)
              </Text>
              <Text style={s.financeiroValue}>
                {formatBRL(orcamento.valor_margem)}
              </Text>
            </View>
          )}

          {orcamento.imposto > 0 && (
            <View style={s.financeiroRow}>
              <Text style={s.financeiroLabel}>
                Impostos ({orcamento.imposto}%)
              </Text>
              <Text style={s.financeiroValue}>
                {formatBRL(orcamento.valor_imposto)}
              </Text>
            </View>
          )}

          <View style={s.financeiroSeparator} />

          <View style={s.financeiroTotalRow}>
            <Text style={s.financeiroTotalLabel}>TOTAL</Text>
            <Text style={s.financeiroTotalValue}>
              {formatBRL(orcamento.total)}
            </Text>
          </View>
        </View>

        {/* ── Termos e Condições ──────────────────────────────────────────── */}
        {orcamento.termos_condicoes && (
          <>
            <Text style={s.sectionLabel}>Termos e Condições</Text>
            <View style={s.termosBox}>
              <Text style={s.termosText}>{orcamento.termos_condicoes}</Text>
            </View>
          </>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Documento gerado em {formatDate(new Date().toISOString())}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
          <Text style={s.footerBrand}>OrçaMadeira</Text>
        </View>
      </Page>
    </Document>
  )
}
