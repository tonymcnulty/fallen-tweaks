/**
 * Every feature module implements this interface.
 *
 * - `enable()` sets up DOM observers, event listeners, and injects UI.
 * - `disable()` fully tears everything down — no traces left in the DOM.
 */
export interface FeatureModule {
  /** Unique key matching the MODULE_REGISTRY entry, e.g. "bazaar-total" */
  readonly id: string;

  /** Set up observers, listeners, and inject UI elements. */
  enable(): void;

  /** Remove all injected UI, disconnect observers, unbind listeners. */
  disable(): void;
}
