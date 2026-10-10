import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useSuppliersApi } from '../../app/composables/useSuppliersApi'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('$fetch', () => fetchMock)

const apiHarness = defineComponent({
  setup() {
    return { api: useSuppliersApi() }
  },
  render: () => h('div'),
})

describe('supplier API composable', () => {
  it('sends authenticated paginated supplier queries', async () => {
    fetchMock.mockResolvedValue({ data: [], meta: { total: 0 } })
    localStorage.setItem('auth-token', 'supplier-token')

    const wrapper = await mountSuspended(apiHarness)
    await wrapper.vm.api.list('?page=2&per_page=25&search=Acme')

    expect(fetchMock).toHaveBeenCalledWith('/api/suppliers?page=2&per_page=25&search=Acme', {
      baseURL: expect.any(String),
      headers: { Authorization: 'Bearer supplier-token' },
    })

    wrapper.unmount()
    localStorage.removeItem('auth-token')
    fetchMock.mockReset()
  })

  it('uses the expected methods and paths for supplier create, update and delete', async () => {
    fetchMock.mockResolvedValue({ data: {} })

    const wrapper = await mountSuspended(apiHarness)
    const payload = { type: 'individual', name: 'Joana' }

    await wrapper.vm.api.create(payload)
    await wrapper.vm.api.update(42, payload)
    await wrapper.vm.api.remove(42)

    expect(fetchMock.mock.calls.map(([path, options]) => [path, options?.method])).toEqual([
      ['/api/suppliers', 'POST'],
      ['/api/suppliers/42', 'PUT'],
      ['/api/suppliers/42', 'DELETE'],
    ])

    wrapper.unmount()
    fetchMock.mockReset()
  })

  it('loads locations, supplier details and CNPJ lookup endpoints', async () => {
    fetchMock.mockResolvedValue({ data: [] })

    const wrapper = await mountSuspended(apiHarness)
    await wrapper.vm.api.states()
    await wrapper.vm.api.cities(35)
    await wrapper.vm.api.show(42)
    await wrapper.vm.api.lookupCnpj('11222333000181')

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/locations/states',
      '/api/locations/states/35/cities',
      '/api/suppliers/42',
      '/api/suppliers/cnpj/11222333000181',
    ])

    wrapper.unmount()
    fetchMock.mockReset()
  })
})
