import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names, resolving conflicts via tailwind-merge.
 * This is the standard shadcn-vue utility used in all components.
 *
 * @example cn('px-4 py-2', condition && 'bg-red-500', 'px-6') → 'py-2 bg-red-500 px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats an ISO 8601 date string into a human-readable local date+time.
 * Returns '—' for null/undefined values.
 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

/**
 * Returns a relative time string (e.g. "3 hours ago") for an ISO 8601 date.
 * Falls back to formatDateTime for dates older than 7 days.
 */
export function relativeTime(iso?: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`

  return formatDateTime(iso)
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
