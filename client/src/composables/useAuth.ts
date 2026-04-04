import { ref, computed } from 'vue'
import type { AccountInfo } from '@azure/msal-browser'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance, graphScopes } from '@/lib/msalConfig'
import type { AuthUser } from '@/types/auth'

// Module-level reactive state shared across all composable calls.
const _account   = ref<AccountInfo | null>(null)
const _isLoading = ref(false)

function accountToUser(account: AccountInfo): AuthUser {
  return {
    localAccountId: account.localAccountId,
    username:       account.username,
    name:           account.name ?? undefined,
    tenantId:       account.tenantId,
  }
}

/**
 * Composable for MSAL authentication state and actions.
 * Uses the singleton msalInstance; state is shared application-wide.
 */
export function useAuth() {
  const isAuthenticated = computed(() => _account.value !== null)
  const user            = computed<AuthUser | null>(() =>
    _account.value ? accountToUser(_account.value) : null
  )

  /** Syncs the active account from MSAL into reactive state. */
  function syncAccount() {
    const accounts = msalInstance.getAllAccounts()
    _account.value = accounts.length > 0 ? accounts[0] : null
  }

  /** Initiates a full-page redirect to the Microsoft login page. */
  async function login() {
    await msalInstance.loginRedirect({ scopes: graphScopes })
  }

  /** Signs the user out and redirects to the Microsoft logout page. */
  async function logout() {
    if (!_account.value) return
    await msalInstance.logoutRedirect({ account: _account.value })
  }

  /**
   * Returns a valid access token for the Graph API.
   * Attempts silent acquisition first; falls back to an interactive popup
   * when interaction is required (e.g. MFA, consent, expired session).
   */
  async function getToken(): Promise<string> {
    const account = _account.value ?? msalInstance.getAllAccounts()[0]
    if (!account) throw new Error('No account — user must sign in first.')

    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes:  graphScopes,
        account,
      })
      return result.accessToken
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        const result = await msalInstance.acquireTokenPopup({ scopes: graphScopes })
        return result.accessToken
      }
      throw err
    }
  }

  return {
    isAuthenticated,
    user,
    isLoading: _isLoading,
    login,
    logout,
    getToken,
    syncAccount,
  }
}
