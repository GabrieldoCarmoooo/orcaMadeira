import { StyleSheet } from '@react-pdf/renderer'

// Tokens de cor do design system Timber Grain — compartilhados entre sub-componentes do PDF
export const C = {
  primary: '#7A5900',
  primaryContainer: '#FFBC00',
  secondary: '#9D422B',
  surface: '#FEF8F4',
  surfaceHigh: '#F5EDE4',
  onSurface: '#1D1B19',
  onSurfaceMuted: '#6B5E53',
  white: '#FFFFFF',
} as const

// Estilos compartilhados entre múltiplos sub-componentes PDF
export const shared = StyleSheet.create({
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 16,
  },
})
