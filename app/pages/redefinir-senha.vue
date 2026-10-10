<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { getServerFormErrors, validateResetPasswordForm, type ResetPasswordFormState } from '~/utils/auth-validation'

const route = useRoute()
const config = useRuntimeConfig()
const state = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: '',
  password: '',
  password_confirmation: '',
})
const error = ref('')
const success = ref('')
const loading = ref(false)
const formRef = useTemplateRef<{ setErrors: (errors: FormError[]) => void }>('resetPasswordForm')

function validate(form: ResetPasswordFormState): FormError[] {
  return validateResetPasswordForm(form)
}

async function submit() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const result = await $fetch<{ message: string }>('/api/reset-password', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { ...state },
    })
    success.value = result.message
    state.code = ''
    state.password = ''
    state.password_confirmation = ''
  } catch (requestError) {
    const errors = getServerFormErrors(requestError)
    if (errors.length) {
      formRef.value?.setErrors(errors)
      error.value = 'Revise os campos destacados.'
    } else {
      error.value = 'Não foi possível redefinir a senha. Verifique o código e tente novamente.'
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
          <h2 class="text-lg font-semibold">Criar nova senha</h2>
          <p class="mt-1 text-sm text-muted">Informe o código recebido por e-mail e escolha uma nova senha. O código expira em 30 minutos.</p>
        </template>

        <UForm ref="resetPasswordForm" :state="state" :validate="validate" class="space-y-5" @submit="submit">
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

          <UFormField label="Código de confirmação" name="code" required>
            <UInput
              v-model="state.code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="Código de 6 dígitos"
              maxlength="6"
              pattern="[0-9]{6}"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-shield-check" class="size-4 text-muted" />
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Nova senha" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              autocomplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              minlength="8"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-lock-keyhole" class="size-4 text-muted" />
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Confirmar nova senha" name="password_confirmation" required>
            <UInput
              v-model="state.password_confirmation"
              type="password"
              autocomplete="new-password"
              placeholder="Repita a nova senha"
              minlength="8"
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
          <UAlert
            v-if="success"
            color="success"
            variant="subtle"
            :description="success"
            icon="i-lucide-circle-check"
            role="status"
          />

          <div class="flex items-center justify-between">
            <NuxtLink to="/esqueci-senha" class="text-sm font-medium text-primary hover:underline">
              Solicitar outro código
            </NuxtLink>
            <UButton v-if="!success" type="submit" :loading="loading">
              Redefinir senha
            </UButton>
            <UButton v-else to="/" color="success">
              Voltar ao login
            </UButton>
          </div>
        </UForm>
      </UCard>

      <p class="mt-6 text-center text-xs text-muted">© {{ new Date().getFullYear() }} Desafio. Todos os direitos reservados.</p>
    </div>
  </main>
</template>
