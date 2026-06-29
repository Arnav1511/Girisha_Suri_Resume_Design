/**
 * Password gate for static hosting (Render Static Site — no server to
 * check a password against at request time).
 *
 * The password is never compared against a stored value in the shipped
 * bundle. Instead it's hashed client-side and used to *derive* the real
 * image's filename: at build time, scripts/prepare-protected-assets.mjs
 * reads the same password from the UNLOCK_PASSWORDS env var and copies the
 * real asset to /images/protected/<projectId>/hero-<hash>.<ext> using the
 * identical hash. Get the password right and that file exists; get it
 * wrong and it 404s. The plaintext password is never in the JS bundle or
 * the git history — only the hashing scheme is, which is fine, hashing
 * algorithms are public by design.
 *
 * This is "good enough to keep an unreleased project out of casual
 * browsing and off Google," not cryptographic access control — there's no
 * server to rate-limit guesses. If real protection against a motivated
 * attacker is ever needed, switch to the server-checked path already built
 * in src/server/ + api/ (designed for Azure Functions or any Node host).
 */

const CANDIDATE_EXTENSIONS = ["svg", "jpg", "jpeg", "png", "webp"];
const HASH_LENGTH = 16;

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function resolveUnlockedImageUrl(projectId: string, password: string): Promise<string | null> {
  const hash = await sha256Hex(`${password}:${projectId}`);
  const suffix = hash.slice(0, HASH_LENGTH);

  for (const ext of CANDIDATE_EXTENSIONS) {
    const url = `/images/protected/${projectId}/hero-${suffix}.${ext}`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      // Network hiccup on this extension — keep trying the others.
    }
  }
  return null;
}
