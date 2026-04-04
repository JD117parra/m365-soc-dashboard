import type {
  GraphListResponse,
  SecurityAlert,
  Incident,
  RiskyUser,
  SecureScore,
} from '@/types/graph'
import { msalInstance, graphScopes } from '@/lib/msalConfig'

/**
 * Acquires an MSAL access token silently. Falls back to an interactive popup
 * if the silent call fails (e.g. consent required, session expired).
 */
async function getToken(): Promise<string> {
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    throw new Error('No authenticated account found. Please sign in.')
  }

  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes:  graphScopes,
      account: accounts[0],
    })
    return result.accessToken
  } catch {
    // Silent acquisition failed — trigger interactive flow.
    const result = await msalInstance.acquireTokenPopup({ scopes: graphScopes })
    return result.accessToken
  }
}

/**
 * Performs an authenticated GET request against the Go backend proxy.
 * The Vite dev server proxies /api/* → http://localhost:8080/*.
 */
async function apiFetch<T>(path: string): Promise<T> {
  const token = await getToken()

  const response = await fetch(`/api${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${path} failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<T>
}

/** Fetches the latest security alerts from /security/alerts_v2. */
export async function fetchAlerts(): Promise<GraphListResponse<SecurityAlert>> {
  return apiFetch<GraphListResponse<SecurityAlert>>('/security/alerts')
}

/** Fetches security incidents. */
export async function fetchIncidents(): Promise<GraphListResponse<Incident>> {
  return apiFetch<GraphListResponse<Incident>>('/security/incidents')
}

/** Fetches risky users from Identity Protection. */
export async function fetchRiskyUsers(): Promise<GraphListResponse<RiskyUser>> {
  return apiFetch<GraphListResponse<RiskyUser>>('/identity/riskyUsers')
}

/** Fetches the Secure Score history. */
export async function fetchSecureScores(): Promise<GraphListResponse<SecureScore>> {
  return apiFetch<GraphListResponse<SecureScore>>('/security/secureScores')
}

/** Returns the raw MSAL access token for use with the WebSocket endpoint. */
export { getToken }
