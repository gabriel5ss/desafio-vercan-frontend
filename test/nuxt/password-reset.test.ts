import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPasswordPage from '../../app/pages/esqueci-senha.vue'
import ResetPasswordPage from '../../app/pages/redefinir-senha.vue'

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}))
mockNuxtImport('$fetch', () => fetchMock)

describe('password reset pages', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('sends the reset request and links to code confirmation', async () => {
    fetchMock.mockResolvedValue({ message: 'Se o e-mail estiver cadastrado, enviaremos um código.' })
    const wrapper = await mountSuspended(ForgotPasswordPage)
    await wrapper.get('input[type="email"]').setValue('gabriel@example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/forgot-password', expect.objectContaining({
      baseURL: expect.any(String),
      method: 'POST',
      body: { email: 'gabriel@example.com' },
    }))
    expect(wrapper.text()).toContain('Informar código e criar nova senha')
    expect(wrapper.find('a[href="/redefinir-senha?email=gabriel@example.com"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('submits the code and matching new password to the reset endpoint', async () => {
    fetchMock.mockResolvedValue({ message: 'Senha redefinida com sucesso.' })
    const wrapper = await mountSuspended(ResetPasswordPage)
    const inputs = wrapper.findAll('input')
    await inputs[0]?.setValue('gabriel@example.com')
    await inputs[1]?.setValue('012345')
    await inputs[2]?.setValue('nova-senha-segura')
    await inputs[3]?.setValue('nova-senha-segura')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/reset-password', expect.objectContaining({
      baseURL: expect.any(String),
      method: 'POST',
      body: {
        email: 'gabriel@example.com',
        code: '012345',
        password: 'nova-senha-segura',
        password_confirmation: 'nova-senha-segura',
      },
    }))
    expect(wrapper.text()).toContain('Senha redefinida com sucesso.')
    expect(wrapper.text()).toContain('Voltar ao login')
    wrapper.unmount()
  })

  it('shows an error when the code is invalid or expired', async () => {
    fetchMock.mockRejectedValue(new Error('Invalid code'))
    const wrapper = await mountSuspended(ResetPasswordPage)
    const inputs = wrapper.findAll('input')
    await inputs[0]?.setValue('gabriel@example.com')
    await inputs[1]?.setValue('123456')
    await inputs[2]?.setValue('nova-senha-segura')
    await inputs[3]?.setValue('nova-senha-segura')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível redefinir a senha. Verifique o código e tente novamente.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
