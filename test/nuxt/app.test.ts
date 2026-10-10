import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from '../../app/app.vue'

describe('app root', () => {
  it('renders the root component containing the Nuxt application shell', () => {
    const wrapper = shallowMount(App)

    expect(wrapper.exists()).toBe(true)
    expect(App.render).toBeTypeOf('function')
    wrapper.unmount()
  })
})
