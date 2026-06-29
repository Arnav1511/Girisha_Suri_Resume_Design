/**
 * Mirrors src/server/unlock.ts — keep the two in sync. This is the
 * production copy that ships with the Azure Function in
 * api/src/functions/unlock.ts.
 */
import { getPasswordMap } from "./env";
import { issueToken } from "./token";
import { listAssetIds } from "./protectedAssets";

export interface UnlockRequestBody {
  projectId?: unknown;
  password?: unknown;
}

export interface HandlerResult {
  status: number;
  body: Record<string, unknown>;
}

export function handleUnlock(body: UnlockRequestBody): HandlerResult {
  const { projectId, password } = body;

  if (typeof projectId !== "string" || typeof password !== "string" || !projectId || !password) {
    return { status: 400, body: { ok: false, error: "Enter the project password to continue." } };
  }

  const passwordMap = getPasswordMap();
  const expected = passwordMap[projectId];

  if (!expected || expected !== password) {
    return { status: 401, body: { ok: false, error: "That password doesn't match. Check it and try again." } };
  }

  const token = issueToken(projectId);
  const assetIds = listAssetIds(projectId);

  return {
    status: 200,
    body: {
      ok: true,
      images: assetIds.map((assetId) => ({
        assetId,
        url: `/api/protected-image/${encodeURIComponent(projectId)}/${encodeURIComponent(assetId)}?token=${encodeURIComponent(token)}`,
      })),
    },
  };
}
