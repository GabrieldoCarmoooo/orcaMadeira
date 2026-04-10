/**
 * PDF helper utilities for formatting values in pt-BR locale.
 */

/**
 * Formats a number as Brazilian Real currency string.
 * @example formatBRL(1234.56) → "R$ 1.234,56"
 */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formats an ISO date string as DD/MM/YYYY.
 * @example formatDate("2026-04-10T00:00:00Z") → "10/04/2026"
 */
export function formatDate(date: string): string {
  const d = new Date(date)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}
