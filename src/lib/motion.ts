/**
 * Shared motion / animation utilities.
 * Consolidates duplicated reduced-motion checks and helpers.
 */

/** Returns `true` when the user prefers reduced motion (or SSR). */
export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Returns `true` when the device has a hover-capable pointer (i.e. not touch-only). */
export function hasHoverCapability(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return window.matchMedia("(hover: hover)").matches;
}
