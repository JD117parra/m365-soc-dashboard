// Microsoft Graph Security API — TypeScript interfaces
// Reference: https://learn.microsoft.com/en-us/graph/api/resources/security-api-overview

// ─────────────────────────────────────────────────────────────────────────────
// Shared / Generic
// ─────────────────────────────────────────────────────────────────────────────

/** Standard OData list response wrapper returned by Graph API list endpoints. */
export interface GraphListResponse<T> {
  '@odata.context': string
  '@odata.nextLink'?: string
  value: T[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Alerts v2
// ─────────────────────────────────────────────────────────────────────────────

export type AlertSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'informational'
  | 'unknownFutureValue'

export type AlertStatus =
  | 'new'
  | 'inProgress'
  | 'resolved'
  | 'unknownFutureValue'

export interface SecurityAlert {
  id: string
  displayName: string
  severity: AlertSeverity
  status: AlertStatus
  createdDateTime: string        // ISO 8601
  lastUpdateDateTime?: string
  assignedTo?: string
  category?: string
  providerAlertId?: string
  description?: string
  recommendedActions?: string
  tenantId?: string
  serviceSource?: string
  detectionSource?: string
  productName?: string
  /** Evidence items (files, IPs, users, etc.) attached to the alert. */
  evidence?: AlertEvidence[]
}

export interface AlertEvidence {
  '@odata.type': string
  createdDateTime?: string
  remediationStatus?: string
  verdict?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Incidents
// ─────────────────────────────────────────────────────────────────────────────

export type IncidentStatus =
  | 'active'
  | 'resolved'
  | 'inProgress'
  | 'redirected'
  | 'unknownFutureValue'

export interface Incident {
  id: string
  displayName: string
  severity: AlertSeverity
  status: IncidentStatus
  createdDateTime: string
  lastUpdateDateTime?: string
  assignedTo?: string
  classification?: string
  determination?: string
  tenantId?: string
  /** Alerts that are grouped into this incident. */
  alerts?: SecurityAlert[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Risky Users
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'hidden'
  | 'none'
  | 'unknownFutureValue'

export type RiskState =
  | 'none'
  | 'confirmedSafe'
  | 'remediated'
  | 'dismissed'
  | 'atRisk'
  | 'confirmedCompromised'
  | 'unknownFutureValue'

export interface RiskyUser {
  id: string
  userDisplayName: string
  userPrincipalName: string
  riskLevel: RiskLevel
  riskState: RiskState
  riskDetail?: string
  riskLastUpdatedDateTime: string
  isDeleted?: boolean
  isProcessing?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Secure Score
// ─────────────────────────────────────────────────────────────────────────────

export interface ControlScore {
  controlName: string
  score: number
  controlCategory?: string
  description?: string
}

export interface AverageComparativeScore {
  basis: string
  averageScore: number
}

export interface SecureScore {
  id: string
  createdDateTime: string
  currentScore: number
  maxScore: number
  enabledServices?: string[]
  licensedUserCount?: number
  activeUserCount?: number
  averageComparativeScores?: AverageComparativeScore[]
  controlScores?: ControlScore[]
}
