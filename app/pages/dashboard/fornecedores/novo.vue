<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-baseline gap-x-2">
      <h1 class="text-2xl font-medium tracking-tight text-highlighted">Fornecedor</h1>
      <p class="text-base font-light text-muted">Cadastrar</p>
    </div>
    <SupplierForm />
  </div>
</template>
