<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import { ShieldAlert, Siren, UserX, Star } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import StatCard from '@/components/StatCard.vue'
import { useAlerts } from '@/composables/useAlerts'
import { useIncidents } from '@/composables/useIncidents'
import { useRiskyUsers } from '@/composables/useRiskyUsers'
import { useSecureScore } from '@/composables/useSecureScore'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuth } from '@/composables/useAuth'
import type { SecurityAlert } from '@/types/graph'

const { alerts,      loading: alertsLoading,  refresh: refreshAlerts }      = useAlerts()
const { incidents,   loading: incidentsLoading                              } = useIncidents()
const { riskyUsers,  loading: riskyLoading,   refresh: refreshRiskyUsers }   = useRiskyUsers()
const { latestScore, scorePercent, scoreHistory, loading: scoreLoading, refresh: refreshScore } = useSecureScore()
const { getToken } = useAuth()

// Live updates via WebSocket — merge new alerts into the reactive list.
const { connected } = useWebSocket((newAlerts: SecurityAlert[]) => {
  alerts.value = newAlerts
})

const openIncidents = computed(() =>
  incidents.value.filter((i) => i.status === 'active' || i.status === 'inProgress').length
)

// ── Bar chart: alerts by severity ─────────────────────────────────────────
const alertsBySeverityChart = computed(() => {
  const counts = { high: 0, medium: 0, low: 0, informational: 0 }
  for (const a of alerts.value) {
    if (a.severity in counts) counts[a.severity as keyof typeof counts]++
  }
  return {
    labels: ['High', 'Medium', 'Low', 'Info'],
    datasets: [{
      label: 'Alerts',
      data: [counts.high, counts.medium, counts.low, counts.informational],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280'],
      borderRadius: 4,
    }],
  }
})

// ── Line chart: secure score trend ────────────────────────────────────────
const scoreTrendChart = computed(() => {
  const entries = [...scoreHistory.value].reverse().slice(0, 7)
  return {
    labels: entries.map((s) => new Date(s.createdDateTime).toLocaleDateString()),
    datasets: [{
      label: 'Secure Score',
      data: entries.map((s) => Math.round((s.currentScore / s.maxScore) * 100)),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      tension: 0.3,
      fill: true,
      pointRadius: 4,
    }],
  }
})

// ── Doughnut: risky users by risk level ───────────────────────────────────
const riskyUsersChart = computed(() => {
  const counts = { high: 0, medium: 0, low: 0 }
  for (const u of riskyUsers.value) {
    if (u.riskLevel in counts) counts[u.riskLevel as keyof typeof counts]++
  }
  return {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [counts.high, counts.medium, counts.low],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
      borderWidth: 0,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}

const lineOptions = {
  ...chartOptions,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    y: { min: 0, max: 100, ticks: { callback: (v: unknown) => `${v}%` } },
  },
}

onMounted(async () => {
  // Fetch all data in parallel.
  await Promise.allSettled([
    refreshAlerts(),
    useIncidents().refresh(),
    refreshRiskyUsers(),
    refreshScore(),
  ])

  // Connect WebSocket with the user's access token.
  try {
    const token = await getToken()
    useWebSocket((newAlerts) => { alerts.value = newAlerts }).connect(token)
  } catch {
    // WebSocket is optional; the dashboard still works without it.
  }
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p class="text-sm text-muted-foreground">
          Microsoft 365 security overview
          <span v-if="connected" class="ml-2 inline-flex items-center gap-1 text-emerald-500">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </p>
      </div>

      <!-- Stat cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Alerts"
          :value="alerts.length"
          :icon="ShieldAlert"
          :loading="alertsLoading"
          :variant="alerts.some((a) => a.severity === 'high') ? 'danger' : 'default'"
        />
        <StatCard
          title="Open Incidents"
          :value="openIncidents"
          :icon="Siren"
          :loading="incidentsLoading"
          :variant="openIncidents > 0 ? 'warning' : 'default'"
        />
        <StatCard
          title="Risky Users"
          :value="riskyUsers.length"
          :icon="UserX"
          :loading="riskyLoading"
          :variant="riskyUsers.length > 0 ? 'warning' : 'default'"
        />
        <StatCard
          title="Secure Score"
          :value="latestScore ? `${scorePercent}%` : '—'"
          :icon="Star"
          :loading="scoreLoading"
        />
      </div>

      <!-- Charts row -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Alerts by severity -->
        <div class="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-foreground">Alerts by Severity</h2>
          <div class="h-48">
            <Bar :data="alertsBySeverityChart" :options="chartOptions" />
          </div>
        </div>

        <!-- Secure Score trend -->
        <div class="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-foreground">Secure Score Trend</h2>
          <div class="h-48">
            <Line :data="scoreTrendChart" :options="lineOptions" />
          </div>
        </div>

        <!-- Risky users breakdown -->
        <div class="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold text-foreground">Risky Users</h2>
          <div class="h-48 flex items-center justify-center">
            <Doughnut :data="riskyUsersChart" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
