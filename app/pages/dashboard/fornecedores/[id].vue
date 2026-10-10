<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const route = useRoute()
const supplierId = computed(() => Number(route.params.id))
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-baseline gap-x-2">
      <h1 class="text-2xl font-medium tracking-tight text-highlighted">Fornecedor</h1>
      <p class="text-base font-light text-muted">Editar</p>
    </div>
    <SupplierForm :supplier-id="supplierId" />
  </div>
</template>
