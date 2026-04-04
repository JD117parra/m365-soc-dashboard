<script setup lang="ts">
import type { AlertSeverity } from '@/types/graph'
import { cn } from '@/lib/utils'

interface Props {
  severity: AlertSeverity
}

defineProps<Props>()

const severityConfig: Record<AlertSeverity, { label: string; classes: string }> = {
  high:                 { label: 'High',          classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  medium:               { label: 'Medium',        classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low:                  { label: 'Low',           classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  informational:        { label: 'Info',          classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  unknownFutureValue:   { label: 'Unknown',       classes: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
}
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      severityConfig[severity]?.classes ?? severityConfig.unknownFutureValue.classes,
    )"
  >
    {{ severityConfig[severity]?.label ?? severity }}
  </span>
</template>
