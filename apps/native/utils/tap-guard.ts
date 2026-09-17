// ponytail: one shared window for every guarded action, not one lock per button.
// Guarded actions are one-at-a-time by nature, so the shared lock also catches a
// double tap that lands on two different buttons. Give an action its own ref-based
// lock if a screen ever needs two guarded actions running at the same time.
const TAP_GUARD_MS = 500;

let unlockAt = 0;

/**
 * Wraps an action so a second call within `TAP_GUARD_MS` is ignored. Use it for
 * actions a double tap must not repeat: navigation, and one-shot submits with no
 * pending state to disable the button with.
 */
export function guardTap<A extends unknown[]>(action: (...args: A) => void) {
  return (...args: A) => {
    const now = Date.now();
    if (now < unlockAt) return;
    unlockAt = now + TAP_GUARD_MS;
    action(...args);
  };
}
