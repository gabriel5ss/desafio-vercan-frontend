import { describe, expect, it } from 'vitest'
import { validateSupplierForm, type SupplierFormValidationState } from '../../app/utils/supplier-validation'

function validForm(overrides: Partial<SupplierFormValidationState> = {}): SupplierFormValidationState {
  return {
    type: 'company',
    name: '',
    cpf: '',
    rg: '',
    corporate_name: 'Vercan Tecnologia',
    trade_name: 'Vercan',
    cnpj: '11.222.333/0001-81',
    state_registration_indicator: 'contribuinte',
    tax_regime: 'payable_by_provider',
    postal_code: '13000-000',
    street: 'Rua Central',
    number: '100',
    district: 'Centro',
    state_id: 1,
    city_id: 2,
    condominium: false,
    condominium_address: '',
    condominium_number: '',
    primary_contact: {
      phones: [{ value: '(19) 3234-5678', label: 'Comercial' }],
      emails: [{ value: '', label: '' }],
    },
    additional_contacts: [],
    ...overrides,
  }
}

describe('supplier form validation', () => {
  it('accepts a valid company and an empty optional primary email', () => {
    expect(validateSupplierForm(validForm())).toEqual([])
  })

  it('validates company-only fields and CNPJ format', () => {
    const errors = validateSupplierForm(validForm({
      cnpj: '11.222.333/0001-80',
      corporate_name: ' ',
      trade_name: '',
      state_registration_indicator: '',
      tax_regime: '',
    }))

    expect(errors.map(error => error.name)).toEqual([
      'cnpj',
      'corporate_name',
      'trade_name',
      'state_registration_indicator',
      'tax_regime',
    ])
  })

  it('validates individual-only fields without requiring company fields', () => {
    const errors = validateSupplierForm(validForm({
      type: 'individual',
      cpf: '529.982.247-25',
      name: 'Joana Silva',
      rg: '1234567',
      corporate_name: '',
      trade_name: '',
      state_registration_indicator: '',
      tax_regime: '',
    }))

    expect(errors).toEqual([])
    expect(validateSupplierForm(validForm({ type: 'individual', cpf: '111.111.111-11' })))
      .toContainEqual({ name: 'cpf', message: 'Informe um CPF válido.' })
  })

  it('requires UF, city and condominium fields only when condominium is enabled', () => {
    const errors = validateSupplierForm(validForm({
      state_id: null,
      city_id: null,
      condominium: null,
    }))
    expect(errors.map(error => error.name)).toEqual(['state_id', 'city_id', 'condominium'])

    const condominiumErrors = validateSupplierForm(validForm({
      condominium: true,
      condominium_address: '',
      condominium_number: '',
    }))
    expect(condominiumErrors.map(error => error.name)).toEqual(['condominium_address', 'condominium_number'])
  })

  it('validates primary and additional contacts while allowing their optional emails', () => {
    const errors = validateSupplierForm(validForm({
      primary_contact: {
        phones: [{ value: '123', label: '' }],
        emails: [{ value: 'email-invalido', label: '' }],
      },
      additional_contacts: [{
        name: '',
        phones: [{ value: '(19) 123', label: '' }],
        emails: [{ value: 'invalido', label: '' }],
      }],
    }))

    expect(errors.map(error => error.name)).toEqual([
      'primary_contact.phones.0.value',
      'primary_contact.phones.0.label',
      'primary_contact.emails.0.value',
      'additional_contacts.0.name',
      'additional_contacts.0.phones.0.value',
      'additional_contacts.0.phones.0.label',
      'additional_contacts.0.emails.0.value',
    ])
  })
})
