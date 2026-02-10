import type { FeatureModule } from "./types";

/**
 * Bazaar Total Value
 *
 * When the user is on the Bazaar "Sell my things" tab, computes the total
 * value of all listed items (quantity × unit price) and displays a polished
 * badge beside the page header. Supports both Echo and Hinterland Scrip
 * currencies — items are grouped by currency and each total shown separately.
 */

/** Parse a quantity string like "3,966" into a number. */
export function parseQuantity(text: string): number {
  const cleaned = text.replace(/,/g, "").trim();
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Parse a price string like "0.01" into a number. */
export function parsePrice(text: string): number {
  const n = parseFloat(text.trim());
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Parse a scrip price string like "1 x Hinterland Scrip" into a number.
 * Returns 0 if the pattern doesn't match.
 */
export function parseScripPrice(text: string): number {
  const match = text.match(/(\d+)\s*x\s*Hinterland Scrip/i);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

/** Compute the total value of all items from arrays of quantities and prices. */
export function computeTotal(
  items: Array<{ quantity: number; price: number }>,
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

/** Format a total in Echoes, e.g. 1234.56 → "1,234.56 Echoes". */
export function formatCurrency(total: number, currency: string): string {
  if (currency === "Echoes") {
    const rounded = Math.round(total * 100) / 100;
    const parts = rounded.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${parts.join(".")} Echoes`;
  }
  // Scrip is whole numbers
  const rounded = Math.round(total);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${formatted} ${currency}`;
}

// Keep the old name exported for backwards compatibility with tests
export const formatEchoes = (total: number) => formatCurrency(total, "Echoes");

interface CurrencyTotal {
  currency: string;
  total: number;
}

const BADGE_ID = "ft-bazaar-total-badge";

/** Check whether the "Sell my things" view is showing (active or default). */
function isSellTabActive(): boolean {
  const buttons = document.querySelectorAll<HTMLElement>(
    ".nav__item .nav__button",
  );
  if (buttons.length === 0) return false;

  // If no button is active, the bazaar defaults to "Sell my things"
  const anyActive = Array.from(buttons).some((btn) =>
    btn.classList.contains("menu-item--active"),
  );
  if (!anyActive) return true;

  return Array.from(buttons).some(
    (btn) =>
      btn.classList.contains("menu-item--active") &&
      btn.textContent?.trim() === "Sell my things",
  );
}

/** Read all shop items from the DOM, grouping totals by currency. */
function calculateTotalsFromDOM(): CurrencyTotal[] {
  const items = document.querySelectorAll(".shop__item");
  const echoItems: Array<{ quantity: number; price: number }> = [];
  const scripItems: Array<{ quantity: number; price: number }> = [];

  for (const item of items) {
    const qtyEl = item.querySelector(".js-item-value");
    if (!qtyEl) continue;
    const quantity = parseQuantity(qtyEl.textContent ?? "0");

    const priceEl = item.querySelector(".item__price");
    if (priceEl) {
      echoItems.push({
        quantity,
        price: parsePrice(priceEl.textContent ?? "0"),
      });
      continue;
    }

    // Check for scrip-priced items: look for "N x Hinterland Scrip" text
    const descEl = item.querySelector(".item__desc");
    if (descEl) {
      const scripPrice = parseScripPrice(descEl.textContent ?? "");
      if (scripPrice > 0) {
        scripItems.push({ quantity, price: scripPrice });
      }
    }
  }

  const totals: CurrencyTotal[] = [];
  const echoTotal = computeTotal(echoItems);
  const scripTotal = computeTotal(scripItems);

  if (echoTotal > 0) totals.push({ currency: "Echoes", total: echoTotal });
  if (scripTotal > 0)
    totals.push({ currency: "Hinterland Scrip", total: scripTotal });

  return totals;
}

/** Create or update the total badge element. */
function renderBadge(totals: CurrencyTotal[]): void {
  let badge = document.getElementById(BADGE_ID);
  const header = document.querySelector(".exchange__title");

  if (!header) {
    removeBadge();
    return;
  }

  if (!badge) {
    badge = document.createElement("span");
    badge.id = BADGE_ID;
    badge.className = "ft-bazaar-total";
    badge.title =
      "Fallen Tweaks — Bazaar Total Value\nA tally of your worldly possessions. The Bazaar appreciates your custom.";

    // Ensure header can contain the absolute-positioned badge
    const headerEl = header as HTMLElement;
    if (getComputedStyle(headerEl).position === "static") {
      headerEl.style.position = "relative";
    }

    header.appendChild(badge);
  }

  badge.innerHTML = "";

  const label = document.createElement("span");
  label.className = "ft-bazaar-total__label";
  label.textContent = "Total";
  badge.appendChild(label);

  for (let i = 0; i < totals.length; i++) {
    if (i > 0) {
      const sep = document.createElement("span");
      sep.className = "ft-bazaar-total__separator";
      sep.textContent = "+";
      badge.appendChild(sep);
    }

    const value = document.createElement("span");
    value.className = "ft-bazaar-total__value";
    value.textContent = formatCurrency(totals[i].total, totals[i].currency);
    badge.appendChild(value);
  }
}

/** Remove the badge from the DOM. */
function removeBadge(): void {
  const badge = document.getElementById(BADGE_ID);
  if (badge) {
    // Clean up the position style we may have added to the header
    const header = badge.parentElement;
    if (header) {
      header.style.position = "";
    }
    badge.remove();
  }
}

/** Run a calculation update if on the sell tab, otherwise remove the badge. */
function update(): void {
  if (
    isSellTabActive() &&
    document.querySelectorAll(".shop__item").length > 0
  ) {
    const totals = calculateTotalsFromDOM();
    if (totals.length > 0) {
      renderBadge(totals);
    } else {
      removeBadge();
    }
  } else {
    removeBadge();
  }
}

let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Check whether a mutation originated from our own badge element. */
function isOwnMutation(mutations: MutationRecord[]): boolean {
  const badge = document.getElementById(BADGE_ID);
  if (!badge) return false;
  return mutations.every(
    (m) => badge.contains(m.target) || m.target === badge,
  );
}

function debouncedUpdate(mutations: MutationRecord[]): void {
  if (isOwnMutation(mutations)) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(update, 150);
}

export const bazaarTotal: FeatureModule = {
  id: "bazaar-total",

  enable() {
    update();

    observer = new MutationObserver(debouncedUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  },

  disable() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    removeBadge();
  },
};
