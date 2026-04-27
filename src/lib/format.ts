// Formatadores pt-BR reutilizados em múltiplas telas do sistema
export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const DATE_FMT_LONGO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
