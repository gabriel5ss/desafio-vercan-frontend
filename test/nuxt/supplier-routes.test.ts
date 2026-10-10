import { defineComponent } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import SupplierCreatePage from '../../app/pages/dashboard/fornecedores/novo.vue'
import SupplierEditPage from '../../app/pages/dashboard/fornecedores/[id].vue'

const { routeMock } = vi.hoisted(() => ({ routeMock: vi.fn(() => ({ params: { id: '42' } })) }))
mockNuxtImport('useRoute', () => routeMock)

const stubs = {
  SupplierForm: defineComponent({
    props: ['supplierId'],
    template: '<div data-testid="supplier-form" :data-supplier-id="supplierId ?? \'new\'" />',
  }),
}

describe('supplier routes', () => {
  it('renders the create page with a blank supplier form', async () => {
    const wrapper = await mountSuspended(SupplierCreatePage, { global: { stubs } })

    expect(wrapper.get('h1').text()).toBe('Fornecedor')
    expect(wrapper.text()).toContain('Cadastrar')
    expect(wrapper.get('[data-testid="supplier-form"]').attributes('data-supplier-id')).toBe('new')
    wrapper.unmount()
  })

  it('converts the dynamic route parameter to a numeric supplier ID', async () => {
    const wrapper = await mountSuspended(SupplierEditPage, { route: '/dashboard/fornecedores/42', global: { stubs } })

    expect(wrapper.get('h1').text()).toBe('Fornecedor')
    expect(wrapper.text()).toContain('Editar')
    expect(wrapper.get('[data-testid="supplier-form"]').attributes('data-supplier-id')).toBe('42')
    wrapper.unmount()
  })
})
