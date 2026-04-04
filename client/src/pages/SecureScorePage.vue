<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { RefreshCw } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { useSecureScore } from '@/composables/useSecureScore'
import { formatDateTime } from '@/lib/utils'

const { latestScore, scorePercent, loading, error, refresh } = useSecureScore()

// Doughnut chart: current score vs remaining
const doughnutData = computed(() => ({
  labels: ['Score', 'Remaining'],
  datasets: [{
    data: [
      latestScore.value?.currentScore ?? 0,
      latestScore.value ? latestScore.value.maxScore - latestScore.value.currentScore : 100,
    ],
    backgroundColor: ['#3b82f6', '#e2e8f0'],
    borderWidth: 0,
    hoverOffset: 4,
  }],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; raw: unknown }) => ` ${ctx.label}: ${ctx.raw}`,
      },
    },
  },
}

// Sort control scores by contribution (descending).
const sortedControls = computed(() =>
  [...(latestScore.value?.controlScores ?? [])].sort((a, b) => b.score - a.score)
)

// Average benchmark score for "All tenants" basis.
const allTenantsAvg = computed(() => {
  const entry = latestScore.value?.averageComparativeScores?.find(
    (s) => s.basis === 'AllTenants',
  )
  return entry ? Math.round(entry.averageScore) : null
})

onMounted(refresh)
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Secure Score</h1>
          <p class="text-sm text-muted-foreground">Microsoft Secure Score for your tenant</p>
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

      <!-- Score overview -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Gauge card -->
        <div class="rounded-lg border border-border bg-card p-6 shadow-sm flex flex-col items-center gap-4">
          <h2 class="self-start text-sm font-semibold text-foreground">Overall Score</h2>

          <div v-if="loading" class="h-48 w-48 animate-pulse rounded-full bg-muted" />
          <template v-else-if="latestScore">
            <div class="relative h-48 w-48">
              <Doughnut :data="doughnutData" :options="doughnutOptions" />
              <!-- Center label -->
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-bold text-foreground">{{ scorePercent }}%</span>
                <span class="text-xs text-muted-foreground">
                  {{ Math.round(latestScore.currentScore) }} / {{ latestScore.maxScore }}
                </span>
              </div>
            </div>

            <div class="w-full space-y-1 text-sm text-muted-foreground">
              <div class="flex justify-between">
                <span>Last updated</span>
                <span class="text-foreground">{{ formatDateTime(latestScore.createdDateTime) }}</span>
              </div>
              <div v-if="allTenantsAvg" class="flex justify-between">
                <span>All-tenants average</span>
                <span class="text-foreground">{{ allTenantsAvg }}%</span>
              </div>
            </div>
          </template>
          <p v-else class="text-muted-foreground text-sm">No Secure Score data available.</p>
        </div>

        <!-- Control scores -->
        <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-foreground">Control Scores</h2>

          <div v-if="loading" class="space-y-3">
            <div v-for="n in 6" :key="n" class="h-5 animate-pulse rounded bg-muted" />
          </div>

          <div v-else-if="sortedControls.length === 0" class="text-sm text-muted-foreground">
            No control scores available.
          </div>

          <ul v-else class="space-y-3 overflow-y-auto max-h-72 pr-1">
            <li
              v-for="control in sortedControls"
              :key="control.controlName"
              class="flex items-center gap-3"
            >
              <!-- Progress bar -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="truncate text-xs font-medium text-foreground">
                    {{ control.controlName }}
                  </span>
                  <span class="ml-2 shrink-0 text-xs text-muted-foreground">
                    {{ Math.round(control.score) }}
                  </span>
                </div>
                <div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    class="h-full rounded-full bg-primary transition-all"
                    :style="{ width: `${Math.min(100, control.score)}%` }"
                  />
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
