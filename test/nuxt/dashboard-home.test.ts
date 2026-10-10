import { defineComponent } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import DashboardHome from '../../app/pages/dashboard/index.vue'

const ButtonStub = defineComponent({
  props: ['ariaLabel'],
  emits: ['click'],
  template: '<button :aria-label="ariaLabel" @click="$emit(\'click\')"><slot /></button>',
})

const stubs = {
  UButton: ButtonStub,
  UAlert: defineComponent({
    props: ['description'],
    template: '<div role="status">{{ description }}<slot name="actions" /></div>',
  }),
  UCard: defineComponent({ template: '<article><header><slot name="header" /></header><slot /></article>' }),
}

describe('dashboard home page', () => {
  it('shows the notice, welcome panel, and localized current date', async () => {
    const wrapper = await mountSuspended(DashboardHome, { global: { stubs } })
    const today = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date())

    expect(wrapper.get('h1').text()).toBe('Dashboard')
    expect(wrapper.get('[role="status"]').text()).toContain('informações contidas neste sistema são apagadas diariamente')
    expect(wrapper.text()).toContain('Olá, bem-vindo ao Desafio')
    expect(wrapper.text()).toContain(`Hoje é ${today}`)
    wrapper.unmount()
  })

  it('dismisses the daily notice', async () => {
    const wrapper = await mountSuspended(DashboardHome, { global: { stubs } })

    await wrapper.get('[aria-label="Fechar aviso"]').trigger('click')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
