import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Orcamento } from '@/types/orcamento'
import { C, shared } from './pdf-tokens'

const s = StyleSheet.create({
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
  clienteDetail: { fontSize: 8, color: C.onSurfaceMuted },
  projetoBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projetoCol: { flexDirection: 'column', gap: 2 },
  projetoNome: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
    marginBottom: 2,
  },
  projetoDesc: { fontSize: 8, color: C.onSurfaceMuted, maxWidth: 300 },
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
})

export interface PdfClienteProps {
  orcamento: Orcamento
  corPrimaria: string
}

// Traduz o código de tipo de projeto para exibição no badge
function tipoProjeto(tipo: string): string {
  return tipo === 'movel' ? 'Móveis' : 'Estruturas'
}

export function PdfCliente({ orcamento, corPrimaria }: PdfClienteProps) {
  return (
    <>
      {/* Seção Cliente */}
      <Text style={shared.sectionLabel}>Cliente</Text>
      <View style={s.clienteBox}>
        <Text style={s.clienteNome}>{orcamento.cliente_nome}</Text>
        {orcamento.cliente_telefone && (
          <Text style={s.clienteDetail}>{orcamento.cliente_telefone}</Text>
        )}
        {orcamento.cliente_email && (
          <Text style={s.clienteDetail}>{orcamento.cliente_email}</Text>
        )}
      </View>

      {/* Seção Projeto — segue imediatamente após o cliente */}
      <Text style={shared.sectionLabel}>Projeto</Text>
      <View style={s.projetoBox}>
        <View style={s.projetoCol}>
          <Text style={[s.projetoNome, { color: corPrimaria }]}>{orcamento.nome}</Text>
          {orcamento.descricao && (
            <Text style={s.projetoDesc}>{orcamento.descricao}</Text>
          )}
        </View>
        <View style={s.projetoBadge}>
          <Text style={[s.projetoBadgeText, { color: corPrimaria }]}>
            {tipoProjeto(orcamento.tipo_projeto)}
          </Text>
        </View>
      </View>
    </>
  )
}
