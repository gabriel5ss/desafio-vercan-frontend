<script setup lang="ts">
const { token, user, restore, logout } = useAuth()
const collapsed = ref(false)
const config = useRuntimeConfig()
const route = useRoute()

onMounted(async () => {
  restore()
  if (token.value && !user.value) {
    try {
      const response = await $fetch<{ data: typeof user.value }>('/api/user', {
        baseURL: config.public.apiBase,
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = response.data
    } catch {
      await logout()
    }
  }
})
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      v-model:collapsed="collapsed"
      collapsible
      :ui="{
        root: 'bg-[#222D32] text-white border-none shadow-sm',
        content: 'bg-[#222D32] text-white divide-y divide-white/10 shadow-sm',
        header: 'h-16 justify-center bg-default text-default',
        body: 'gap-1 px-3 py-5',
        footer: 'h-[53px] shrink-0 border-t border-white/10 px-3 py-0',
      }"
    >
      <template #header="{ collapsed: isCollapsed }">
        <NuxtLink to="/dashboard" class="font-semibold tracking-wide text-default">
          {{ isCollapsed ? 'D' : 'Desafio' }}
        </NuxtLink>
      </template>

      <template #default="{ collapsed: isCollapsed }">
        <UButton
          to="/dashboard"
          icon="i-lucide-house"
          :label="isCollapsed ? undefined : 'Home'"
          color="neutral"
          variant="ghost"
          block
          :square="isCollapsed"
          :class="[
            isCollapsed ? 'justify-center px-3' : 'justify-start px-3',
            route.path === '/dashboard' ? 'bg-gray-600 text-white hover:bg-gray-700 hover:text-white' : 'text-gray-200 hover:bg-gray-600 hover:text-white',
          ]"
          :aria-current="route.path === '/dashboard' ? 'page' : undefined"
        />
        <UButton
          to="/dashboard/fornecedores"
          icon="i-lucide-building-2"
          :label="isCollapsed ? undefined : 'Fornecedores'"
          color="neutral"
          variant="ghost"
          block
          :square="isCollapsed"
          :class="[
            isCollapsed ? 'justify-center px-3' : 'justify-start px-3',
            route.path.startsWith('/dashboard/fornecedores') ? 'bg-gray-600 text-white hover:bg-gray-700 hover:text-white' : 'text-gray-200 hover:bg-gray-600 hover:text-white',
          ]"
          :aria-current="route.path.startsWith('/dashboard/fornecedores') ? 'page' : undefined"
        />
      </template>

      <template #footer="{ collapsed: isCollapsed }">
        <UButton
          icon="i-lucide-log-out"
          :label="isCollapsed ? undefined : 'Sair'"
          color="neutral"
          variant="ghost"
          block
          class="h-full"
          :square="isCollapsed"
          :class="[
            isCollapsed ? 'justify-center px-3' : 'justify-start px-3',
            'text-gray-200 hover:bg-gray-600 hover:text-white',
          ]"
          @click="logout"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel class="bg-gray-100">
      <template #header>
        <UDashboardNavbar title="Painel de Gestão" class="relative z-10 bg-default">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>

      <template #footer>
        <nav aria-label="Rodapé" class="w-full bg-white px-6 py-4 text-left text-sm text-muted">
          Dashboard · {{ new Date().getFullYear() }}
        </nav>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
