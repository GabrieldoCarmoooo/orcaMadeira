/**
 * Validates CPF (11 digits) or CNPJ (14 digits) using the check-digit algorithm.
 * Accepts formatted (with dots/dashes/slashes) or plain digit strings.
 */
export function validarCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 11) return validarCPF(digits)
  if (digits.length === 14) return validarCNPJ(digits)

  return false
}

function validarCPF(cpf: string): boolean {
  // Reject all-same-digit sequences (e.g. "00000000000")
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  if (parseInt(cpf.charAt(9)) !== digit1) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  return parseInt(cpf.charAt(10)) === digit2
}

function validarCNPJ(cnpj: string): boolean {
  // Reject all-same-digit sequences
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * (weights1[i] ?? 0)
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  if (parseInt(cnpj.charAt(12)) !== digit1) return false

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * (weights2[i] ?? 0)
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  return parseInt(cnpj.charAt(13)) === digit2
}
