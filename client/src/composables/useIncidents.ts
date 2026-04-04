import { ref } from 'vue'
import type { Incident } from '@/types/graph'
import { fetchIncidents } from '@/services/graphClient'

/**
 * Composable for fetching and managing security incidents state.
 */
export function useIncidents() {
  const incidents = ref<Incident[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function refresh() {
    loading.value   = true
    error.value     = null
    try {
      const response  = await fetchIncidents()
      incidents.value = response.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch incidents'
    } finally {
      loading.value = false
    }
  }

  return { incidents, loading, error, refresh }
}
