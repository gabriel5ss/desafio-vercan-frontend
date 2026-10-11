import { defineComponent } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardLayout from '../../app/layouts/dashboard.vue'

const { authState, authMock, routeMock, fetchMock } = vi.hoisted(() => {
  const state = {
    token: { value: null as string | null },
    user: { value: null as { name: string } | null },
    restore: vi.fn(),
    logout: vi.fn(),
  }
  return {
    authState: state,
    authMock: vi.fn(() => state),
    routeMock: vi.fn(() => ({ path: '/dashboard' })),
    fetchMock: vi.fn(),
  }
})

mockNuxtImport('useAuth', () => authMock)
mockNuxtImport('useRoute', () => routeMock)
mockNuxtImport('$fetch', () => fetchMock)

const ButtonStub = defineComponent({
  props: ['label', 'to', 'ariaLabel'],
  emits: ['click'],
  template: '<button :aria-label="ariaLabel" :data-to="to" @click="$emit(\'click\')"><slot />{{ label }}</button>',
})

const stubs = {
  UButton: ButtonStub,
  NuxtLink: defineComponent({ props: ['to'], template: '<a :href="to"><slot /></a>' }),
  UDashboardGroup: defineComponent({ template: '<div><slot /></div>' }),
  UDashboardSidebar: defineComponent({
    props: ['collapsed'],
    template: '<aside><header><slot name="header" :collapsed="collapsed" /></header><nav><slot :collapsed="collapsed" /></nav><footer><slot name="footer" :collapsed="collapsed" /></footer></aside>',
  }),
  UDashboardPanel: defineComponent({
    template: '<main><header><slot name="header" /></header><section><slot name="body" /></section><footer><slot name="footer" /></footer></main>',
  }),
  UDashboardNavbar: defineComponent({ props: ['title'], template: '<div><slot name="leading" />{{ title }}<slot /></div>' }),
  UDashboardSidebarCollapse: defineComponent({ template: '<button aria-label="Alternar menu" />' }),
}

async function mountLayout() {
  return mountSuspended(DashboardLayout, { global: { stubs } })
}

describe('dashboard layout', () => {
  beforeEach(() => {
    authState.token.value = null
    authState.user.value = null
    authState.restore.mockReset()
    authState.logout.mockReset()
    fetchMock.mockReset()
    routeMock.mockReturnValue({ path: '/dashboard' })
  })

  it('renders navigation, the collapse control, slot content, and the current-year footer', async () => {
    const wrapper = await mountLayout()

    expect(wrapper.text()).toContain('Desafio')
    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Fornecedores')
    expect(wrapper.text()).toContain('Painel de Gestão')
    expect(wrapper.text()).toContain('Sair')
    expect(wrapper.text()).toContain(`Dashboard · ${new Date().getFullYear()}`)
    expect(wrapper.find('[aria-label="Alternar menu"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('marks supplier navigation active inside supplier routes', async () => {
    routeMock.mockReturnValue({ path: '/dashboard/fornecedores/novo' })
    const wrapper = await mountLayout()
    const suppliersLink = wrapper.findAll('button').find(button => button.text() === 'Fornecedores')

    expect(suppliersLink?.attributes('aria-current')).toBe('page')
    expect(wrapper.findAll('button').find(button => button.text() === 'Home')?.attributes('aria-current')).toBeUndefined()
    wrapper.unmount()
  })

  it('restores authentication and fetches the current user when only a token exists', async () => {
    authState.token.value = 'stored-token'
    fetchMock.mockResolvedValue({ data: { name: 'Gabriel' } })
    const wrapper = await mountLayout()
    await flushPromises()

    expect(authState.restore).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith('/api/user', expect.objectContaining({
      baseURL: expect.stringMatching(/^https?:\/\//),
      headers: { Authorization: 'Bearer stored-token' },
    }))
    expect(authState.user.value).toEqual({ name: 'Gabriel' })
    wrapper.unmount()
  })

  it('logs out when restoring the current user fails and exposes the logout action', async () => {
    authState.token.value = 'expired-token'
    fetchMock.mockRejectedValue(new Error('Unauthorized'))
    const wrapper = await mountLayout()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text() === 'Sair')!.trigger('click')
    expect(authState.logout).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})
