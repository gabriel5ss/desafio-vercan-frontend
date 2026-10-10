import { digits, isValidCnpj, isValidCpf } from './supplier'

type ContactMethod = { value: string, label: string }
type AdditionalContact = {
  name: string
  phones: ContactMethod[]
  emails: ContactMethod[]
}

export type SupplierFormValidationState = {
  type: 'individual' | 'company'
  name: string
  cpf: string
  rg: string
  corporate_name: string
  trade_name: string
  cnpj: string
  state_registration_indicator: string
  tax_regime: string
  postal_code: string
  street: string
  number: string
  district: string
  state_id: number | null
  city_id: number | null
  condominium: boolean | null
  condominium_address: string
  condominium_number: string
  primary_contact: { phones: ContactMethod[], emails: ContactMethod[] }
  additional_contacts: AdditionalContact[]
}

export type SupplierFormError = { name: string, message: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSupplierForm(form: SupplierFormValidationState): SupplierFormError[] {
  const errors: SupplierFormError[] = []
  const add = (name: string, message: string) => errors.push({ name, message })

  if (form.type === 'company') {
    if (!isValidCnpj(form.cnpj)) add('cnpj', 'Informe um CNPJ válido.')
    if (!form.corporate_name.trim()) add('corporate_name', 'Informe a razão social.')
    if (!form.trade_name.trim()) add('trade_name', 'Informe o nome fantasia.')
    if (!form.state_registration_indicator) add('state_registration_indicator', 'Selecione o indicador estadual.')
    if (!form.tax_regime) add('tax_regime', 'Selecione o regime de recolhimento.')
  } else {
    if (!isValidCpf(form.cpf)) add('cpf', 'Informe um CPF válido.')
    if (!form.name.trim()) add('name', 'Informe o nome.')
    if (!form.rg.trim()) add('rg', 'Informe o RG.')
  }

  if (digits(form.postal_code).length !== 8) add('postal_code', 'Informe um CEP válido.')
  for (const field of ['street', 'number', 'district'] as const) {
    if (!form[field].trim()) add(field, 'Campo obrigatório.')
  }
  if (!form.state_id) add('state_id', 'Selecione uma UF.')
  if (!form.city_id) add('city_id', 'Selecione uma cidade.')
  if (form.condominium === null) add('condominium', 'Informe se o endereço fica em condomínio.')
  if (form.condominium && !form.condominium_address.trim()) add('condominium_address', 'Informe o endereço no condomínio.')
  if (form.condominium && !form.condominium_number.trim()) add('condominium_number', 'Informe o número no condomínio.')

  if (!form.primary_contact.phones.length) add('primary_contact.phones', 'Adicione ao menos um telefone.')
  form.primary_contact.phones.forEach((phone, index) => {
    if (![10, 11].includes(digits(phone.value).length)) add(`primary_contact.phones.${index}.value`, 'Informe um telefone válido.')
    if (!phone.label) add(`primary_contact.phones.${index}.label`, 'Selecione o tipo de telefone.')
  })
  form.primary_contact.emails.forEach((email, index) => {
    if (email.value && !emailPattern.test(email.value)) add(`primary_contact.emails.${index}.value`, 'Informe um e-mail válido.')
  })

  form.additional_contacts.forEach((contact, index) => {
    if (!contact.name.trim()) add(`additional_contacts.${index}.name`, 'Informe o nome do contato.')
    contact.phones.forEach((phone, phoneIndex) => {
      if (phone.value && ![10, 11].includes(digits(phone.value).length)) add(`additional_contacts.${index}.phones.${phoneIndex}.value`, 'Informe um telefone válido.')
      if (phone.value && !phone.label) add(`additional_contacts.${index}.phones.${phoneIndex}.label`, 'Selecione o tipo de telefone.')
    })
    contact.emails.forEach((email, emailIndex) => {
      if (email.value && !emailPattern.test(email.value)) add(`additional_contacts.${index}.emails.${emailIndex}.value`, 'Informe um e-mail válido.')
    })
  })

  return errors
}
