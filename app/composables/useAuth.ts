type User = { id: number, name: string, email: string }

export function useAuth() {
  const config = useRuntimeConfig()
  const token = useState<string | null>('auth-token', () => null)
  const user = useState<User | null>('auth-user', () => null)

  function restore() {
    if (import.meta.client && !token.value) {
      token.value = localStorage.getItem('auth-token')
    }
  }

  async function login(email: string, password: string) {
    const result = await $fetch<{ data: { token: string, user: User } }>('/api/login', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email, password },
    })
    token.value = result.data.token
    user.value = result.data.user
    localStorage.setItem('auth-token', token.value)
  }

  async function logout() {
    if (token.value) {
      await $fetch('/api/logout', {
        baseURL: config.public.apiBase,
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
      })
    }
    token.value = null
    user.value = null
    localStorage.removeItem('auth-token')
    await navigateTo('/')
  }

  return { token, user, restore, login, logout }
}
