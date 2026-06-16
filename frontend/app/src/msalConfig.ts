import type { Configuration, RedirectRequest } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || 'missing-client-id',
    authority: import.meta.env.VITE_ENTRA_AUTHORITY || undefined,
    redirectUri: import.meta.env.VITE_APP_URL || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
}

export const loginRequest: RedirectRequest = {
  scopes: [import.meta.env.VITE_ENTRA_API_SCOPE || 'openid'],
}

export function isMsalConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_ENTRA_CLIENT_ID &&
      import.meta.env.VITE_ENTRA_AUTHORITY &&
      import.meta.env.VITE_ENTRA_API_SCOPE,
  )
}

export function isDevAuthEnabled(): boolean {
  return import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'
}
