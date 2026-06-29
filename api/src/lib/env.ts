/**
 * Mirrors src/server/env.ts (the Astro project's dev-time copy). Kept as a
 * separate, self-contained module here because /api deploys as its own
 * Azure Functions app with its own package.json and build step — see the
 * top comment in unlock.ts for why the logic isn't imported cross-package.
 *
 * Production: set UNLOCK_PASSWORDS and UNLOCK_TOKEN_SECRET as Application
 * Settings on the Static Web App; Azure injects them into this Function
 * app's process.env automatically.
 */

export interface PasswordMap {
  [projectId: string]: string;
}

const DEV_FALLBACK_PASSWORDS: PasswordMap = {
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
