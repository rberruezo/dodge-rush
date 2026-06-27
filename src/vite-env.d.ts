/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** App version, injected from package.json at build time (see vite.config.ts). */
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
