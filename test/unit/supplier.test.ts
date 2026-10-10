import { describe, expect, it } from 'vitest'
import { isValidCnpj, isValidCpf, maskPostalCode, maskCnpj, maskCpf, maskPhone } from '../../app/utils/supplier'

describe('supplier document and contact formatting', () => {
  it('validates CPF and CNPJ check digits', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11.222.333/0001-80')).toBe(false)
  })

  it('masks CPF, CNPJ, postal codes and both Brazilian phone lengths', () => {
    expect(maskCpf('52998224725')).toBe('529.982.247-25')
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(maskPostalCode('13000000')).toBe('13000-000')
    expect(maskPhone('1932345678')).toBe('(19) 3234-5678')
    expect(maskPhone('19987654321')).toBe('(19) 98765-4321')
  })
})
