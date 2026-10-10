import { defineComponent } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SupplierForm from '../../app/components/SupplierForm.vue'

const { apiMock, supplierApiMock, navigateMock, fetchMock } = vi.hoisted(() => {
  const api = {
    states: vi.fn().mockResolvedValue({ data: [] }),
    cities: vi.fn().mockResolvedValue({ data: [] }),
    list: vi.fn(),
    show: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    lookupCnpj: vi.fn(),
  }
  return { apiMock: api, supplierApiMock: vi.fn(() => api), navigateMock: vi.fn(), fetchMock: vi.fn() }
})
mockNuxtImport('useSuppliersApi', () => supplierApiMock)
mockNuxtImport('navigateTo', () => navigateMock)
mockNuxtImport('$fetch', () => fetchMock)

const ButtonStub = defineComponent({
  props: ['label', 'type', 'ariaLabel', 'to'],
  emits: ['click'],
  template: '<button :type="type || \'button\'" :aria-label="ariaLabel" @click="$emit(\'click\')"><slot />{{ label }}</button>',
})

const RadioStub = defineComponent({
  props: ['modelValue', 'items'],
  emits: ['update:modelValue'],
  template: '<div><button v-for="item in items" :key="item.value" @click="$emit(\'update:modelValue\', item.value)">{{ item.label }}</button></div>',
})

const FormFieldStub = defineComponent({
  props: ['label', 'name', 'required'],
  template: '<label>{{ label }}<slot /></label>',
})

const InputStub = defineComponent({
  props: ['modelValue', 'type', 'placeholder'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" :type="type || \'text\'" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)">',
})

const SelectStub = defineComponent({
  props: ['modelValue', 'items', 'placeholder'],
  emits: ['update:modelValue'],
  template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">{{ placeholder }}</option><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
})

const clearFormFieldErrors = vi.fn()
const setFormErrors = vi.fn()
const FormStub = defineComponent({
  props: ['state', 'validate'],
  emits: ['submit'],
  setup(_, { expose }) {
    expose({ clear: clearFormFieldErrors, setErrors: setFormErrors })
  },
  template: '<form @submit.prevent="$emit(\'submit\', { data: state })"><slot /></form>',
})

const stubs = {
  UButton: ButtonStub,
  URadioGroup: RadioStub,
  UFormField: FormFieldStub,
  UInput: InputStub,
  USelect: SelectStub,
  UForm: FormStub,
  UCard: defineComponent({ template: '<section><header><slot name="header" /></header><slot /></section>' }),
  UAlert: defineComponent({ props: ['description'], template: '<p role="alert">{{ description }}</p>' }),
  UEditor: defineComponent({ template: '<div />' }),
  UModal: defineComponent({ template: '<div />' }),
}

async function mountForm() {
  const wrapper = await mountSuspended(SupplierForm, { global: { stubs } })
  await flushPromises()
  return wrapper
}

describe('supplier form', () => {
  beforeEach(() => {
    apiMock.states.mockResolvedValue({ data: [] })
    apiMock.cities.mockResolvedValue({ data: [] })
    apiMock.show.mockReset()
    apiMock.lookupCnpj.mockReset()
    apiMock.create.mockReset()
    apiMock.update.mockReset()
    navigateMock.mockReset()
    fetchMock.mockReset()
    clearFormFieldErrors.mockReset()
    setFormErrors.mockReset()
  })

  it('switches between company and individual fields', async () => {
    const wrapper = await mountForm()

    expect(wrapper.text()).toContain('CNPJ')
    expect(wrapper.text()).toContain('Razão Social')
    expect(wrapper.text()).not.toContain('CPF')

    const individualOption = wrapper.findAll('button').find(button => button.text() === 'Pessoa Física')
    await individualOption?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('CPF')
    expect(wrapper.text()).toContain('Apelido')
    expect(wrapper.text()).not.toContain('Razão Social')

    wrapper.unmount()
  })

  it('creates an additional contact with an initial phone and email and can add more', async () => {
    const wrapper = await mountForm()
    const addContact = wrapper.findAll('button').find(button => button.text().includes('Adicionar contato'))
    await addContact?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Contato 1')
    expect(wrapper.findAll('input[placeholder="(00) 00000-0000"]')).toHaveLength(2)
    expect(wrapper.findAll('input[placeholder="contato@empresa.com"]')).toHaveLength(1)

    const addPhone = wrapper.findAll('button').find(button => button.text() === 'Adicionar telefone' && button.element.closest('section')?.textContent?.includes('Contato 1'))
    await addPhone?.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('input[placeholder="(00) 00000-0000"]')).toHaveLength(3)
    expect(apiMock.states).toHaveBeenCalledOnce()

    wrapper.unmount()
  })

  it('creates a supplier and removes blank optional contact methods from the payload', async () => {
    apiMock.create.mockResolvedValue({ data: { id: 1 } })
    const wrapper = await mountForm()
    const addContact = wrapper.findAll('button').find(button => button.text().includes('Adicionar contato'))
    await addContact?.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(apiMock.create).toHaveBeenCalledOnce()
    const payload = apiMock.create.mock.calls[0]?.[0]
    expect(payload.primary_contact.emails).toEqual([])
    expect(payload.additional_contacts).toHaveLength(1)
    expect(payload.additional_contacts[0].phones).toEqual([])
    expect(payload.additional_contacts[0].emails).toEqual([])
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/fornecedores')

    wrapper.unmount()
  })

  it('shows a useful message when supplier creation fails', async () => {
    apiMock.create.mockRejectedValue(new Error('API offline'))
    const wrapper = await mountForm()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível salvar o fornecedor. Tente novamente.')
    expect(navigateMock).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('updates an existing supplier and maps API validation errors to the form', async () => {
    apiMock.states.mockResolvedValue({ data: [] })
    apiMock.show.mockResolvedValue({ data: {
      id: 9, type: 'individual', name: 'Ana', cpf: '52998224725', active: true,
      primary_contact: { phones: [{ value: '11987654321', label: 'Celular' }], emails: [] },
      additional_contacts: [],
    } })
    apiMock.update.mockRejectedValue({ data: { errors: {
      cpf: ['CPF já cadastrado.'],
      street: ['Informe o logradouro.'],
    } } })

    const wrapper = await mountSuspended(SupplierForm, { props: { supplierId: 9 }, global: { stubs } })
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(apiMock.update).toHaveBeenCalledWith(9, expect.objectContaining({ name: 'Ana' }))
    expect(wrapper.text()).toContain('Revise os campos destacados.')
    expect(setFormErrors).toHaveBeenCalledWith(expect.arrayContaining([
      { name: 'cpf', message: 'CPF já cadastrado.' },
      { name: 'street', message: 'Informe o logradouro.' },
    ]))
    expect(navigateMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('rejects an invalid CNPJ before making the lookup request', async () => {
    const wrapper = await mountForm()
    const cnpj = wrapper.find('input[placeholder="00.000.000/0000-00"]')
    await cnpj.setValue('11')
    await cnpj.trigger('blur')

    expect(apiMock.lookupCnpj).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Informe um CNPJ válido para consultar.')
    wrapper.unmount()
  })

  it('shows CNPJ lookup errors and clears the loading state', async () => {
    apiMock.lookupCnpj.mockRejectedValue({ data: { errors: { cnpj: ['CNPJ não encontrado.'] } } })
    const wrapper = await mountForm()
    const cnpj = wrapper.find('input[placeholder="00.000.000/0000-00"]')
    await cnpj.setValue('11222333000181')
    await cnpj.trigger('blur')
    await flushPromises()

    expect(wrapper.text()).toContain('CNPJ não encontrado.')
    expect(wrapper.find('input[placeholder="00.000.000/0000-00"]').attributes('loading')).toBe('false')
    wrapper.unmount()
  })

  it('fills company data and address details from the CNPJ lookup', async () => {
    apiMock.states.mockResolvedValue({ data: [{ id: 35, code: 'SP', name: 'São Paulo' }] })
    apiMock.lookupCnpj.mockResolvedValue({ data: {
      corporate_name: 'Empresa consultada',
      trade_name: 'Fantasia',
      cnpj_status: 'Ativa',
      state: 'SP',
      city: 'Campinas',
    } })
    apiMock.cities.mockResolvedValue({ data: [{ id: 350, name: 'Campinas' }] })
    const wrapper = await mountForm()

    const cnpj = wrapper.find('input[placeholder="00.000.000/0000-00"]')
    await cnpj.setValue('11222333000181')
    await cnpj.trigger('blur')
    await flushPromises()

    expect(apiMock.lookupCnpj).toHaveBeenCalledWith('11222333000181')
    expect(wrapper.findAll('input').some(input => (input.element as HTMLInputElement).value === 'Empresa consultada')).toBe(true)
    expect(wrapper.findAll('input').some(input => (input.element as HTMLInputElement).value === 'Ativa')).toBe(true)
    expect(apiMock.cities).toHaveBeenCalledWith(35)

    wrapper.unmount()
  })

  it('fills address fields and resolves city after CEP lookup', async () => {
    apiMock.states.mockResolvedValue({ data: [{ id: 35, code: 'SP', name: 'São Paulo' }] })
    apiMock.cities.mockResolvedValue({ data: [{ id: 350, name: 'Campinas' }] })
    fetchMock.mockResolvedValue({
      logradouro: 'Rua preenchida pelo CEP',
      complemento: 'Sala 2',
      bairro: 'Centro',
      localidade: 'Campinas',
      uf: 'SP',
    })
    const wrapper = await mountForm()

    const postalCode = wrapper.find('input[placeholder="00000-000"]')
    await postalCode.setValue('13000000')
    await postalCode.trigger('blur')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('https://viacep.com.br/ws/13000000/json/')
    expect(apiMock.cities).toHaveBeenCalledWith(35)
    expect(clearFormFieldErrors).toHaveBeenCalledWith('city_id')
    const addressField = wrapper.findAll('label').find(label => label.text().includes('Logradouro'))
    expect((addressField?.find('input').element as HTMLInputElement).value).toBe('Rua preenchida pelo CEP')
    const cityField = wrapper.findAll('label').find(label => label.text().includes('Cidade'))
    expect((cityField?.find('select').element as HTMLSelectElement).value).toBe('350')

    wrapper.unmount()
  })

  it('reports invalid, missing, and unavailable CEP lookups', async () => {
    const wrapper = await mountForm()
    const postalCode = wrapper.find('input[placeholder="00000-000"]')

    await postalCode.setValue('123')
    await postalCode.trigger('blur')
    expect(wrapper.text()).toContain('Informe um CEP com 8 dígitos.')
    expect(fetchMock).not.toHaveBeenCalled()

    await postalCode.setValue('01001000')
    fetchMock.mockResolvedValueOnce({ erro: true })
    await postalCode.trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('CEP não encontrado.')

    fetchMock.mockRejectedValueOnce(new Error('network'))
    await postalCode.trigger('blur')
    await flushPromises()
    expect(wrapper.text()).toContain('Não foi possível consultar o CEP.')
    wrapper.unmount()
  })

  it('loads cities when the state changes and reports a city service error', async () => {
    apiMock.states.mockResolvedValue({ data: [{ id: 35, code: 'SP', name: 'São Paulo' }] })
    apiMock.cities.mockRejectedValueOnce(new Error('API offline'))
    const wrapper = await mountForm()
    const stateField = wrapper.findAll('label').find(label => label.text().includes('UF'))
    await stateField?.find('select').setValue('35')
    await flushPromises()

    expect(apiMock.cities).toHaveBeenCalledWith(35)
    expect(wrapper.text()).toContain('Não foi possível carregar as cidades desta UF.')
    wrapper.unmount()
  })

  it('allows managing primary contact methods and additional contact removal', async () => {
    const wrapper = await mountForm()
    const addPhone = wrapper.findAll('button').find(button => button.text() === 'Adicionar telefone')
    const addEmail = wrapper.findAll('button').find(button => button.text() === 'Adicionar e-mail')
    await addPhone?.trigger('click')
    await addEmail?.trigger('click')
    expect(wrapper.findAll('input[placeholder="(00) 00000-0000"]')).toHaveLength(2)

    const addContact = wrapper.findAll('button').find(button => button.text().includes('Adicionar contato'))
    await addContact?.trigger('click')
    const removeContact = wrapper.findAll('button').find(button => button.text() === 'Remover')
    await removeContact?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Não há contatos adicionais.')
    wrapper.unmount()
  })

  it('collapses and expands input cards', async () => {
    const wrapper = await mountForm()
    const collapseButton = wrapper.find('button[aria-label="Recolher dados do fornecedor"]')
    await collapseButton.trigger('click')
    expect(wrapper.find('input[placeholder="00.000.000/0000-00"]').exists()).toBe(false)
    await wrapper.find('button[aria-label="Expandir dados do fornecedor"]').trigger('click')
    expect(wrapper.find('input[placeholder="00.000.000/0000-00"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('hydrates an existing individual supplier with masked document and contact data', async () => {
    apiMock.states.mockResolvedValue({ data: [{ id: 35, code: 'SP', name: 'São Paulo' }] })
    apiMock.cities.mockResolvedValue({ data: [{ id: 350, name: 'Campinas' }] })
    apiMock.show.mockResolvedValue({ data: {
      id: 42,
      type: 'individual',
      name: 'Joana Silva',
      nickname: 'Jô',
      cpf: '52998224725',
      rg: '1234567',
      corporate_name: null,
      trade_name: null,
      cnpj: null,
      cnpj_status: null,
      state_registration_indicator: null,
      state_registration: null,
      municipal_registration: null,
      tax_regime: null,
      active: true,
      postal_code: '13000000',
      street: 'Rua Central',
      number: '10',
      complement: null,
      district: 'Centro',
      reference: null,
      state_id: 35,
      city_id: 350,
      state: 'SP',
      city: 'Campinas',
      condominium: false,
      observation: null,
      primary_contact: { phones: [{ value: '1932345678', label: 'Comercial' }], emails: [] },
      additional_contacts: [],
    } })
    const wrapper = await mountSuspended(SupplierForm, { props: { supplierId: 42 }, global: { stubs } })
    await flushPromises()

    expect(apiMock.show).toHaveBeenCalledWith(42)
    expect(wrapper.find('input[placeholder="000.000.000-00"]').element).toHaveProperty('value', '529.982.247-25')
    expect(wrapper.find('input[placeholder="00000-000"]').element).toHaveProperty('value', '13000-000')
    expect(wrapper.find('input[placeholder="(00) 00000-0000"]').element).toHaveProperty('value', '(19) 3234-5678')

    wrapper.unmount()
  })
})
