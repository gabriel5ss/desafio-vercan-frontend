<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { getServerFormErrors, validateForgotPasswordForm, type ForgotPasswordFormState } from '~/utils/auth-validation'

const config = useRuntimeConfig()
const state = reactive({ email: '' })
const message = ref('')
const error = ref('')
const loading = ref(false)
const confirmationLink = computed(() => ({ path: '/redefinir-senha', query: { email: state.email } }))
const formRef = useTemplateRef<{ setErrors: (errors: FormError[]) => void }>('forgotPasswordForm')

function validate(form: ForgotPasswordFormState): FormError[] {
  return validateForgotPasswordForm(form)
}

async function submit() {
  message.value = ''
  error.value = ''
  loading.value = true
  try {
    const result = await $fetch<{ message: string }>('/api/forgot-password', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email: state.email },
    })
    message.value = result.message
  } catch (requestError) {
    const errors = getServerFormErrors(requestError)
    if (errors.length) {
      formRef.value?.setErrors(errors)
      error.value = 'Revise os campos destacados.'
    } else {
      error.value = 'Não foi possível solicitar a redefinição. Verifique o e-mail.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-muted px-5 py-12 text-default">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-xl font-semibold">Redefinir senha</h1>
        <p class="mt-2 text-sm text-muted">Informe seu e-mail para receber as instruções de redefinição.</p>
      </template>

      <UForm ref="forgotPasswordForm" :state="state" :validate="validate" class="space-y-5" @submit="submit">
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

        <UAlert
          v-if="message"
          color="success"
          variant="subtle"
          :description="message"
          icon="i-lucide-circle-check"
          role="status"
        />
        <NuxtLink
          v-if="message"
          :to="confirmationLink"
          class="block text-sm font-medium text-primary hover:underline"
        >
          Informar código e criar nova senha
        </NuxtLink>
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :description="error"
          icon="i-lucide-circle-alert"
          role="alert"
        />

        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="text-sm font-medium text-primary hover:underline">
            Voltar ao login
          </NuxtLink>
          <UButton type="submit" :loading="loading">
            Enviar
          </UButton>
        </div>
      </UForm>
    </UCard>
  </main>
</template>
