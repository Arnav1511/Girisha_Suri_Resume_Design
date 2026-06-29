/**
 * Server-only configuration. Never imported from a .astro component's
 * frontmatter-to-client boundary or any client-side script — this module
 * touches process.env and must stay on the server side of the build.
 *
 * Production wiring (Azure Static Web Apps):
 *   - Set UNLOCK_PASSWORDS and UNLOCK_TOKEN_SECRET as Application Settings
 *     on the Static Web App (Azure Portal -> Configuration, or via
 *     `az staticwebapp appsettings set`). They are injected as process.env
 *     vars into the paired Azure Function app automatically.
 */

export interface PasswordMap {
  [projectId: string]: string;
}

const DEV_FALLBACK_PASSWORDS: PasswordMap = {
  // Phase 1 demo credential only. Real projects get their own password,
  // set per-project via the UNLOCK_PASSWORDS env var (JSON string), e.g.
  // UNLOCK_PASSWORDS={"overrun-bomber":"thread2024"}
  "overrun-bomber": "thread2024",
};

const DEV_FALLBACK_SECRET = "phase-1-dev-secret-not-for-production";

export function getPasswordMap(): PasswordMap {
  const raw = process.env.UNLOCK_PASSWORDS;
  if (!raw) return DEV_FALLBACK_PASSWORDS;
  try {
    return JSON.parse(raw) as PasswordMap;
  } catch {
    return DEV_FALLBACK_PASSWORDS;
  }
}

export function getTokenSecret(): string {
  return process.env.UNLOCK_TOKEN_SECRET ?? DEV_FALLBACK_SECRET;
}
