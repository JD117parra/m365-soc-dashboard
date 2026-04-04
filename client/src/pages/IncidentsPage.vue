<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import { useIncidents } from '@/composables/useIncidents'
import { formatDateTime } from '@/lib/utils'

const { incidents, loading, error, refresh } = useIncidents()

// Track which incident rows are expanded to show related alerts.
const expanded = ref<Set<string>>(new Set())

function toggle(id: string) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

const statusColor: Record<string, string> = {
  active:     'text-red-500',
  inProgress: 'text-yellow-500',
  resolved:   'text-emerald-500',
  redirected: 'text-blue-500',
}

onMounted(refresh)
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Incidents</h1>
          <p class="text-sm text-muted-foreground">{{ incidents.length }} incidents from Microsoft Graph</p>
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

      <div v-if="error" class="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
        {{ error }}
      </div>

      <div class="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-muted/50 text-left">
              <th class="w-8 px-4 py-3" />
              <th class="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th class="px-4 py-3 font-medium text-muted-foreground">Severity</th>
              <th class="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th class="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
              <th class="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading && incidents.length === 0">
              <tr v-for="n in 4" :key="n" class="border-b border-border last:border-0">
                <td v-for="col in 6" :key="col" class="px-4 py-3">
                  <div class="h-4 w-full max-w-[100px] animate-pulse rounded bg-muted" />
                </td>
              </tr>
            </template>

            <tr v-else-if="incidents.length === 0">
              <td colspan="6" class="px-4 py-10 text-center text-muted-foreground">No incidents found.</td>
            </tr>

            <template v-for="incident in incidents" :key="incident.id">
              <!-- Main row -->
              <tr
                class="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                @click="toggle(incident.id)"
              >
                <td class="px-4 py-3 text-muted-foreground">
                  <component
                    :is="expanded.has(incident.id) ? ChevronDown : ChevronRight"
                    class="h-4 w-4"
                  />
                </td>
                <td class="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                  {{ incident.displayName || incident.id }}
                </td>
                <td class="px-4 py-3">
                  <SeverityBadge :severity="incident.severity" />
                </td>
                <td class="px-4 py-3">
                  <span :class="['capitalize font-medium text-xs', statusColor[incident.status] ?? 'text-muted-foreground']">
                    {{ incident.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-muted-foreground hidden lg:table-cell">{{ incident.assignedTo || '—' }}</td>
                <td class="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                  {{ formatDateTime(incident.createdDateTime) }}
                </td>
              </tr>

              <!-- Expanded: related alerts -->
              <tr v-if="expanded.has(incident.id)" class="bg-muted/20">
                <td colspan="6" class="px-8 py-3">
                  <p class="text-xs font-semibold text-muted-foreground mb-2">Related Alerts</p>
                  <div v-if="!incident.alerts?.length" class="text-xs text-muted-foreground">
                    No related alerts returned by the API.
                  </div>
                  <ul v-else class="space-y-1">
                    <li
                      v-for="alert in incident.alerts"
                      :key="alert.id"
                      class="flex items-center gap-2 text-xs text-foreground"
                    >
                      <SeverityBadge :severity="alert.severity" />
                      {{ alert.displayName || alert.id }}
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>
