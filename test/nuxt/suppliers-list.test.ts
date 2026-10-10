import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import SuppliersPage from '../../app/pages/dashboard/fornecedores/index.vue'

const { apiMock, supplierApiMock } = vi.hoisted(() => {
  const api = { list: vi.fn(), remove: vi.fn() }
  return { apiMock: api, supplierApiMock: vi.fn(() => api) }
})
mockNuxtImport('useSuppliersApi', () => supplierApiMock)

describe('suppliers list page', () => {
  it('shows the empty state when the API returns no suppliers', async () => {
    apiMock.list.mockResolvedValue({ data: [], meta: { total: 0 } })
    const wrapper = await mountSuspended(SuppliersPage)
    await flushPromises()

    expect(apiMock.list).toHaveBeenCalledWith(expect.stringContaining('page=1'))
    expect(wrapper.text()).toContain('Sem dados no momento')
    expect(wrapper.text()).toContain('Mostrando 0 a 0 de 0 resultados')

    wrapper.unmount()
  })

  it('shows a loading indicator until the supplier request completes', async () => {
    let finishRequest!: (response: { data: [], meta: { total: number } }) => void
    apiMock.list.mockReturnValue(new Promise((resolve) => {
      finishRequest = resolve
    }))
    const wrapper = await mountSuspended(SuppliersPage)
    await nextTick()

    expect(wrapper.get('[role="status"]').text()).toContain('Carregando fornecedores')

    finishRequest({ data: [], meta: { total: 0 } })
    await flushPromises()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sem dados no momento')
    wrapper.unmount()
  })

  it('requests server-side sorting from sortable headers but not the actions column', async () => {
    apiMock.list.mockResolvedValue({ data: [], meta: { total: 0 } })
    const wrapper = await mountSuspended(SuppliersPage)
    await flushPromises()

    const nameHeader = wrapper.findAll('button').find(button => button.text().includes('Razão Social/Nome'))
    expect(nameHeader).toBeDefined()
    await nameHeader!.trigger('click')
    await flushPromises()

    const firstSortedRequest = apiMock.list.mock.calls.at(-1)?.[0] as string
    const firstSortedQuery = new URLSearchParams(firstSortedRequest.replace(/^\?/, ''))
    expect(firstSortedQuery.get('sort_by')).toBe('name')
    expect(firstSortedQuery.get('sort_direction')).toBe('asc')
    expect(wrapper.findAll('th').find(header => header.text().includes('Ação'))?.find('button').exists()).toBe(false)

    await nameHeader!.trigger('click')
    await flushPromises()
    const secondSortedRequest = apiMock.list.mock.calls.at(-1)?.[0] as string
    expect(new URLSearchParams(secondSortedRequest.replace(/^\?/, '')).get('sort_direction')).toBe('desc')

    wrapper.unmount()
  })

  it('formats company rows and links to the Portuguese edit route', async () => {
    apiMock.list.mockResolvedValue({
      data: [{
        id: 44,
        type: 'company',
        corporate_name: 'Vercan Tecnologia',
        trade_name: 'Vercan',
        cnpj: '11222333000181',
        active: true,
      }],
      meta: { total: 1 },
    })
    const wrapper = await mountSuspended(SuppliersPage)
    await flushPromises()

    expect(wrapper.text()).toContain('Vercan Tecnologia')
    expect(wrapper.text()).toContain('11.222.333/0001-81')
    expect(wrapper.find('a[href="/dashboard/fornecedores/44"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/dashboard/fornecedores/novo"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('shows a readable error when loading suppliers fails', async () => {
    apiMock.list.mockRejectedValue(new Error('API offline'))
    const wrapper = await mountSuspended(SuppliersPage)
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível carregar os fornecedores.')

    wrapper.unmount()
  })
})
