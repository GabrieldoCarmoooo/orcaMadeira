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
import { formatDate } from '@/lib/pdf'

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
  docLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.secondary,
    letterSpacing: -0.3,
  },
  docMeta: {
    fontSize: 8,
    color: C.onSurfaceMuted,
  },
  docMetaValue: {
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

  // ── Tabela de Materiais (sem colunas de preço) ──────────────────────────────
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

  // Linha auxiliar para espécie e acabamento — idêntica ao pdf-document.tsx
  itemAuxLabel: {
    fontSize: 8,
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },

  // Colunas — apenas nome, especificação e quantidade (sem preços)
  colNome: { flex: 3 },
  colEspec: { flex: 2 },
  colQtd: { flex: 1, textAlign: 'right' },

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
export interface MateriaisPdfProps {
  orcamento: Orcamento
  itens: ItemOrcamento[]
  carpinteiro: Carpinteiro
  logoBase64?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function tipoProjeto(tipo: string): string {
  return tipo === 'movel' ? 'Móveis' : 'Estruturas'
}

// Retorna a especificação técnica: dimensões para madeira m³ ou unidade para outros produtos.
function formatEspecificacao(item: ItemOrcamento): string {
  if (item.origem === 'madeira_m3') {
    const esp = item.espessura_cm != null ? String(item.espessura_cm) : '?'
    const larg = item.largura_cm != null ? String(item.largura_cm) : '?'
    const comp =
      item.comprimento_real_m != null
        ? ` · ${item.comprimento_real_m.toFixed(2).replace('.', ',')}m`
        : ''
    return `${esp}×${larg}cm${comp}`
  }
  return item.unidade
}

// Retorna o nome da espécie para itens de madeira m³; null para os demais.
function formatEspecie(item: ItemOrcamento): string | null {
  if (item.origem !== 'madeira_m3' || !item.especie_nome) return null
  return item.especie_nome
}

// Retorna info de acabamento quando aplicado ao item.
function formatAcabamento(item: ItemOrcamento): string | null {
  if (!item.acabamento_nome) return null
  const pct =
    item.acabamento_percentual != null ? ` (+${item.acabamento_percentual}%)` : ''
  return `Acabamento: ${item.acabamento_nome}${pct}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MateriaisPdfDocument({
  orcamento,
  itens,
  carpinteiro,
  logoBase64,
}: MateriaisPdfProps) {
  const idCurto = orcamento.id.slice(0, 8).toUpperCase()
  const dataEmissao = formatDate(orcamento.finalizado_at ?? orcamento.created_at)

  return (
    <Document
      title={`Lista de Materiais — ${idCurto}`}
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
            <Text style={s.docLabel}>LISTA DE MATERIAIS</Text>
            <Text style={s.docMeta}>
              Ref. orçamento{' '}
              <Text style={s.docMetaValue}>#{idCurto}</Text>
            </Text>
            <Text style={s.docMeta}>
              Emitido em{' '}
              <Text style={s.docMetaValue}>{dataEmissao}</Text>
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

        {/* ── Tabela de materiais — nenhum campo financeiro exibido ─────────── */}
        <Text style={s.sectionLabel}>Materiais</Text>
        <View style={s.table}>
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderText, s.colNome]}>Item</Text>
            <Text style={[s.tableHeaderText, s.colEspec]}>Especificação</Text>
            <Text style={[s.tableHeaderText, s.colQtd]}>Qtd.</Text>
          </View>

          {itens.map((item, idx) => {
            // Monta as informações auxiliares: espécie e acabamento para itens de madeira m³
            const especificacao = formatEspecificacao(item)
            const especie = formatEspecie(item)
            const acabamento = formatAcabamento(item)
            return (
              <View
                key={item.id}
                style={[s.tableRow, idx % 2 !== 0 ? s.tableRowEven : {}]}
                wrap={false}
              >
                <View style={s.colNome}>
                  <Text style={s.tableCell}>{item.nome}</Text>
                  {especie && (
                    <Text style={s.itemAuxLabel}>{especie}</Text>
                  )}
                  {acabamento && (
                    <Text style={s.itemAuxLabel}>{acabamento}</Text>
                  )}
                </View>
                <Text style={[s.tableCellMuted, s.colEspec]}>{especificacao}</Text>
                <Text style={[s.tableCellMuted, s.colQtd]}>
                  {item.quantidade % 1 === 0
                    ? item.quantidade.toString()
                    : item.quantidade.toFixed(2)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Gerado em {formatDate(new Date().toISOString())} — {carpinteiro.nome}
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
