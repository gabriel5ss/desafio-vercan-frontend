export function digits(value: string): string {
  return value.replace(/\D/g, '')
}

export function maskCpf(value: string): string {
  return digits(value).slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCnpj(value: string): string {
  return digits(value).slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskPostalCode(value: string): string {
  return digits(value).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskPhone(value: string): string {
  const valueDigits = digits(value).slice(0, 11)
  if (valueDigits.length < 3) {
    return valueDigits
  }

  const area = valueDigits.slice(0, 2)
  const number = valueDigits.slice(2)
  const split = number.length > 8 ? number.length - 4 : Math.min(4, number.length)
  return `(${area}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ''}`
}

export function isValidCpf(value: string): boolean {
  const cpf = digits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  return [9, 10].every((length) => {
    const sum = [...cpf.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
    const digit = (sum * 10) % 11
    return Number(cpf[length]) === (digit === 10 ? 0 : digit)
  })
}

export function isValidCnpj(value: string): boolean {
  const cnpj = digits(value)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false
  }

  return [12, 13].every((length) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((total, weight, index) => total + Number(cnpj[index]) * weight, 0)
    const remainder = sum % 11
    return Number(cnpj[length]) === (remainder < 2 ? 0 : 11 - remainder)
  })
}
