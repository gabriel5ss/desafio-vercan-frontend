type ContactMethod = { value: string, label: string | null }
type SupplierContact = {
  name?: string | null
  company?: string | null
  position?: string | null
  phones: ContactMethod[]
  emails: ContactMethod[]
}

export type LocationState = { id: number, code: string, name: string }
export type LocationCity = { id: number, name: string }

export type Supplier = {
  id: number
  type: 'individual' | 'company'
  name: string | null
  cpf: string | null
  nickname: string | null
  rg: string | null
  corporate_name: string | null
  trade_name: string | null
  cnpj: string | null
  state_registration_indicator: string | null
  state_registration: string | null
  municipal_registration: string | null
  tax_regime: string | null
  cnpj_status: string | null
  active: boolean
  postal_code: string
  street: string
  number: string
  complement: string | null
  district: string
  reference: string | null
  state_id: number | null
  city_id: number | null
  state: string
  city: string
  condominium: boolean
  observation: Record<string, unknown> | null
  primary_contact: SupplierContact
  additional_contacts: SupplierContact[]
}

export function useSuppliersApi() {
  const config = useRuntimeConfig()
  const { token, restore } = useAuth()

  function request<T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) {
    restore()
    return $fetch<T>(path, {
      baseURL: config.public.apiBase,
      ...options,
      headers: {
        Authorization: `Bearer ${token.value}`,
        ...options.headers,
      },
    })
  }

  return {
    states: () => request<{ data: LocationState[] }>('/api/locations/states'),
    cities: (stateId: number) => request<{ data: LocationCity[] }>(`/api/locations/states/${stateId}/cities`),
    list: (query = '') => request<{ data: Supplier[], meta: { current_page: number, last_page: number, per_page: number, total: number } }>(`/api/suppliers${query}`),
    show: (id: number) => request<{ data: Supplier }>(`/api/suppliers/${id}`),
    create: (data: Record<string, unknown>) => request<{ data: Supplier }>('/api/suppliers', { method: 'POST', body: data }),
    update: (id: number, data: Record<string, unknown>) => request<{ data: Supplier }>(`/api/suppliers/${id}`, { method: 'PUT', body: data }),
    remove: (id: number) => request(`/api/suppliers/${id}`, { method: 'DELETE' }),
    lookupCnpj: (cnpj: string) => request<{ data: Partial<Supplier> }>(`/api/suppliers/cnpj/${cnpj}`),
  }
}
