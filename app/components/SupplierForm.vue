<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'
import type { LocationCity, LocationState, Supplier } from '~/composables/useSuppliersApi'
import { maskPostalCode, maskCnpj, maskCpf, maskPhone } from '~/utils/supplier'
import { validateSupplierForm } from '~/utils/supplier-validation'

const props = defineProps<{ supplierId?: number }>()
const api = useSuppliersApi()
const loading = ref(false)
const loadingCnpj = ref(false)
const loadingPostalCode = ref(false)
const loadingCities = ref(false)
const collapsedCards = reactive({ supplier: false, primaryContact: false, additionalContacts: false, address: false, observation: false })
const stateOptions = ref<LocationState[]>([])
const cityOptions = ref<LocationCity[]>([])
const error = ref('')
const addressError = ref('')
const cnpjError = ref('')
const linkModalOpen = ref(false)
const observationLinkUrl = ref('')
const observationLinkEditor = shallowRef<Editor | null>(null)
const observationLinkRange = ref<{ from: number, to: number } | null>(null)
const formRef = useTemplateRef<{
  setErrors: (errors: FormError[]) => void
  clear: (name?: string) => void
}>('supplierForm')

type ContactMethod = { value: string, label: string }
type Contact = { name: string, company: string, position: string, phones: ContactMethod[], emails: ContactMethod[], collapsed?: boolean }
type SupplierFormState = {
  type: 'individual' | 'company'
  name: string
  nickname: string
  cpf: string
  rg: string
  corporate_name: string
  trade_name: string
  cnpj: string
  cnpj_status: string
  state_registration_indicator: string
  state_registration: string
  municipal_registration: string
  tax_regime: string
  active: boolean
  postal_code: string
  street: string
  number: string
  complement: string
  district: string
  reference: string
  state_id: number | null
  city_id: number | null
  condominium: boolean | null
  condominium_address: string
  condominium_number: string
  observation: Record<string, unknown>
  primary_contact: Pick<Contact, 'phones' | 'emails'>
  additional_contacts: Contact[]
}

const emptyMethod = (label = ''): ContactMethod => ({ value: '', label })
const state = reactive<SupplierFormState>({
  type: 'company',
  name: '', nickname: '', cpf: '', rg: '', corporate_name: '', trade_name: '', cnpj: '', cnpj_status: '',
  state_registration_indicator: '', state_registration: '', municipal_registration: '', tax_regime: '', active: true,
  postal_code: '', street: '', number: '', complement: '', district: '', reference: '', state_id: null, city_id: null,
  condominium: null,
  condominium_address: '', condominium_number: '',
  observation: { type: 'doc', content: [{ type: 'paragraph' }] },
  primary_contact: { phones: [emptyMethod()], emails: [emptyMethod()] },
  additional_contacts: [],
})

const phoneTypes = [
  { label: 'Celular', value: 'Celular' },
  { label: 'Residencial', value: 'Residencial' },
  { label: 'Comercial', value: 'Comercial' },
]
const emailTypes = [
  { label: 'Pessoal', value: 'Pessoal' },
  { label: 'Comercial', value: 'Comercial' },
  { label: 'Outro', value: 'Outro' },
]
function validate(form: SupplierFormState): FormError[] {
  return validateSupplierForm(form)
}

watch(() => state.state_registration_indicator, (indicator) => {
  if (!['contribuinte', 'isento'].includes(indicator)) state.state_registration = ''
})

function changeType(type: 'individual' | 'company') {
  state.type = type
  error.value = ''
  cnpjError.value = ''
}

function addMethod(methods: ContactMethod[]) {
  methods.push(emptyMethod())
}

function addAdditionalContact() {
  collapsedCards.additionalContacts = false
  state.additional_contacts.push({ name: '', company: '', position: '', phones: [emptyMethod()], emails: [emptyMethod('Comercial')] })
}

function errorMessage(responseError: unknown): string {
  const apiError = responseError as { data?: { errors?: Record<string, string[]> }, message?: string }
  const errors = apiError.data?.errors
  if (errors) {
    if (errors.cnpj?.length) cnpjError.value = errors.cnpj[0] || ''
    formRef.value?.setErrors(Object.entries(errors)
      .filter(([name]) => name !== 'cnpj')
      .flatMap(([name, messages]) => messages.map(message => ({ name, message }))))
  }
  return errors ? 'Revise os campos destacados.' : 'Não foi possível salvar o fornecedor. Tente novamente.'
}

async function submit(_event: FormSubmitEvent<SupplierFormState>) {
  loading.value = true
  error.value = ''
  cnpjError.value = ''
  try {
    const payload = {
      ...state,
      primary_contact: { ...state.primary_contact, emails: state.primary_contact.emails.filter(method => method.value.trim()) },
      additional_contacts: state.additional_contacts.map(({ collapsed: _collapsed, ...contact }) => ({ ...contact, phones: contact.phones.filter(method => method.value.trim()), emails: contact.emails.filter(method => method.value.trim()) })),
    }
    if (props.supplierId) {
      await api.update(props.supplierId, payload)
    } else {
      await api.create(payload)
    }
    await navigateTo('/dashboard/fornecedores')
  } catch (requestError) {
    error.value = errorMessage(requestError)
  } finally {
    loading.value = false
  }
}

function fillAddress(values: Partial<Supplier>) {
  for (const key of ['postal_code', 'street', 'number', 'complement', 'district'] as const) {
    const value = values[key]
    if (value && !state[key]) {
      if (key === 'postal_code') state.postal_code = maskPostalCode(value)
      else state[key] = value
    }
  }
}

async function selectState(stateId: number | null) {
  state.state_id = stateId
  state.city_id = null
  cityOptions.value = []
  if (!stateId) return

  loadingCities.value = true
  try {
    const response = await api.cities(stateId)
    cityOptions.value = response.data
  } catch {
    error.value = 'Não foi possível carregar as cidades desta UF.'
  } finally {
    loadingCities.value = false
  }
}

async function selectLocation(stateCode?: string | null, cityName?: string | null) {
  if (!stateCode || !cityName) return
  const selectedState = stateOptions.value.find(option => option.code === stateCode.toUpperCase())
  if (!selectedState) return

  await selectState(selectedState.id)
  const normalizedCity = cityName.trim().toLocaleLowerCase('pt-BR')
  const selectedCity = cityOptions.value.find(option => option.name.toLocaleLowerCase('pt-BR') === normalizedCity)
  state.city_id = selectedCity?.id ?? null
  if (selectedCity) formRef.value?.clear('city_id')
}

function openObservationLinkModal(editor: Editor) {
  if (editor.isActive('link')) editor.chain().focus().extendMarkRange('link').run()
  observationLinkEditor.value = editor
  observationLinkRange.value = { from: editor.state.selection.from, to: editor.state.selection.to }
  observationLinkUrl.value = editor.getAttributes('link').href ?? ''
  linkModalOpen.value = true
}

function saveObservationLink() {
  const editor = observationLinkEditor.value
  const range = observationLinkRange.value
  if (!editor || !range) return

  const url = observationLinkUrl.value.trim()
  const chain = editor.chain().focus().setTextSelection(range)
  if (!url) {
    chain.unsetLink().run()
  } else if (range.from === range.to) {
    chain.insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }).run()
  } else {
    chain.setLink({ href: url }).run()
  }
  linkModalOpen.value = false
}

async function lookupCnpj() {
  const cnpj = digits(state.cnpj)
  cnpjError.value = ''
  if (!cnpj) return
  if (!isValidCnpj(cnpj)) {
    cnpjError.value = 'Informe um CNPJ válido para consultar.'
    return
  }

  loadingCnpj.value = true
  try {
    const result = await api.lookupCnpj(cnpj)
    state.corporate_name = result.data.corporate_name || state.corporate_name
    state.trade_name = result.data.trade_name || state.trade_name
    state.cnpj_status = result.data.cnpj_status || ''
    fillAddress(result.data)
    await selectLocation(result.data.state, result.data.city)
  } catch (requestError) {
    const response = requestError as { data?: { errors?: { cnpj?: string[] } } }
    cnpjError.value = response.data?.errors?.cnpj?.[0] || 'Não foi possível consultar o CNPJ agora. Tente novamente.'
  } finally {
    loadingCnpj.value = false
  }
}

async function lookupPostalCode() {
  const postalCode = digits(state.postal_code)
  addressError.value = ''
  if (!postalCode) return
  if (postalCode.length !== 8) {
    addressError.value = 'Informe um CEP com 8 dígitos.'
    return
  }

  loadingPostalCode.value = true
  try {
    const result = await $fetch<{ erro?: boolean, logradouro: string, complemento: string, bairro: string, localidade: string, uf: string }>(`https://viacep.com.br/ws/${postalCode}/json/`)
    if (result.erro) {
      addressError.value = 'CEP não encontrado.'
      return
    }
    state.street = result.logradouro || state.street
    state.complement = result.complemento || state.complement
    state.district = result.bairro || state.district
    await selectLocation(result.uf, result.localidade)
  } catch {
    addressError.value = 'Não foi possível consultar o CEP.'
  } finally {
    loadingPostalCode.value = false
  }
}

async function loadSupplier(supplier: Supplier) {
  const { state: stateCode, city: cityName, state_id: supplierStateId, city_id: supplierCityId, ...supplierFields } = supplier
  Object.assign(state, supplierFields)
  state.cpf = supplier.cpf ? maskCpf(supplier.cpf) : ''
  state.cnpj = supplier.cnpj ? maskCnpj(supplier.cnpj) : ''
  if (!['withheld_by_recipient', 'payable_by_provider'].includes(state.tax_regime)) state.tax_regime = ''
  state.postal_code = maskPostalCode(supplier.postal_code)
  state.primary_contact = supplier.primary_contact || { phones: [emptyMethod()], emails: [emptyMethod()] }
  if (!state.primary_contact.emails.length) state.primary_contact.emails = [emptyMethod()]
  state.primary_contact.phones = state.primary_contact.phones.map(method => ({ ...method, value: maskPhone(method.value) }))
  state.additional_contacts = supplier.additional_contacts || []
  state.additional_contacts.forEach((contact) => {
    contact.phones = contact.phones.length ? contact.phones.map(method => ({ ...method, value: maskPhone(method.value) })) : [emptyMethod()]
    contact.emails = contact.emails.length ? contact.emails : [emptyMethod('Comercial')]
  })

  const selectedStateId = supplierStateId ?? stateOptions.value.find(option => option.code === stateCode)?.id ?? null
  state.state_id = null
  await selectState(selectedStateId)
  state.city_id = supplierCityId ?? cityOptions.value.find(option => option.name === cityName)?.id ?? null
}

onMounted(async () => {
  loading.value = true
  try {
    const states = await api.states()
    stateOptions.value = states.data

    if (props.supplierId) {
      const result = await api.show(props.supplierId)
      await loadSupplier(result.data)
    }
  } catch {
    error.value = props.supplierId ? 'Não foi possível carregar o fornecedor.' : 'Não foi possível carregar a lista de UFs.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UForm ref="supplierForm" :state="state" :validate="validate" class="space-y-5" @submit="submit">
    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="error" role="alert" />

    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Dados do Fornecedor</h2>
          <UButton :icon="collapsedCards.supplier ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" :aria-label="collapsedCards.supplier ? 'Expandir dados do fornecedor' : 'Recolher dados do fornecedor'" color="neutral" variant="ghost" size="sm" @click="collapsedCards.supplier = !collapsedCards.supplier" />
        </div>
      </template>
      <Transition name="card-collapse">
      <div v-if="!collapsedCards.supplier" class="space-y-5">
        <URadioGroup
          :model-value="state.type"
          :items="[{ label: 'Pessoa Jurídica', value: 'company' }, { label: 'Pessoa Física', value: 'individual' }]"
          orientation="horizontal"
          @update:model-value="changeType"
        />

        <div v-if="state.type === 'company'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <UFormField label="CNPJ" name="cnpj" required>
            <UInput :model-value="state.cnpj" placeholder="00.000.000/0000-00" class="w-full" :loading="loadingCnpj" @update:model-value="state.cnpj = maskCnpj($event || '')" @blur="lookupCnpj" />
            <p v-if="cnpjError" class="mt-1 text-sm text-error">{{ cnpjError }}</p>
          </UFormField>
          <UFormField label="Razão Social" name="corporate_name" required class="md:col-span-1 xl:col-span-2">
            <UInput v-model="state.corporate_name" class="w-full" />
          </UFormField>
          <UFormField label="Nome Fantasia" name="trade_name" required>
            <UInput v-model="state.trade_name" class="w-full" />
          </UFormField>
          <UFormField label="Indicador de Inscrição Estadual" name="state_registration_indicator" required>
            <USelect v-model="state.state_registration_indicator" :items="[{ label: 'Contribuinte', value: 'contribuinte' }, { label: 'Isento', value: 'isento' }, { label: 'Não contribuinte', value: 'nao_contribuinte' }]" placeholder="Selecione" class="w-full" />
          </UFormField>
          <UFormField label="Inscrição Estadual" name="state_registration">
            <UInput v-model="state.state_registration" class="w-full" :disabled="!(['contribuinte', 'isento'].includes(state.state_registration_indicator))" />
          </UFormField>
          <UFormField label="Inscrição Municipal" name="municipal_registration">
            <UInput v-model="state.municipal_registration" class="w-full" />
          </UFormField>
          <UFormField label="Situação CNPJ" name="cnpj_status">
            <UInput v-model="state.cnpj_status" disabled class="w-full" />
          </UFormField>
          <UFormField label="Recolhimento" name="tax_regime" required>
            <USelect v-model="state.tax_regime" :items="[{ label: 'Retido pelo tomador', value: 'withheld_by_recipient' }, { label: 'A recolher pelo prestador', value: 'payable_by_provider' }]" placeholder="Selecione" class="w-full" />
          </UFormField>
          <UFormField label="Ativo" name="active">
            <USelect v-model="state.active" :items="[{ label: 'Sim', value: true }, { label: 'Não', value: false }]" class="w-full" />
          </UFormField>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-3">
          <UFormField label="CPF" name="cpf" required>
            <UInput :model-value="state.cpf" placeholder="000.000.000-00" class="w-full" @update:model-value="state.cpf = maskCpf($event || '')" />
          </UFormField>
          <UFormField label="Nome" name="name" required>
            <UInput v-model="state.name" class="w-full" />
          </UFormField>
          <UFormField label="Apelido" name="nickname">
            <UInput v-model="state.nickname" class="w-full" />
          </UFormField>
          <UFormField label="RG" name="rg" required>
            <UInput v-model="state.rg" class="w-full" />
          </UFormField>
          <UFormField label="Ativo" name="active">
            <USelect v-model="state.active" :items="[{ label: 'Sim', value: true }, { label: 'Não', value: false }]" class="w-full" />
          </UFormField>
        </div>
      </div>
      </Transition>
    </UCard>

    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Contato Principal</h2>
          <UButton :icon="collapsedCards.primaryContact ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" :aria-label="collapsedCards.primaryContact ? 'Expandir contato principal' : 'Recolher contato principal'" color="neutral" variant="ghost" size="sm" @click="collapsedCards.primaryContact = !collapsedCards.primaryContact" />
        </div>
      </template>
      <Transition name="card-collapse">
      <div v-if="!collapsedCards.primaryContact" class="grid gap-6 xl:grid-cols-2">
        <div class="space-y-3">
          <div v-for="(phone, index) in state.primary_contact.phones" :key="`primary-phone-${index}`" class="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
            <UFormField label="Telefone" :name="`primary_contact.phones.${index}.value`" required>
              <UInput :model-value="phone.value" type="tel" maxlength="15" placeholder="(00) 00000-0000" class="w-full" @update:model-value="phone.value = maskPhone($event || '')" />
            </UFormField>
            <UFormField label="Tipo" :name="`primary_contact.phones.${index}.label`" required>
              <USelect v-model="phone.label" :items="phoneTypes" placeholder="Selecione" class="w-full" />
            </UFormField>
            <UButton v-if="state.primary_contact.phones.length > 1" icon="i-lucide-trash-2" aria-label="Remover telefone" color="error" variant="ghost" class="self-end" @click="state.primary_contact.phones.splice(index, 1)" />
          </div>
          <UButton label="Adicionar telefone" icon="i-lucide-plus" size="sm" color="neutral" variant="link" @click="addMethod(state.primary_contact.phones)" />
        </div>

        <div class="space-y-3">
          <div v-for="(email, index) in state.primary_contact.emails" :key="`primary-email-${index}`" class="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
            <UFormField label="E-mail" :name="`primary_contact.emails.${index}.value`">
              <UInput v-model="email.value" type="email" placeholder="contato@empresa.com" class="w-full" @blur="email.value = email.value.trim().toLowerCase()" />
            </UFormField>
            <UFormField label="Tipo" :name="`primary_contact.emails.${index}.label`">
              <USelect v-model="email.label" :items="emailTypes" placeholder="Selecione" class="w-full" />
            </UFormField>
            <UButton v-if="state.primary_contact.emails.length > 1" icon="i-lucide-trash-2" aria-label="Remover e-mail" color="error" variant="ghost" class="self-end" @click="state.primary_contact.emails.splice(index, 1)" />
          </div>
          <UButton label="Adicionar e-mail" icon="i-lucide-plus" size="sm" color="neutral" variant="link" @click="addMethod(state.primary_contact.emails)" />
        </div>
      </div>
      </Transition>
    </UCard>

    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Contatos Adicionais</h2>
          <div class="flex items-center gap-1">
            <UButton label="Adicionar contato" icon="i-lucide-plus" size="sm" color="neutral" variant="outline" @click="addAdditionalContact" />
            <UButton :icon="collapsedCards.additionalContacts ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" :aria-label="collapsedCards.additionalContacts ? 'Expandir contatos adicionais' : 'Recolher contatos adicionais'" color="neutral" variant="ghost" size="sm" @click="collapsedCards.additionalContacts = !collapsedCards.additionalContacts" />
          </div>
        </div>
      </template>
      <Transition name="card-collapse">
      <div v-if="!collapsedCards.additionalContacts">
      <p v-if="!state.additional_contacts.length" class="py-2 text-center text-sm text-muted">Não há contatos adicionais.</p>
      <div v-else class="space-y-4">
        <UCard v-for="(contact, index) in state.additional_contacts" :key="`additional-${index}`" variant="subtle" class="shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-medium">Contato {{ index + 1 }}</h3>
              <div class="flex items-center gap-1">
                <UButton :icon="contact.collapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" :aria-label="contact.collapsed ? `Expandir contato ${index + 1}` : `Recolher contato ${index + 1}`" color="neutral" variant="ghost" size="sm" @click="contact.collapsed = !contact.collapsed" />
                <UButton label="Remover" icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" @click="state.additional_contacts.splice(index, 1)" />
              </div>
            </div>
          </template>
          <Transition name="card-collapse">
          <div v-if="!contact.collapsed">
          <div class="grid gap-4 md:grid-cols-3">
            <UFormField label="Nome" :name="`additional_contacts.${index}.name`" required><UInput v-model="contact.name" class="w-full" /></UFormField>
            <UFormField label="Empresa"><UInput v-model="contact.company" class="w-full" /></UFormField>
            <UFormField label="Cargo"><UInput v-model="contact.position" class="w-full" /></UFormField>
          </div>
          <div class="mt-5 grid gap-6 xl:grid-cols-2">
            <div class="space-y-3">
              <div v-for="(phone, phoneIndex) in contact.phones" :key="`extra-phone-${index}-${phoneIndex}`" class="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
                <UFormField label="Telefone" :name="`additional_contacts.${index}.phones.${phoneIndex}.value`"><UInput :model-value="phone.value" type="tel" maxlength="15" placeholder="(00) 00000-0000" class="w-full" @update:model-value="phone.value = maskPhone($event || '')" /></UFormField>
                <UFormField label="Tipo" :required="!!phone.value.trim()"><USelect v-model="phone.label" :items="phoneTypes" placeholder="Selecione" class="w-full" /></UFormField>
                <UButton icon="i-lucide-trash-2" aria-label="Remover telefone" color="error" variant="ghost" class="self-end" @click="contact.phones.splice(phoneIndex, 1)" />
              </div>
              <UButton label="Adicionar telefone" icon="i-lucide-plus" size="sm" color="neutral" variant="link" @click="addMethod(contact.phones)" />
            </div>
            <div class="space-y-3">
              <div v-for="(email, emailIndex) in contact.emails" :key="`extra-email-${index}-${emailIndex}`" class="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
                <UFormField label="E-mail" :name="`additional_contacts.${index}.emails.${emailIndex}.value`"><UInput v-model="email.value" type="email" class="w-full" @blur="email.value = email.value.trim().toLowerCase()" /></UFormField>
                <UFormField label="Tipo"><USelect v-model="email.label" :items="emailTypes" placeholder="Selecione" class="w-full" /></UFormField>
                <UButton icon="i-lucide-trash-2" aria-label="Remover e-mail" color="error" variant="ghost" class="self-end" @click="contact.emails.splice(emailIndex, 1)" />
              </div>
              <UButton label="Adicionar e-mail" icon="i-lucide-plus" size="sm" color="neutral" variant="link" @click="addMethod(contact.emails)" />
            </div>
          </div>
          </div>
          </Transition>
        </UCard>
      </div>
      </div>
      </Transition>
    </UCard>

    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Dados de Endereço</h2>
          <UButton :icon="collapsedCards.address ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" :aria-label="collapsedCards.address ? 'Expandir dados de endereço' : 'Recolher dados de endereço'" color="neutral" variant="ghost" size="sm" @click="collapsedCards.address = !collapsedCards.address" />
        </div>
      </template>
      <Transition name="card-collapse">
      <div v-if="!collapsedCards.address" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UFormField label="CEP" name="postal_code" required>
          <UInput :model-value="state.postal_code" placeholder="00000-000" class="w-full" :loading="loadingPostalCode" @update:model-value="state.postal_code = maskPostalCode($event || '')" @blur="lookupPostalCode" />
          <p v-if="addressError" class="mt-1 text-sm text-error">{{ addressError }}</p>
        </UFormField>
        <UFormField label="Logradouro" name="street" required><UInput v-model="state.street" class="w-full" /></UFormField>
        <UFormField label="Número" name="number" required><UInput v-model="state.number" class="w-full" /></UFormField>
        <UFormField label="Complemento" name="complement"><UInput v-model="state.complement" class="w-full" /></UFormField>
        <UFormField label="Bairro" name="district" required><UInput v-model="state.district" class="w-full" /></UFormField>
        <UFormField label="Ponto de Referência" name="reference"><UInput v-model="state.reference" class="w-full" /></UFormField>
        <UFormField label="UF" name="state_id" required><USelect :model-value="state.state_id" :items="stateOptions.map(option => ({ label: option.code, value: option.id }))" placeholder="Selecione" class="w-full" @update:model-value="selectState($event ? Number($event) : null)" /></UFormField>
        <UFormField label="Cidade" name="city_id" required><USelect v-model="state.city_id" :items="cityOptions.map(option => ({ label: option.name, value: option.id }))" placeholder="Selecione" class="w-full" :disabled="!state.state_id || loadingCities" :loading="loadingCities" /></UFormField>
        <UFormField label="Condomínio?" name="condominium" required><USelect v-model="state.condominium" :items="[{ label: 'Sim', value: true }, { label: 'Não', value: false }]" placeholder="Selecione" class="w-full" /></UFormField>
        <UFormField v-if="state.condominium" label="Endereço" name="condominium_address" required><UInput v-model="state.condominium_address" class="w-full" /></UFormField>
        <UFormField v-if="state.condominium" label="Número" name="condominium_number" required><UInput v-model="state.condominium_number" class="w-full" /></UFormField>
      </div>
      </Transition>
    </UCard>

    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Observação</h2>
          <UButton :icon="collapsedCards.observation ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" :aria-label="collapsedCards.observation ? 'Expandir observação' : 'Recolher observação'" color="neutral" variant="ghost" size="sm" @click="collapsedCards.observation = !collapsedCards.observation" />
        </div>
      </template>
      <Transition name="card-collapse">
      <UEditor v-if="!collapsedCards.observation" v-slot="{ editor }" v-model="state.observation" content-type="json" placeholder="Escreva uma observação" :ui="{ base: 'min-h-48 cursor-text' }" class="min-h-60 rounded-md border border-default bg-default p-4">
        <div role="toolbar" aria-label="Formatação da observação" class="mb-3 flex flex-wrap items-center gap-1 rounded-md border border-default bg-elevated p-1">
          <UButton icon="i-lucide-bold" aria-label="Negrito" title="Negrito" color="neutral" active-color="primary" variant="ghost" active-variant="soft" size="sm" :active="editor.isActive('bold')" @mousedown.prevent @click="editor.chain().focus().toggleBold().run()" />
          <UButton icon="i-lucide-italic" aria-label="Itálico" title="Itálico" color="neutral" active-color="primary" variant="ghost" active-variant="soft" size="sm" :active="editor.isActive('italic')" @mousedown.prevent @click="editor.chain().focus().toggleItalic().run()" />
          <UButton icon="i-lucide-underline" aria-label="Sublinhado" title="Sublinhado" color="neutral" active-color="primary" variant="ghost" active-variant="soft" size="sm" :active="editor.isActive('underline')" @mousedown.prevent @click="editor.chain().focus().toggleUnderline().run()" />
          <UButton icon="i-lucide-link" aria-label="Inserir link" title="Inserir link" color="neutral" active-color="primary" variant="ghost" active-variant="soft" size="sm" :active="editor.isActive('link')" @mousedown.prevent @click="openObservationLinkModal(editor)" />
          <span aria-hidden="true" class="mx-1 h-6 w-px bg-border" />
          <UButton icon="i-lucide-list" aria-label="Lista com marcadores" title="Lista com marcadores" color="neutral" variant="ghost" size="sm" :active="editor.isActive('bulletList')" @mousedown.prevent @click="editor.chain().focus().toggleBulletList().run()" />
          <UButton icon="i-lucide-list-ordered" aria-label="Lista numerada" title="Lista numerada" color="neutral" variant="ghost" size="sm" :active="editor.isActive('orderedList')" @mousedown.prevent @click="editor.chain().focus().toggleOrderedList().run()" />
          <UButton icon="i-lucide-outdent" aria-label="Diminuir recuo" title="Diminuir recuo" color="neutral" variant="ghost" size="sm" :disabled="!editor.isActive('listItem')" @mousedown.prevent @click="editor.chain().focus().liftListItem('listItem').run()" />
          <UButton icon="i-lucide-indent" aria-label="Aumentar recuo" title="Aumentar recuo" color="neutral" variant="ghost" size="sm" :disabled="!editor.isActive('listItem')" @mousedown.prevent @click="editor.chain().focus().sinkListItem('listItem').run()" />
          <span aria-hidden="true" class="mx-1 h-6 w-px bg-border" />
          <UButton icon="i-lucide-undo-2" aria-label="Desfazer" title="Desfazer" color="neutral" variant="ghost" size="sm" :disabled="!editor.can().undo()" @mousedown.prevent @click="editor.chain().focus().undo().run()" />
        </div>
      </UEditor>
      </Transition>
    </UCard>

    <div class="flex justify-end gap-3">
      <UButton label="Voltar" color="neutral" variant="outline" to="/dashboard/fornecedores" />
      <UButton type="submit" :label="supplierId ? 'Salvar alterações' : 'Cadastrar'" icon="i-lucide-check" :loading="loading" />
    </div>
  </UForm>

  <UModal v-model:open="linkModalOpen" title="Inserir link" description="Informe o endereço para aplicar ao texto selecionado.">
    <template #body>
      <UFormField label="URL" name="observation_link_url">
        <UInput v-model="observationLinkUrl" type="url" placeholder="https://exemplo.com" class="w-full" autofocus />
      </UFormField>
    </template>
    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton label="Aplicar link" icon="i-lucide-link" @click="saveObservationLink" />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.card-collapse-enter-active,
.card-collapse-leave-active {
  overflow: hidden;
  transition: max-height 240ms ease, opacity 180ms ease;
}

.card-collapse-enter-from,
.card-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.card-collapse-enter-to,
.card-collapse-leave-from {
  max-height: 2400px;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .card-collapse-enter-active,
  .card-collapse-leave-active {
    transition: none;
  }
}
</style>
