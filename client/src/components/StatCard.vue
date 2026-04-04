<script setup lang="ts">
import type { Component } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  title:    string
  value:    string | number
  icon?:    Component
  /** Positive = up, negative = down, 0 = flat. */
  trend?:   number
  /** Controls the accent colour of the card border/icon. */
  variant?: 'default' | 'warning' | 'danger'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  loading: false,
})

const variantClasses: Record<string, string> = {
  default: 'border-border',
  warning: 'border-yellow-500/50',
  danger:  'border-destructive/50',
}

const iconColorClasses: Record<string, string> = {
  default: 'text-primary',
  warning: 'text-yellow-500',
  danger:  'text-destructive',
}
</script>

<template>
  <div
    :class="cn(
      'rounded-lg border bg-card p-5 shadow-sm transition-colors',
      variantClasses[variant],
    )"
  >
    <div class="flex items-start justify-between">
      <div class="space-y-1 min-w-0">
        <p class="text-sm font-medium text-muted-foreground truncate">{{ title }}</p>

        <!-- Loading skeleton -->
        <template v-if="loading">
          <div class="h-8 w-24 animate-pulse rounded bg-muted" />
        </template>
        <template v-else>
          <p class="text-3xl font-bold tracking-tight text-foreground">{{ value }}</p>
        </template>
      </div>

      <!-- Icon -->
      <div
        v-if="icon"
        :class="cn(
          'rounded-md p-2 bg-muted shrink-0',
          iconColorClasses[variant],
        )"
      >
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>

    <!-- Trend indicator -->
    <div v-if="trend !== undefined && !loading" class="mt-3 flex items-center gap-1 text-xs">
      <template v-if="trend > 0">
        <TrendingUp class="h-3.5 w-3.5 text-destructive" />
        <span class="text-destructive font-medium">+{{ trend }}%</span>
        <span class="text-muted-foreground">vs last period</span>
      </template>
      <template v-else-if="trend < 0">
        <TrendingDown class="h-3.5 w-3.5 text-emerald-500" />
        <span class="text-emerald-500 font-medium">{{ trend }}%</span>
        <span class="text-muted-foreground">vs last period</span>
      </template>
      <template v-else>
        <Minus class="h-3.5 w-3.5 text-muted-foreground" />
        <span class="text-muted-foreground">No change</span>
      </template>
    </div>
  </div>
</template>
