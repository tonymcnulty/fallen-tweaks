import { getStorage, setStorage } from "@shared/storage";
import type { FeatureModule } from "./types";

/**
 * Opportunity Card Favourites
 *
 * Cards with a preference show a persistent indicator (👍 or 👎) in the
 * top-right corner. On hover, the indicator expands into a two-button
 * action bar. Preferences persist across sessions. Favourite cards get
 * a green border; avoided cards are dimmed.
 */

type CardPref = "favourite" | "avoid";

const INDICATOR_CLASS = "ft-card-indicator";
const OVERLAY_CLASS = "ft-card-overlay";
const FAVOURITE_CLASS = "ft-card--favourite";
const AVOID_CLASS = "ft-card--avoid";

const ICONS: Record<CardPref, string> = {
  favourite: "\u{1F44D}", // 👍
  avoid: "\u{1F44E}", // 👎
};

let cardPrefs: Record<string, CardPref> = {};
let observer: MutationObserver | null = null;
let bound = false;

/** Get the event ID that uniquely identifies a card. */
function getCardId(container: HTMLElement): string | null {
  return container.dataset.eventId ?? null;
}

/** Get the card name from the aria-label for tooltip purposes. */
function getCardName(container: HTMLElement): string {
  const labelEl = container.querySelector("[aria-label]");
  return labelEl?.getAttribute("aria-label") ?? "Unknown card";
}

/** Ensure .hand__card has position:relative for absolute children. */
function ensurePositioned(card: HTMLElement): void {
  if (getComputedStyle(card).position === "static") {
    card.style.position = "relative";
  }
}

/** Clean up the position style we added to .hand__card. */
function clearPositioned(card: HTMLElement): void {
  card.style.position = "";
}

// ─── Indicator (persistent badge) ─────────────────────────────

/** Add or update the small indicator icon on a card. */
function applyIndicator(container: HTMLElement): void {
  const cardId = getCardId(container);
  if (!cardId) return;

  const card = container.querySelector(".hand__card") as HTMLElement | null;
  if (!card) return;

  let indicator = card.querySelector(`.${INDICATOR_CLASS}`) as HTMLElement | null;
  const pref = cardPrefs[cardId];

  if (!pref) {
    // No preference — remove indicator if present
    indicator?.remove();
    clearPositioned(card);
    return;
  }

  ensurePositioned(card);

  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = INDICATOR_CLASS;
    card.appendChild(indicator);
  }

  indicator.textContent = ICONS[pref];
  indicator.title = `Fallen Tweaks: ${pref === "favourite" ? "Favourite" : "Avoid"}`;
}

/** Apply indicator + card styles to a single container. */
function applyCardState(container: HTMLElement): void {
  const cardId = getCardId(container);
  if (!cardId) return;

  const card = container.querySelector(".hand__card") as HTMLElement | null;
  if (!card) return;

  card.classList.remove(FAVOURITE_CLASS, AVOID_CLASS);
  const pref = cardPrefs[cardId];
  if (pref === "favourite") card.classList.add(FAVOURITE_CLASS);
  else if (pref === "avoid") card.classList.add(AVOID_CLASS);

  applyIndicator(container);
}

/** Apply state to all visible cards. */
function applyAllCardStates(): void {
  const containers = document.querySelectorAll<HTMLElement>(
    ".hand__card-container[data-event-id]",
  );
  for (const container of containers) {
    applyCardState(container);
  }
}

/** Remove all injected elements and styles from cards. */
function removeAllCardUI(): void {
  document
    .querySelectorAll(`.${FAVOURITE_CLASS}, .${AVOID_CLASS}`)
    .forEach((el) => el.classList.remove(FAVOURITE_CLASS, AVOID_CLASS));
  document.querySelectorAll(`.${INDICATOR_CLASS}`).forEach((el) => el.remove());
  document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach((el) => el.remove());
}

// ─── Overlay (hover action bar) ───────────────────────────────

/** Save a preference, update visuals. */
async function setCardPref(
  container: HTMLElement,
  pref: CardPref | null,
): Promise<void> {
  const cardId = getCardId(container);
  if (!cardId) return;

  if (pref === null) {
    delete cardPrefs[cardId];
  } else {
    cardPrefs[cardId] = pref;
  }

  await setStorage("cardPreferences", { ...cardPrefs });
  applyCardState(container);
  updateOverlayButtons(container);
}

/** Toggle a preference — clicking the active button clears it. */
async function toggleCardPref(
  container: HTMLElement,
  pref: CardPref,
): Promise<void> {
  const cardId = getCardId(container);
  if (!cardId) return;

  const current = cardPrefs[cardId];
  await setCardPref(container, current === pref ? null : pref);
}

/** Create the two-button overlay. */
function createOverlay(container: HTMLElement): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = OVERLAY_CLASS;

  const cardName = getCardName(container);

  const favBtn = document.createElement("button");
  favBtn.className = "ft-action-btn ft-card-overlay__btn";
  favBtn.dataset.action = "favourite";
  favBtn.textContent = ICONS.favourite;
  favBtn.title = `Mark "${cardName}" as a favourite (Fallen Tweaks)`;
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCardPref(container, "favourite");
  });

  const avoidBtn = document.createElement("button");
  avoidBtn.className = "ft-action-btn ft-card-overlay__btn";
  avoidBtn.dataset.action = "avoid";
  avoidBtn.textContent = ICONS.avoid;
  avoidBtn.title = `Mark "${cardName}" as one to avoid (Fallen Tweaks)`;
  avoidBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCardPref(container, "avoid");
  });

  overlay.appendChild(favBtn);
  overlay.appendChild(avoidBtn);

  return overlay;
}

/** Update active state of overlay buttons. */
function updateOverlayButtons(container: HTMLElement): void {
  const overlay = container.querySelector(`.${OVERLAY_CLASS}`);
  if (!overlay) return;

  const cardId = getCardId(container);
  const pref = cardId ? cardPrefs[cardId] : undefined;

  const favBtn = overlay.querySelector('[data-action="favourite"]');
  const avoidBtn = overlay.querySelector('[data-action="avoid"]');

  favBtn?.classList.toggle("ft-action-btn--active", pref === "favourite");
  avoidBtn?.classList.toggle("ft-action-btn--active", pref === "avoid");
}

/** Show the overlay, hiding the indicator. */
function showOverlay(container: HTMLElement): void {
  const card = container.querySelector(".hand__card") as HTMLElement | null;
  if (!card) return;
  if (card.querySelector(`.${OVERLAY_CLASS}`)) return;

  ensurePositioned(card);

  // Hide indicator while overlay is visible
  const indicator = card.querySelector(`.${INDICATOR_CLASS}`) as HTMLElement | null;
  if (indicator) indicator.classList.add("ft-card-indicator--hidden");

  const overlay = createOverlay(container);
  card.appendChild(overlay);
  updateOverlayButtons(container);

  requestAnimationFrame(() => overlay.classList.add("ft-overlay--visible"));
}

/** Hide the overlay, restoring the indicator. */
function hideOverlay(container: HTMLElement): void {
  const card = container.querySelector(".hand__card") as HTMLElement | null;
  if (!card) return;

  const overlay = card.querySelector(`.${OVERLAY_CLASS}`);
  overlay?.remove();

  // Restore indicator
  const indicator = card.querySelector(`.${INDICATOR_CLASS}`) as HTMLElement | null;
  if (indicator) indicator.classList.remove("ft-card-indicator--hidden");
}

// ─── Event handling ───────────────────────────────────────────

function handleMouseEnter(e: Event): void {
  const container = (e.target as HTMLElement).closest(
    ".hand__card-container[data-event-id]",
  ) as HTMLElement | null;
  if (container) showOverlay(container);
}

function handleMouseLeave(e: Event): void {
  const container = (e.target as HTMLElement).closest(
    ".hand__card-container[data-event-id]",
  ) as HTMLElement | null;
  if (!container) return;

  const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
  if (related && container.contains(related)) return;

  hideOverlay(container);
}

function bindEvents(): void {
  if (bound) return;
  document.addEventListener("mouseover", handleMouseEnter);
  document.addEventListener("mouseout", handleMouseLeave);
  bound = true;
}

function unbindEvents(): void {
  document.removeEventListener("mouseover", handleMouseEnter);
  document.removeEventListener("mouseout", handleMouseLeave);
  bound = false;
}

// ─── Module ───────────────────────────────────────────────────

const OWN_CLASSES = [INDICATOR_CLASS, OVERLAY_CLASS, FAVOURITE_CLASS, AVOID_CLASS];

/** Check whether all mutations came from our own injected elements. */
function isOwnMutation(mutations: MutationRecord[]): boolean {
  return mutations.every((m) => {
    const target = m.target as HTMLElement;
    // Class changes on elements we styled
    if (m.type === "attributes" && m.attributeName === "class") {
      return OWN_CLASSES.some(
        (cls) => target.classList?.contains(cls),
      );
    }
    // Child additions/removals inside our elements
    if (m.type === "childList") {
      return (
        target.classList?.contains(INDICATOR_CLASS) ||
        target.classList?.contains(OVERLAY_CLASS) ||
        (target.classList?.contains("hand__card") &&
          Array.from(m.addedNodes).every(
            (n) =>
              n instanceof HTMLElement &&
              (n.classList.contains(INDICATOR_CLASS) ||
                n.classList.contains(OVERLAY_CLASS)),
          ) &&
          Array.from(m.removedNodes).every(
            (n) =>
              n instanceof HTMLElement &&
              (n.classList.contains(INDICATOR_CLASS) ||
                n.classList.contains(OVERLAY_CLASS)),
          ))
      );
    }
    return false;
  });
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const cardFavourites: FeatureModule = {
  id: "card-favourites",

  async enable() {
    cardPrefs = await getStorage("cardPreferences");
    applyAllCardStates();
    bindEvents();

    observer = new MutationObserver((mutations) => {
      if (isOwnMutation(mutations)) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyAllCardStates, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  disable() {
    unbindEvents();
    removeAllCardUI();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    cardPrefs = {};
  },
};
