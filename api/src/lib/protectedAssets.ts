/**
 * Mirrors src/server/protectedAssets.ts. Phase 1 resolves real images from
 * a private folder on local disk, outside any publicly-served directory.
 *
 * Production wiring (Azure Blob): replace `filePath` lookups with a call
 * to @azure/storage-blob's BlobSASPermissions / generateBlobSASQueryParameters
 * against a private container, and change protectedImage.ts to return a
 * redirect (302) to the generated SAS URL instead of streaming local bytes.
 * The projectId + assetId -> blob name lookup keeps the same shape.
 */
import path from "node:path";

const PRIVATE_ROOT = path.join(__dirname, "..", "..", "..", "private", "protected-images");

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
