/**
 * Static hosting has no server session, so "stay unlocked" has to live in
 * the browser. Once a visitor enters the right password once, we remember
 * the resolved image URL (not the password) in localStorage, scoped to
 * this browser — so navigating from the grid to the project's case-study
 * page (or back) doesn't re-prompt. Shared between PasswordGateModal.astro
 * (writes on success) and anywhere a gate trigger renders (ProjectCard,
 * RecruiterFilter, the case-study hero) so they can self-unlock on load.
 */

const STORAGE_PREFIX = "girisha-gate:";

export function getStoredUnlock(projectId: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + projectId);
  } catch {
    return null;
  }
}

export function setStoredUnlock(projectId: string, imageUrl: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + projectId, imageUrl);
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — unlock still
    // works for this page view, it just won't persist across pages.
  }
}

/** Swaps in the real image + drops the lock affordance for any trigger in `root` already unlocked in this browser. */
export function applyStoredUnlocks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-gate-trigger]").forEach((trigger) => {
    const projectId = trigger.dataset.projectId;
    if (!projectId) return;

    const unlockedUrl = getStoredUnlock(projectId);
    if (!unlockedUrl) return;

    const img = trigger.querySelector("img");
    if (img) img.src = unlockedUrl;
    trigger.querySelector('[data-role="lock-affordance"]')?.remove();
    const tag = trigger.querySelector('[data-role="protected-tag"]');
    if (tag) tag.textContent = "Unlocked — full preview";
  });
}
