<script setup lang="ts">
import { onMounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { useRiskyUsers } from '@/composables/useRiskyUsers'
import { formatDateTime } from '@/lib/utils'
import type { RiskLevel, RiskState } from '@/types/graph'

const { riskyUsers, loading, error, refresh } = useRiskyUsers()

const riskLevelBadge: Record<RiskLevel, string> = {
  high:               'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium:             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low:                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  hidden:             'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  none:               'bg-gray-100 text-gray-500',
  unknownFutureValue: 'bg-gray-100 text-gray-500',
}

const riskStateLabel: Record<RiskState, string> = {
  atRisk:                'At Risk',
  confirmedCompromised:  'Compromised',
  confirmedSafe:         'Safe',
  dismissed:             'Dismissed',
  none:                  'None',
  remediated:            'Remediated',
  unknownFutureValue:    'Unknown',
}

onMounted(refresh)
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Risky Users</h1>
          <p class="text-sm text-muted-foreground">
            {{ riskyUsers.length }} users flagged by Azure AD Identity Protection
          </p>
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
              <th class="px-4 py-3 font-medium text-muted-foreground">Display Name</th>
              <th class="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">UPN</th>
              <th class="px-4 py-3 font-medium text-muted-foreground">Risk Level</th>
              <th class="px-4 py-3 font-medium text-muted-foreground">Risk State</th>
              <th class="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading && riskyUsers.length === 0">
              <tr v-for="n in 5" :key="n" class="border-b border-border last:border-0">
                <td v-for="col in 5" :key="col" class="px-4 py-3">
                  <div class="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                </td>
              </tr>
            </template>

            <tr v-else-if="riskyUsers.length === 0">
              <td colspan="5" class="px-4 py-10 text-center text-muted-foreground">
                No risky users found.
              </td>
            </tr>

            <tr
              v-for="user in riskyUsers"
              :key="user.id"
              class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-3 font-medium text-foreground">{{ user.userDisplayName }}</td>
              <td class="px-4 py-3 text-muted-foreground hidden md:table-cell">{{ user.userPrincipalName }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', riskLevelBadge[user.riskLevel]]">
                  {{ user.riskLevel }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground text-xs">
                {{ riskStateLabel[user.riskState] ?? user.riskState }}
              </td>
              <td class="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                {{ formatDateTime(user.riskLastUpdatedDateTime) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>
