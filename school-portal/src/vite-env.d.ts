/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BG_REMOVAL_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
