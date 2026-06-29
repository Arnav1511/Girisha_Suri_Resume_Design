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
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PRIVATE_ROOT = path.join(ROOT, "private", "protected-images");
const PUBLIC_ROOT = path.join(ROOT, "public", "images", "protected");
// private/ is gitignored — a public-repo deploy (e.g. Render) never has it.
// Simplest fix: a normal environment variable, exactly like UNLOCK_PASSWORDS
// already is. Compress the real photo down to a sane web size first (a
// resized, ~80-quality JPEG is usually well under 200KB -> ~250KB of base64
// text, comfortably variable-sized, not "paste a multi-MB file into a box"
// sized) and set it as HERO_B64_<PROJECT_ID> (dashes -> underscores,
// uppercased), e.g. HERO_B64_OVERRUN_BOMBER for "overrun-bomber". Picked up
// automatically at build time, no dashboard file upload involved.
//
// Render Secret Files (/etc/secrets/<filename>) are kept as a fallback for
// anyone who prefers that route, same two forms as before: a raw uploaded
// file, or a "<projectId>-hero-real.<ext>.b64" text payload.
const SECRETS_ROOT = "/etc/secrets";

function envVarNameForProject(projectId) {
  return `HERO_B64_${projectId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

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

// Returns the real image bytes for a project, regardless of which source it
// came from, so the caller never has to care.
function resolveHeroSource(projectId) {
  const sourceDir = path.join(PRIVATE_ROOT, projectId);
  if (existsSync(sourceDir)) {
    const heroFile = readdirSync(sourceDir).find((name) => name.startsWith("hero-real"));
    if (heroFile) {
      return { ext: path.extname(heroFile), buffer: readFileSync(path.join(sourceDir, heroFile)) };
    }
  }

  const envValue = process.env[envVarNameForProject(projectId)];
  if (envValue) {
    return { ext: ".jpg", buffer: Buffer.from(envValue.trim(), "base64") };
  }

  if (existsSync(SECRETS_ROOT)) {
    const candidates = readdirSync(SECRETS_ROOT).filter((name) => name.startsWith(`${projectId}-hero-real`));

    const base64File = candidates.find((name) => name.endsWith(".b64"));
    if (base64File) {
      const ext = path.extname(base64File.slice(0, -".b64".length));
      const base64 = readFileSync(path.join(SECRETS_ROOT, base64File), "utf8").trim();
      return { ext, buffer: Buffer.from(base64, "base64") };
    }

    const rawFile = candidates[0];
    if (rawFile) {
      return { ext: path.extname(rawFile), buffer: readFileSync(path.join(SECRETS_ROOT, rawFile)) };
    }
  }

  return null;
}

const passwordMap = loadPasswordMap();

for (const [projectId, password] of Object.entries(passwordMap)) {
  const source = resolveHeroSource(projectId);
  if (!source) {
    console.warn(
      `[protected-assets] No hero image found for "${projectId}" — checked ${PRIVATE_ROOT}, the ${envVarNameForProject(projectId)} env var, and Render Secret Files in ${SECRETS_ROOT}.`,
    );
    continue;
  }

  const suffix = deriveSuffix(password, projectId);
  const destDir = path.join(PUBLIC_ROOT, projectId);
  mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, `hero-${suffix}${source.ext}`);
  writeFileSync(destPath, source.buffer);
  console.log(`[protected-assets] ${projectId} -> images/protected/${projectId}/hero-${suffix}${source.ext}`);
}
