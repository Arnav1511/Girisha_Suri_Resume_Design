/**
 * Static hosting has no server session, so "stay unlocked" lives in the
 * browser. Once a visitor enters the right password, we remember the resolved
 * image URL (not the password) in localStorage, scoped to this browser.
 */

const STORAGE_PREFIX = "girisha-gate:";
const UNLOCKED_LABEL = "Unlocked - full preview";
const DEFAULT_LOCKED_LABEL = "Viewable on request";

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
    // Storage unavailable; unlock still works for this page view.
  }
}

export function clearStoredUnlock(projectId: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + projectId);
  } catch {
    // Storage unavailable; the visual lock state can still be restored.
  }
}

function rememberLockedState(trigger: HTMLElement): void {
  const img = trigger.querySelector("img");
  if (img && !trigger.dataset.lockedSrc) {
    trigger.dataset.lockedSrc = img.getAttribute("src") ?? "";
  }

  const tag = trigger.querySelector<HTMLElement>('[data-role="protected-tag"]');
  if (tag && !tag.dataset.lockedText) {
    tag.dataset.lockedText = tag.textContent ?? DEFAULT_LOCKED_LABEL;
  }
}

function setTriggerUnlocked(trigger: HTMLElement, unlockedUrl: string): void {
  rememberLockedState(trigger);

  const img = trigger.querySelector("img");
  if (img) img.src = unlockedUrl;

  trigger.querySelector<HTMLElement>('[data-role="lock-affordance"]')?.setAttribute("hidden", "");

  const tag = trigger.querySelector<HTMLElement>('[data-role="protected-tag"]');
  if (tag) tag.textContent = UNLOCKED_LABEL;

  trigger.classList.add("is-unlocked");
  trigger.closest(".project-card, .hero")?.classList.add("is-unlocked");
}

function setTriggerLocked(trigger: HTMLElement): void {
  rememberLockedState(trigger);

  const img = trigger.querySelector("img");
  if (img && trigger.dataset.lockedSrc) img.src = trigger.dataset.lockedSrc;

  trigger.querySelector<HTMLElement>('[data-role="lock-affordance"]')?.removeAttribute("hidden");

  const tag = trigger.querySelector<HTMLElement>('[data-role="protected-tag"]');
  if (tag) tag.textContent = tag.dataset.lockedText ?? DEFAULT_LOCKED_LABEL;

  trigger.classList.remove("is-unlocked");
  trigger.closest(".project-card, .hero")?.classList.remove("is-unlocked");
}

export function applyProjectLockState(projectId: string, root: ParentNode = document): void {
  const unlockedUrl = getStoredUnlock(projectId);

  root.querySelectorAll<HTMLElement>("[data-gate-trigger]").forEach((trigger) => {
    if (trigger.dataset.projectId !== projectId) return;

    if (unlockedUrl) {
      setTriggerUnlocked(trigger, unlockedUrl);
    } else {
      setTriggerLocked(trigger);
    }
  });

  root.querySelectorAll<HTMLButtonElement>("[data-gate-lock]").forEach((button) => {
    if (button.dataset.projectId === projectId) button.hidden = !unlockedUrl;
  });
}

/** Applies stored unlocks to protected triggers already present in `root`. */
export function applyStoredUnlocks(root: ParentNode = document): void {
  const projectIds = new Set<string>();

  root.querySelectorAll<HTMLElement>("[data-gate-trigger]").forEach((trigger) => {
    const projectId = trigger.dataset.projectId;
    if (projectId) projectIds.add(projectId);
  });

  projectIds.forEach((projectId) => applyProjectLockState(projectId, root));
}
