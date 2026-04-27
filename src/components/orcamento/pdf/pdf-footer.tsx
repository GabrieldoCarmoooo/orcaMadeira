import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { formatDate } from '@/lib/pdf'
import { C } from './pdf-tokens'

const s = StyleSheet.create({
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
  footerText: { fontSize: 7, color: C.onSurfaceMuted },
  footerBrand: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.primary },
})

export interface PdfFooterProps {
  corPrimaria: string
}

export function PdfFooter({ corPrimaria }: PdfFooterProps) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        Documento gerado em {formatDate(new Date().toISOString())}
      </Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
      <Text style={[s.footerBrand, { color: corPrimaria }]}>OrçaMadeira</Text>
    </View>
  )
}
