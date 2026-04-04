import { ref } from 'vue'
import type { SecurityAlert } from '@/types/graph'
import { fetchAlerts } from '@/services/graphClient'

/**
 * Composable for fetching and managing security alerts state.
 */
export function useAlerts() {
  const alerts  = ref<SecurityAlert[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value   = null
    try {
      const response = await fetchAlerts()
      alerts.value   = response.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch alerts'
    } finally {
      loading.value = false
    }
  }

  return { alerts, loading, error, refresh }
}
