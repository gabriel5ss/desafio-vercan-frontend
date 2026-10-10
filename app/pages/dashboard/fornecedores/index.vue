<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/vue-table'
import type { Supplier } from '~/composables/useSuppliersApi'
import { maskCnpj, maskCpf } from '~/utils/supplier'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

type SupplierRow = Supplier & {
  companyName: string
  tradeName: string
  document: string
}

const api = useSuppliersApi()
const search = ref('')
const pageSize = ref(10)
const page = ref(1)
const sorting = ref<SortingState>([])
const rows = ref<SupplierRow[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const deleteTarget = ref<SupplierRow | null>(null)
const deleting = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

const columns: TableColumn<SupplierRow>[] = [
  { accessorKey: 'companyName', id: 'name', header: 'Razão Social/Nome', enableSorting: true, sortDescFirst: false },
  { accessorKey: 'tradeName', id: 'trade_name', header: 'Nome Fantasia/Apelido', enableSorting: true, sortDescFirst: false },
  { accessorKey: 'document', id: 'document', header: 'CNPJ/CPF', enableSorting: true, sortDescFirst: false },
  { accessorKey: 'active', id: 'active', header: 'Ativo', enableSorting: true, sortDescFirst: false },
  { id: 'actions', header: 'Ação', enableSorting: false },
]

const firstResult = computed(() => total.value ? (page.value - 1) * pageSize.value + 1 : 0)
const lastResult = computed(() => Math.min(page.value * pageSize.value, total.value))

function sortIcon(column: { getIsSorted: () => false | 'asc' | 'desc' }): string {
  const direction = column.getIsSorted()
  if (direction === 'asc') return 'i-lucide-arrow-up'
  if (direction === 'desc') return 'i-lucide-arrow-down'
  return 'i-lucide-arrow-up-down'
}

async function loadSuppliers() {
  loading.value = true
  error.value = ''
  try {
    const query = new URLSearchParams({ page: String(page.value), per_page: String(pageSize.value), search: search.value.trim() })
    const sort = sorting.value[0]
    if (sort) {
      query.set('sort_by', sort.id)
      query.set('sort_direction', sort.desc ? 'desc' : 'asc')
    }
    const response = await api.list(`?${query}`)
    rows.value = response.data.map((supplier) => ({
      ...supplier,
      companyName: supplier.type === 'company' ? supplier.corporate_name || '' : supplier.name || '',
      tradeName: supplier.type === 'company' ? supplier.trade_name || '' : supplier.name || '',
      document: supplier.type === 'company' ? maskCnpj(supplier.cnpj || '') : maskCpf(supplier.cpf || ''),
    }))
    total.value = response.meta.total
  } catch {
    error.value = 'Não foi possível carregar os fornecedores.'
  } finally {
    loading.value = false
  }
}

watch(page, loadSuppliers)
watch(sorting, () => {
  if (page.value === 1) loadSuppliers()
  else page.value = 1
}, { deep: true })
watch(pageSize, () => {
  if (page.value === 1) loadSuppliers()
  else page.value = 1
})
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (page.value === 1) loadSuppliers()
    else page.value = 1
  }, 250)
})
onMounted(loadSuppliers)

async function removeSupplier() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.remove(deleteTarget.value.id)
    deleteTarget.value = null
    if (rows.value.length === 1 && page.value > 1) page.value--
    else await loadSuppliers()
  } catch {
    error.value = 'Não foi possível remover o fornecedor.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-baseline gap-x-2">
        <h1 class="text-2xl font-medium tracking-tight text-highlighted">Fornecedores</h1>
        <p class="text-base font-light text-muted">Painel de Controle</p>
      </div>
      <UButton label="Cadastrar" icon="i-lucide-plus" color="success" to="/dashboard/fornecedores/novo" />
    </div>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="error" />

    <UCard :ui="{ body: 'p-3 sm:p-3' }">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 text-sm text-default">
          <span>Mostrando</span>
          <USelect v-model="pageSize" :items="[{ label: '10', value: 10 }, { label: '25', value: 25 }, { label: '50', value: 50 }, { label: '100', value: 100 }]" aria-label="Resultados por página" size="sm" class="w-20" />
          <span>resultados</span>
        </div>
        <UFormField label="Filtro" name="search" orientation="horizontal">
          <UInput v-model="search" aria-label="Filtrar fornecedores" icon="i-lucide-search" size="sm" class="w-48 sm:w-56" />
        </UFormField>
      </div>

      <UTable v-model:sorting="sorting" :data="rows" :columns="columns" :loading="loading" :sorting-options="{ manualSorting: true }" class="w-full">
        <template #name-header="{ column }">
          <button type="button" class="flex items-center gap-1.5 font-semibold hover:text-primary" :aria-label="`Ordenar por razão social ou nome, ${column.getIsSorted() === 'asc' ? 'ordem crescente' : column.getIsSorted() === 'desc' ? 'ordem decrescente' : 'sem ordenação'}`" @click="column.toggleSorting()">
            Razão Social/Nome
            <UIcon :name="sortIcon(column)" aria-hidden="true" class="size-4 text-muted" />
          </button>
        </template>
        <template #trade_name-header="{ column }">
          <button type="button" class="flex items-center gap-1.5 font-semibold hover:text-primary" :aria-label="`Ordenar por nome fantasia ou apelido, ${column.getIsSorted() === 'asc' ? 'ordem crescente' : column.getIsSorted() === 'desc' ? 'ordem decrescente' : 'sem ordenação'}`" @click="column.toggleSorting()">
            Nome Fantasia/Apelido
            <UIcon :name="sortIcon(column)" aria-hidden="true" class="size-4 text-muted" />
          </button>
        </template>
        <template #document-header="{ column }">
          <button type="button" class="flex items-center gap-1.5 font-semibold hover:text-primary" :aria-label="`Ordenar por CNPJ ou CPF, ${column.getIsSorted() === 'asc' ? 'ordem crescente' : column.getIsSorted() === 'desc' ? 'ordem decrescente' : 'sem ordenação'}`" @click="column.toggleSorting()">
            CNPJ/CPF
            <UIcon :name="sortIcon(column)" aria-hidden="true" class="size-4 text-muted" />
          </button>
        </template>
        <template #active-header="{ column }">
          <button type="button" class="flex items-center gap-1.5 font-semibold hover:text-primary" :aria-label="`Ordenar por status ativo, ${column.getIsSorted() === 'asc' ? 'ordem crescente' : column.getIsSorted() === 'desc' ? 'ordem decrescente' : 'sem ordenação'}`" @click="column.toggleSorting()">
            Ativo
            <UIcon :name="sortIcon(column)" aria-hidden="true" class="size-4 text-muted" />
          </button>
        </template>
        <template #loading>
          <div role="status" aria-live="polite" class="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted">
            <span aria-hidden="true" class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            Carregando fornecedores…
          </div>
        </template>
        <template #active-cell="{ row }">
          <UBadge :label="row.original.active ? 'Sim' : 'Não'" :color="row.original.active ? 'success' : 'neutral'" variant="subtle" />
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-center gap-1">
            <UButton icon="i-lucide-pencil" aria-label="Editar fornecedor" color="neutral" variant="ghost" :to="`/dashboard/fornecedores/${row.original.id}`" />
            <UButton icon="i-lucide-trash-2" aria-label="Excluir fornecedor" color="error" variant="ghost" @click="deleteTarget = row.original" />
          </div>
        </template>
        <template #empty>
          <div class="px-3 py-3 text-center text-sm text-muted">{{ search ? 'Nenhum fornecedor encontrado.' : 'Sem dados no momento' }}</div>
        </template>
      </UTable>

      <div class="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm text-default">
        <p>Mostrando {{ firstResult }} a {{ lastResult }} de {{ total }} resultados</p>
        <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" />
      </div>
    </UCard>

    <UModal :open="Boolean(deleteTarget)" title="Excluir fornecedor" description="Esta ação não pode ser desfeita." @update:open="(open) => !open && (deleteTarget = null)">
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Cancelar" color="neutral" variant="outline" @click="deleteTarget = null" />
          <UButton label="Excluir" color="error" :loading="deleting" @click="removeSupplier" />
        </div>
      </template>
    </UModal>
  </div>
</template>
