/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENTRA_CLIENT_ID: string
  readonly VITE_ENTRA_AUTHORITY: string
  readonly VITE_ENTRA_API_SCOPE: string
  readonly VITE_APP_URL: string
  readonly VITE_DEV_AUTH_ENABLED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
