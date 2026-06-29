/**
 * Whitelist of real, full-resolution protected images, keyed by project
 * then by a short asset id (never a raw filename from the request) so the
 * image-serving handler can never be made to read an arbitrary path.
 *
 * Phase 1: files resolve from /private/protected-images on local disk —
 * that folder is outside src/ and outside public/, so Astro never copies
 * it into the static build output. It is for local development only.
 *
 * Production wiring (Azure Blob): replace `filePath` with a call to the
 * Blob SDK that generates a time-limited SAS URL for the equivalent blob
 * in a private container, and change protectedImage.ts to redirect to
 * that URL instead of streaming bytes from disk. The lookup key (projectId
 * + assetId -> exact blob name) stays identical.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";

const PRIVATE_ROOT = fileURLToPath(new URL("../../private/protected-images/", import.meta.url));

export interface ProtectedAsset {
  filePath: string;
  contentType: string;
}

const MANIFEST: Record<string, Record<string, ProtectedAsset>> = {
  "overrun-bomber": {
    hero: {
      filePath: path.join(PRIVATE_ROOT, "overrun-bomber", "hero-real.svg"),
      contentType: "image/svg+xml",
    },
  },
};

export function resolveProtectedAsset(projectId: string, assetId: string): ProtectedAsset | null {
  return MANIFEST[projectId]?.[assetId] ?? null;
}

export function listAssetIds(projectId: string): string[] {
  return Object.keys(MANIFEST[projectId] ?? {});
}
