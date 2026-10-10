<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { getServerFormErrors, validateLoginForm, type LoginFormState } from '~/utils/auth-validation'

const { token, login } = useAuth()
const state = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)
const formRef = useTemplateRef<{ setErrors: (errors: FormError[]) => void }>('loginForm')

function validate(form: LoginFormState): FormError[] {
  return validateLoginForm(form)
}

onMounted(() => {
  if (token.value || localStorage.getItem('auth-token')) {
    navigateTo('/dashboard')
  }
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await login(state.email, state.password)
    await navigateTo('/dashboard')
  } catch (requestError) {
    const errors = getServerFormErrors(requestError)
    if (errors.length) {
      const emailError = errors.find(fieldError => fieldError.name === 'email')
      if (emailError && state.email.trim() && state.password && !errors.some(fieldError => fieldError.name === 'password')) {
        errors.push({ name: 'password', message: emailError.message })
      }
      formRef.value?.setErrors(errors)
      error.value = 'Revise os campos destacados.'
    } else {
      error.value = 'Não foi possível entrar. Confira seu e-mail e senha.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-muted px-5 py-12 text-default">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-inverted">
          <UIcon name="i-lucide-layers-3" class="size-7" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight">Desafio</h1>
        <p class="mt-1 text-sm text-muted">Gestão de fornecedores</p>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Acesse sua conta</h2>
          <p class="mt-1 text-sm text-muted">Informe suas credenciais para continuar.</p>
        </template>

        <UForm ref="loginForm" :state="state" :validate="validate" class="space-y-5" @submit="submit">
          <UFormField label="E-mail" name="email" required>
            <UInput
              v-model="state.email"
              type="email"
              autocomplete="email"
              placeholder="voce@empresa.com"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-mail" class="size-4 text-muted" />
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Senha" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              autocomplete="current-password"
              placeholder="Sua senha"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-lock-keyhole" class="size-4 text-muted" />
              </template>
            </UInput>
          </UFormField>

          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            :description="error"
            icon="i-lucide-circle-alert"
            role="alert"
          />

          <div class="flex items-center justify-between pt-1">
            <NuxtLink to="/esqueci-senha" class="text-sm font-medium text-primary hover:underline">
              Esqueceu sua senha?
            </NuxtLink>
            <UButton type="submit" :loading="loading">
              Entrar
            </UButton>
          </div>
        </UForm>
      </UCard>

      <p class="mt-6 text-center text-xs text-muted">© {{ new Date().getFullYear() }} Desafio. Todos os direitos reservados.</p>
    </div>
  </main>
</template>
