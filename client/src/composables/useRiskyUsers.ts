import { ref } from 'vue'
import type { RiskyUser } from '@/types/graph'
import { fetchRiskyUsers } from '@/services/graphClient'

/**
 * Composable for fetching and managing risky users state.
 */
export function useRiskyUsers() {
  const riskyUsers = ref<RiskyUser[]>([])
  const loading    = ref(false)
  const error      = ref<string | null>(null)

  async function refresh() {
    loading.value    = true
    error.value      = null
    try {
      const response   = await fetchRiskyUsers()
      riskyUsers.value = response.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch risky users'
    } finally {
      loading.value = false
    }
  }

  return { riskyUsers, loading, error, refresh }
}
