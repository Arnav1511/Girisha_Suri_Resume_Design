#!/usr/bin/env node
/**
 * Copies real protected images from /private/protected-images (gitignored,
 * never committed — this repo is public) into /public/images/protected,
 * renamed with a SHA-256 hash of "<password>:<projectId>".
 *
 * Run before `astro dev` and `astro build` (see package.json) so the
 * client-side gate in src/lib/clientGate.ts — which derives the same hash
 * from whatever the visitor typed — can find the file by guessing its name
 * correctly. Re-run this whenever UNLOCK_PASSWORDS changes; old hashed
 * filenames are left behind (delete public/images/protected manually if you
 * want to clean up an old password's file).
 *
 * Reads UNLOCK_PASSWORDS from the environment, falling back to a local
 * .env file (simple KEY=VALUE parsing, no dependency) for `npm run dev`.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PRIVATE_ROOT = path.join(ROOT, "private", "protected-images");
const PUBLIC_ROOT = path.join(ROOT, "public", "images", "protected");
// private/ is gitignored — a public-repo deploy (e.g. Render) never has it.
// Render Secret Files land at /etc/secrets/<filename>, so a real protected
// photo can reach the build that way instead: add a Secret File there named
// "<projectId>-hero-real.<ext>" (e.g. "overrun-bomber-hero-real.jpg").
const SECRETS_ROOT = "/etc/secrets";

function loadDotEnvFallback() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath) || process.env.UNLOCK_PASSWORDS) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*UNLOCK_PASSWORDS\s*=\s*(.+)\s*$/);
    if (match) {
      process.env.UNLOCK_PASSWORDS = match[1].trim().replace(/^["']|["']$/g, "");
      break;
    }
  }
}

function loadPasswordMap() {
  loadDotEnvFallback();
  const raw = process.env.UNLOCK_PASSWORDS;
  if (!raw) {
    console.warn("[protected-assets] UNLOCK_PASSWORDS not set — protected images won't be reachable.");
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    console.warn("[protected-assets] UNLOCK_PASSWORDS isn't valid JSON — skipping.");
    return {};
  }
}

function deriveSuffix(password, projectId) {
  return createHash("sha256").update(`${password}:${projectId}`).digest("hex").slice(0, 16);
}

function findHeroRealFile(projectId) {
  const sourceDir = path.join(PRIVATE_ROOT, projectId);
  if (existsSync(sourceDir)) {
    const heroFile = readdirSync(sourceDir).find((name) => name.startsWith("hero-real"));
    if (heroFile) return path.join(sourceDir, heroFile);
  }

  if (existsSync(SECRETS_ROOT)) {
    const secretFile = readdirSync(SECRETS_ROOT).find((name) => name.startsWith(`${projectId}-hero-real`));
    if (secretFile) return path.join(SECRETS_ROOT, secretFile);
  }

  return null;
}

const passwordMap = loadPasswordMap();

for (const [projectId, password] of Object.entries(passwordMap)) {
  const heroPath = findHeroRealFile(projectId);
  if (!heroPath) {
    console.warn(
      `[protected-assets] No hero-real.* file found for "${projectId}" in ${PRIVATE_ROOT} or as a Render Secret File named "${projectId}-hero-real.<ext>"`,
    );
    continue;
  }

  const ext = path.extname(heroPath);
  const suffix = deriveSuffix(password, projectId);
  const destDir = path.join(PUBLIC_ROOT, projectId);
  mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, `hero-${suffix}${ext}`);
  copyFileSync(heroPath, destPath);
  console.log(`[protected-assets] ${projectId} -> images/protected/${projectId}/hero-${suffix}${ext}`);
}
