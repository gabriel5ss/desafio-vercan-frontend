import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useAuth } from '../../app/composables/useAuth'

const { fetchMock, navigateMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  navigateMock: vi.fn(),
}))
mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('navigateTo', () => navigateMock)

const authHarness = defineComponent({
  setup() {
    return { auth: useAuth() }
  },
  render: () => h('div'),
})

describe('authentication composable', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchMock.mockReset()
    navigateMock.mockReset()
  })

  it('stores the access token and user after a successful login', async () => {
    const user = { id: 7, name: 'Gabriel', email: 'gabriel@example.com' }
    fetchMock.mockResolvedValue({ data: { token: 'access-token', user } })
    const wrapper = await mountSuspended(authHarness)
    wrapper.vm.auth.token.value = null
    wrapper.vm.auth.user.value = null

    await wrapper.vm.auth.login(user.email, 'secret')

    expect(fetchMock).toHaveBeenCalledWith('/api/login', expect.objectContaining({
      method: 'POST',
      body: { email: user.email, password: 'secret' },
    }))
    expect(wrapper.vm.auth.token.value).toBe('access-token')
    expect(wrapper.vm.auth.user.value).toEqual(user)
    expect(localStorage.getItem('auth-token')).toBe('access-token')
    wrapper.unmount()
  })

  it('restores a saved token and clears session data on logout', async () => {
    localStorage.setItem('auth-token', 'saved-token')
    fetchMock.mockResolvedValue(undefined)
    const wrapper = await mountSuspended(authHarness)
    wrapper.vm.auth.token.value = null
    wrapper.vm.auth.user.value = null

    wrapper.vm.auth.restore()
    expect(wrapper.vm.auth.token.value).toBe('saved-token')

    await wrapper.vm.auth.logout()

    expect(fetchMock).toHaveBeenCalledWith('/api/logout', expect.objectContaining({
      method: 'POST',
      headers: { Authorization: 'Bearer saved-token' },
    }))
    expect(wrapper.vm.auth.token.value).toBeNull()
    expect(wrapper.vm.auth.user.value).toBeNull()
    expect(localStorage.getItem('auth-token')).toBeNull()
    expect(navigateMock).toHaveBeenCalledWith('/')
    wrapper.unmount()
  })

  it('clears local session even if no token was issued', async () => {
    localStorage.setItem('auth-token', 'stale-token')
    const wrapper = await mountSuspended(authHarness)
    wrapper.vm.auth.token.value = null

    await wrapper.vm.auth.logout()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('auth-token')).toBeNull()
    expect(navigateMock).toHaveBeenCalledWith('/')
    wrapper.unmount()
  })
})
