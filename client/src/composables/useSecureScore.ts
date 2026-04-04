import { ref, computed } from 'vue'
import type { SecureScore } from '@/types/graph'
import { fetchSecureScores } from '@/services/graphClient'

/**
 * Composable for fetching Secure Score data.
 * `latestScore` is the most recent entry; `scoreHistory` contains all returned entries.
 */
export function useSecureScore() {
  const scoreHistory = ref<SecureScore[]>([])
  const loading      = ref(false)
  const error        = ref<string | null>(null)

  // The Graph API returns scores ordered by createdDateTime desc, so index 0 is latest.
  const latestScore = computed<SecureScore | null>(() =>
    scoreHistory.value.length > 0 ? scoreHistory.value[0] : null
  )

  const scorePercent = computed<number>(() => {
    const s = latestScore.value
    if (!s || s.maxScore === 0) return 0
    return Math.round((s.currentScore / s.maxScore) * 100)
  })

  async function refresh() {
    loading.value = true
    error.value   = null
    try {
      const response    = await fetchSecureScores()
      scoreHistory.value = response.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch Secure Score'
    } finally {
      loading.value = false
    }
  }

  return { scoreHistory, latestScore, scorePercent, loading, error, refresh }
}
