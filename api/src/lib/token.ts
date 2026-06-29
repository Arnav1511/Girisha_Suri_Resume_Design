/**
 * Mirrors src/server/token.ts — see that file for full notes. Short-lived
 * HMAC-signed tokens scoping access to one project's images for 5 minutes.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { getTokenSecret } from "./env";

const TOKEN_TTL_SECONDS = 5 * 60;

function sign(payload: string): string {
  return createHmac("sha256", getTokenSecret()).update(payload).digest("hex");
}

export function issueToken(projectId: string): string {
  const expiry = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${projectId}.${expiry}`;
  return `${expiry}.${sign(payload)}`;
}

export function verifyToken(projectId: string, token: string | null): boolean {
  if (!token) return false;
  const [expiryStr, signatureHex] = token.split(".");
  if (!expiryStr || !signatureHex) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = sign(`${projectId}.${expiry}`);
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signatureHex, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return timingSafeEqual(expectedBuf, actualBuf);
}
