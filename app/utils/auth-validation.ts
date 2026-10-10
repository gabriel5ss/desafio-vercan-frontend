import type { FormError } from '@nuxt/ui'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginFormState = { email: string, password: string }
export type ForgotPasswordFormState = { email: string }
export type ResetPasswordFormState = {
  email: string
  code: string
  password: string
  password_confirmation: string
}

export function validateLoginForm(form: LoginFormState): FormError[] {
  const errors: FormError[] = []
  validateEmail(form.email, errors)
  if (!form.password.trim()) errors.push({ name: 'password', message: 'Informe a senha.' })
  return errors
}

export function validateForgotPasswordForm(form: ForgotPasswordFormState): FormError[] {
  const errors: FormError[] = []
  validateEmail(form.email, errors)
  return errors
}

export function validateResetPasswordForm(form: ResetPasswordFormState): FormError[] {
  const errors: FormError[] = []
  validateEmail(form.email, errors)

  if (!/^\d{6}$/.test(form.code)) errors.push({ name: 'code', message: 'Informe o código de 6 dígitos.' })
  if (form.password.length < 8) errors.push({ name: 'password', message: 'A senha deve ter ao menos 8 caracteres.' })
  if (!form.password_confirmation) errors.push({ name: 'password_confirmation', message: 'Confirme a nova senha.' })
  else if (form.password_confirmation !== form.password) errors.push({ name: 'password_confirmation', message: 'As senhas não conferem.' })

  return errors
}

export function getServerFormErrors(error: unknown): FormError[] {
  const response = error as { data?: { errors?: Record<string, string[]> } }
  const errors = response.data?.errors

  return errors
    ? Object.entries(errors).flatMap(([name, messages]) => messages.map(message => ({ name, message })))
    : []
}

function validateEmail(email: string, errors: FormError[]): void {
  if (!email.trim()) errors.push({ name: 'email', message: 'Informe o e-mail.' })
  else if (!emailPattern.test(email)) errors.push({ name: 'email', message: 'Informe um e-mail válido.' })
}
