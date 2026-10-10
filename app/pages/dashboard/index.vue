<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const showNotice = ref(true)
const today = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
}).format(new Date())
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-wrap items-baseline gap-x-2">
      <h1 class="text-2xl font-medium tracking-tight text-highlighted">Dashboard</h1>
      <p class="text-base font-light text-muted">Painel de Controle</p>
    </div>

    <UAlert
      v-if="showNotice"
      color="warning"
      variant="solid"
      icon="i-lucide-megaphone"
      description="Esse sistema tem como objetivo demonstrar alguns dos meus conhecimentos técnicos. As informações contidas neste sistema são apagadas diariamente."
      class="italic"
      role="status"
    >
      <template #actions>
        <UButton
          icon="i-lucide-x"
          aria-label="Fechar aviso"
          color="warning"
          variant="ghost"
          size="xs"
          @click="showNotice = false"
        />
      </template>
    </UAlert>

    <UCard class="text-default">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-xl font-normal">Olá, bem-vindo ao Desafio</h2>
          <p class="text-sm text-muted">Hoje é {{ today }}</p>
        </div>
      </template>

      <div class="grid gap-6 text-sm leading-5 md:grid-cols-3 md:gap-8">
        <div>
          <h3 class="font-bold">Mais Informações</h3>
          <p>Portfólio: <a href="https://portfolio.gab.tec.br" target="_blank" class="text-blue-600 hover:underline">portfolio.gab.tec.br</a></p>
          <p>E-mail: gabriel.santos2350@proton.me</p>
        </div>
      </div>

      <p class="mt-5 text-sm">Este é um sistema de teste desenvolvido por Gabriel Santos.</p>
    </UCard>
  </div>
</template>
