/**
 * Core /api/unlock logic, framework-agnostic so it can be called from
 * either the local Vite dev middleware (see astro.config.mjs) or the real
 * Azure Function in /api/unlock (see that file's top comment for why the
 * logic is duplicated there rather than imported across packages).
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
