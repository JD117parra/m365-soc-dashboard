/** Represents the signed-in Microsoft 365 user. */
export interface AuthUser {
  /** Azure AD object ID of the account. */
  localAccountId: string
  /** User's UPN or email address. */
  username: string
  /** Display name (may be undefined for guest accounts). */
  name?: string
  /** Tenant ID the account belongs to. */
  tenantId: string
}
