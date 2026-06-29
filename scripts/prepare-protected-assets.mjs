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
const HERO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
// private/ is gitignored — a public-repo deploy (e.g. Render) never has it.
// Both Render Secret Files and large environment variables turned out to
// have hard size ceilings (a multi-hundred-KB blob blew past both — Secret
// Files errored on save, and a big env var crashed the build with "argument
// list too long" from execve's combined argv+envp limit). The real fix:
// don't put the file itself anywhere in Render's config at all. Instead it
// lives in a small private GitHub repo (PROTECTED_ASSETS_REPO below), and
// the build fetches it directly via the GitHub Contents API using a single
// short-lived, read-only PROTECTED_ASSETS_TOKEN env var — a normal
// config-sized credential, never anywhere close to any size limit.
//
// HERO_B64_<PROJECT_ID> (a base64'd image directly in an env var) and Render
// Secret Files (/etc/secrets/<filename>) are kept as fallbacks for small
// enough files, but the private-repo fetch is the one that scales.
const SECRETS_ROOT = "/etc/secrets";
const DEFAULT_PROTECTED_ASSETS_REPO = "Arnav1511/girisha-protected-assets";

function envVarNameForProject(projectId) {
  return `HERO_B64_${projectId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

function loadDotEnvFallback() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    if (
      key !== "UNLOCK_PASSWORDS" &&
      key !== "PROTECTED_ASSETS_TOKEN" &&
      key !== "PROTECTED_ASSETS_REPO" &&
      key !== "PROTECTED_ASSETS_REF" &&
      key !== "PROTECTED_ASSETS_PATH_PREFIX" &&
      !key.startsWith("HERO_B64_")
    ) {
      continue;
    }

    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
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

function encodeRepoPath(repoPath) {
  return repoPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function candidateRepoPaths(projectId) {
  const configuredPrefix = process.env.PROTECTED_ASSETS_PATH_PREFIX;
  const prefixes = configuredPrefix
    ? [configuredPrefix]
    : ["protected-images", "private/protected-images", ""];

  return prefixes.flatMap((prefix) => {
    const cleanPrefix = prefix.trim().replace(/^\/+|\/+$/g, "");
    return HERO_EXTENSIONS.map((ext) => ({
      ext,
      repoPath: [cleanPrefix, projectId, `hero-real${ext}`].filter(Boolean).join("/"),
    }));
  });
}

async function fetchGitHubHeroSource(projectId) {
  const token = process.env.PROTECTED_ASSETS_TOKEN;
  if (!token) return null;

  const repo = process.env.PROTECTED_ASSETS_REPO ?? DEFAULT_PROTECTED_ASSETS_REPO;
  const ref = process.env.PROTECTED_ASSETS_REF;
  const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const headers = {
    Accept: "application/vnd.github.raw",
    Authorization: `Bearer ${token}`,
    "User-Agent": "girisha-portfolio-build",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  for (const candidate of candidateRepoPaths(projectId)) {
    const url = `https://api.github.com/repos/${repo}/contents/${encodeRepoPath(candidate.repoPath)}${refQuery}`;
    const response = await fetch(url, { headers });

    if (response.status === 404) continue;

    if (!response.ok) {
      console.warn(
        `[protected-assets] GitHub fetch failed for "${projectId}" from ${repo} (${response.status} ${response.statusText}).`,
      );
      return null;
    }

    return {
      ext: candidate.ext,
      buffer: Buffer.from(await response.arrayBuffer()),
    };
  }

  console.warn(
    `[protected-assets] No GitHub hero found for "${projectId}" in ${repo}; checked hero-real files under protected-images/, private/protected-images/, and the repo root.`,
  );
  return null;
}

// Returns the real image bytes for a project, regardless of which source it
// came from, so the caller never has to care.
async function resolveHeroSource(projectId) {
  const sourceDir = path.join(PRIVATE_ROOT, projectId);
  if (existsSync(sourceDir)) {
    const heroFile = readdirSync(sourceDir).find((name) => name.startsWith("hero-real"));
    if (heroFile) {
      return { ext: path.extname(heroFile), buffer: readFileSync(path.join(sourceDir, heroFile)) };
    }
  }

  const githubSource = await fetchGitHubHeroSource(projectId);
  if (githubSource) return githubSource;

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
let missingSourceCount = 0;

for (const [projectId, password] of Object.entries(passwordMap)) {
  const source = await resolveHeroSource(projectId);
  if (!source) {
    missingSourceCount += 1;
    console.warn(
      `[protected-assets] No hero image found for "${projectId}" — checked ${PRIVATE_ROOT}, GitHub via PROTECTED_ASSETS_TOKEN, the ${envVarNameForProject(projectId)} env var, and Render Secret Files in ${SECRETS_ROOT}.`,
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

if (missingSourceCount > 0) {
  console.error(
    `[protected-assets] Missing ${missingSourceCount} protected source image(s). Correct passwords would 404 on the deployed static site, so the build is failing now instead.`,
  );
  process.exitCode = 1;
}
