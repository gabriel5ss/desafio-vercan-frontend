export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) {
    return
  }

  const { token } = useAuth()
  if (!token.value) {
    token.value = localStorage.getItem('auth-token')
  }
  if (!token.value) {
    return navigateTo('/')
  }
})
