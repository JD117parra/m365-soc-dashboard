<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, Search } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import { useAlerts } from '@/composables/useAlerts'
import { formatDateTime } from '@/lib/utils'

const { alerts, loading, error, refresh } = useAlerts()

const search    = ref('')
const pageSize  = 20
const page      = ref(1)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return alerts.value
  return alerts.value.filter(
    (a) =>
      a.displayName?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q) ||
      a.assignedTo?.toLowerCase().includes(q),
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))

const paginated = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

// Reset to page 1 when search changes.
function onSearch() { page.value = 1 }

onMounted(refresh)
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Security Alerts</h1>
          <p class="text-sm text-muted-foreground">{{ alerts.length }} alerts from Microsoft Graph</p>
        </div>
        <button
          :disabled="loading"
          class="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-60"
          @click="refresh"
        >
          <RefreshCw :class="['h-4 w-4', loading && 'animate-spin']" />
          Refresh
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
        {{ error }}
      </div>

      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="search"
          type="search"
          placeholder="Search by name, category, or assignee…"
          class="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          @input="onSearch"
        />
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-muted/50 text-left">
              <th class="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th class="px-4 py-3 font-medium text-muted-foreground">Severity</th>
              <th class="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th class="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
              <th class="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
              <th class="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading skeleton -->
            <template v-if="loading && alerts.length === 0">
              <tr v-for="n in 5" :key="n" class="border-b border-border last:border-0">
                <td v-for="col in 6" :key="col" class="px-4 py-3">
                  <div class="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="paginated.length === 0">
              <td colspan="6" class="px-4 py-10 text-center text-muted-foreground">
                {{ search ? 'No alerts match your search.' : 'No alerts found.' }}
              </td>
            </tr>

            <!-- Data rows -->
            <tr
              v-for="alert in paginated"
              :key="alert.id"
              class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                {{ alert.displayName || alert.id }}
              </td>
              <td class="px-4 py-3">
                <SeverityBadge :severity="alert.severity" />
              </td>
              <td class="px-4 py-3 capitalize text-muted-foreground">{{ alert.status }}</td>
              <td class="px-4 py-3 text-muted-foreground hidden md:table-cell">{{ alert.category || '—' }}</td>
              <td class="px-4 py-3 text-muted-foreground hidden lg:table-cell">{{ alert.assignedTo || '—' }}</td>
              <td class="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                {{ formatDateTime(alert.createdDateTime) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {{ page }} of {{ totalPages }}</span>
        <div class="flex gap-2">
          <button
            :disabled="page === 1"
            class="rounded-md border border-border px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-40"
            @click="page--"
          >
            Previous
          </button>
          <button
            :disabled="page === totalPages"
            class="rounded-md border border-border px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-40"
            @click="page++"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
