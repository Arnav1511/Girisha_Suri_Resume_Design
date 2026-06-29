/**
 * Mirrors src/server/protectedImage.ts — keep the two in sync.
 */
import { readFile } from "node:fs/promises";
import { verifyToken } from "./token";
import { resolveProtectedAsset } from "./protectedAssets";

export interface ProtectedImageResult {
  status: number;
  contentType: string;
  body: Buffer | string;
}

export async function handleProtectedImage(
  projectId: string,
  assetId: string,
  token: string | null,
): Promise<ProtectedImageResult> {
  if (!verifyToken(projectId, token)) {
    return { status: 403, contentType: "text/plain", body: "Link expired. Unlock the project again." };
  }

  const asset = resolveProtectedAsset(projectId, assetId);
  if (!asset) {
    return { status: 404, contentType: "text/plain", body: "Not found." };
  }

  const file = await readFile(asset.filePath);
  return { status: 200, contentType: asset.contentType, body: file };
}
