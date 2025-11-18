export const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED !== 'false'

export const FALLBACK_USER_EMAIL =
  process.env.NEXT_PUBLIC_AUTH_FALLBACK_EMAIL || 'demo@kira.local'

export const FALLBACK_USER_NAME =
  process.env.NEXT_PUBLIC_AUTH_FALLBACK_NAME || 'Demo User'
