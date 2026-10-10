import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../../app/pages/index.vue'

const { loginMock, navigateMock, token } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  navigateMock: vi.fn(),
  token: { value: null as string | null },
}))
mockNuxtImport('useAuth', () => () => ({ token, login: loginMock }))
mockNuxtImport('navigateTo', () => navigateMock)

describe('login page', () => {
  beforeEach(() => {
    loginMock.mockReset()
    navigateMock.mockReset()
    token.value = null
    localStorage.clear()
  })

  it('shows credential fields and password recovery link', async () => {
    const wrapper = await mountSuspended(LoginPage)

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Esqueceu sua senha?')
    expect(wrapper.text()).toContain('Entrar')
  })

  it('logs in and redirects to the dashboard', async () => {
    loginMock.mockResolvedValue(undefined)
    const wrapper = await mountSuspended(LoginPage)
    const inputs = wrapper.findAll('input')
    await inputs[0]?.setValue('gabriel@example.com')
    await inputs[1]?.setValue('secret')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(loginMock).toHaveBeenCalledWith('gabriel@example.com', 'secret')
    expect(navigateMock).toHaveBeenCalledWith('/dashboard')

    wrapper.unmount()
  })

  it('shows an error when login is rejected', async () => {
    loginMock.mockRejectedValue(new Error('Invalid credentials'))
    const wrapper = await mountSuspended(LoginPage)
    const inputs = wrapper.findAll('input')
    await inputs[0]?.setValue('gabriel@example.com')
    await inputs[1]?.setValue('wrong-password')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível entrar. Confira seu e-mail e senha.')
    expect(navigateMock).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
