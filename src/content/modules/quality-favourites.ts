import { getStorage, setStorage } from "@shared/storage";
import type { FeatureModule } from "./types";

/**
 * Quality Favourites
 *
 * On hover over a quality item, shows a star button on the right side.
 * Favourited qualities are duplicated into a "Favourites" group pinned
 * to the top of the qualities view. The original items remain in place.
 */

const STAR_CLASS = "ft-quality-star";
const STAR_HOVER_CLASS = "ft-quality-star--hover";
const FAV_GROUP_ID = "ft-quality-favourites-group";

let favouriteIds: string[] = [];
let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let bound = false;
let draggedId: string | null = null;

/** Get the branch ID that uniquely identifies a quality. */
function getQualityId(item: Element): string | null {
  const iconEl = item.querySelector("[data-branch-id]");
  return iconEl?.getAttribute("data-branch-id") ?? null;
}

/** Check if a quality is favourited. */
function isFavourite(qualityId: string): boolean {
  return favouriteIds.includes(qualityId);
}

/** Toggle a quality as favourite. */
async function toggleFavourite(qualityId: string): Promise<void> {
  if (isFavourite(qualityId)) {
    favouriteIds = favouriteIds.filter((id) => id !== qualityId);
  } else {
    favouriteIds.push(qualityId);
  }
  await setStorage("favouriteQualities", [...favouriteIds]);
  refreshAll();
}

/** Create a star button for a quality item. */
function createStarButton(qualityId: string, isHover: boolean): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = STAR_CLASS;
  if (isHover) btn.classList.add(STAR_HOVER_CLASS);
  btn.textContent = isFavourite(qualityId) ? "\u2605" : "\u2606"; // ★ or ☆
  btn.classList.toggle("ft-quality-star--active", isFavourite(qualityId));
  btn.title = isFavourite(qualityId)
    ? "Remove from Fallen Tweaks favourites"
    : "Add to Fallen Tweaks favourites";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavourite(qualityId);
  });
  return btn;
}

// ─── Hover star on quality items ──────────────────────────────

function handleMouseEnter(e: Event): void {
  const item = (e.target as HTMLElement).closest(".quality-item") as HTMLElement | null;
  if (!item || item.closest(`#${FAV_GROUP_ID}`)) return;

  const qualityId = getQualityId(item);
  if (!qualityId) return;

  // Already has a hover star
  if (item.querySelector(`.${STAR_HOVER_CLASS}`)) return;

  // Ensure item is positioned for the absolute star
  if (getComputedStyle(item).position === "static") {
    item.style.position = "relative";
  }

  const btn = createStarButton(qualityId, true);
  item.appendChild(btn);
  requestAnimationFrame(() => btn.classList.add("ft-quality-star--visible"));
}

function handleMouseLeave(e: Event): void {
  const item = (e.target as HTMLElement).closest(".quality-item") as HTMLElement | null;
  if (!item) return;

  const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
  if (related && item.contains(related)) return;

  const star = item.querySelector(`.${STAR_HOVER_CLASS}`);
  if (star) {
    star.remove();
    item.style.position = "";
  }
}

function handleSearchInput(): void {
  if (isSearchActive()) {
    removeFavouritesGroup();
  } else {
    buildFavouritesGroup();
  }
}

function bindEvents(): void {
  if (bound) return;
  document.addEventListener("mouseover", handleMouseEnter);
  document.addEventListener("mouseout", handleMouseLeave);
  document.addEventListener("input", handleSearchInput);
  bound = true;
}

function unbindEvents(): void {
  document.removeEventListener("mouseover", handleMouseEnter);
  document.removeEventListener("mouseout", handleMouseLeave);
  document.removeEventListener("input", handleSearchInput);
  bound = false;
}

/** Remove all hover stars. */
function removeHoverStars(): void {
  document.querySelectorAll(`.${STAR_HOVER_CLASS}`).forEach((el) => {
    const item = el.closest(".quality-item") as HTMLElement | null;
    el.remove();
    if (item) item.style.position = "";
  });
}

// ─── Favourites group ─────────────────────────────────────────

/** Check if the search bar has active text. */
function isSearchActive(): boolean {
  const input = document.querySelector<HTMLInputElement>(".input--item-search");
  return !!input && input.value.trim().length > 0;
}

/** Clear all drop indicator classes from favourites items. */
function clearDropIndicators(): void {
  document
    .querySelectorAll(".ft-quality-drop-above, .ft-quality-drop-below")
    .forEach((el) => el.classList.remove("ft-quality-drop-above", "ft-quality-drop-below"));
}

/** Reorder a favourite by moving draggedId relative to targetId. */
async function reorderFavourite(
  movedId: string,
  targetId: string,
  insertBefore: boolean,
): Promise<void> {
  const filtered = favouriteIds.filter((id) => id !== movedId);
  const targetIndex = filtered.indexOf(targetId);
  if (targetIndex === -1) return;

  const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
  filtered.splice(insertIndex, 0, movedId);
  favouriteIds = filtered;
  await setStorage("favouriteQualities", [...favouriteIds]);
  refreshAll();
}

/** Build or update the favourites group at the top of the qualities view. */
function buildFavouritesGroup(): void {
  removeFavouritesGroup();

  if (favouriteIds.length === 0) return;

  // Hide when user is searching to avoid duplicates
  if (isSearchActive()) return;

  // Find the first quality group container to insert before
  const firstGroup = document.querySelector(".quality-group");
  if (!firstGroup) return;

  const parent = firstGroup.parentElement;
  if (!parent) return;

  // Collect favourite items from the page
  const clonedItems: HTMLElement[] = [];
  for (const qualityId of favouriteIds) {
    const original = document.querySelector(
      `.quality-item [data-branch-id="${qualityId}"]`,
    )?.closest(".quality-item") as HTMLElement | null;

    if (!original || original.closest(`#${FAV_GROUP_ID}`)) continue;

    const clone = original.cloneNode(true) as HTMLElement;

    // Remove any hover stars that got cloned
    clone.querySelectorAll(`.${STAR_HOVER_CLASS}`).forEach((el) => el.remove());
    clone.style.position = "";

    // Add an inline star to favourites group items (always visible)
    const starBtn = createStarButton(qualityId, false);
    starBtn.classList.add("ft-quality-star--inline");
    clone.appendChild(starBtn);

    // Make draggable
    clone.draggable = true;
    clone.dataset.ftQualityId = qualityId;
    clone.classList.add("ft-quality-draggable");

    clone.addEventListener("dragstart", (e) => {
      draggedId = qualityId;
      clone.classList.add("ft-quality-dragging");
      e.dataTransfer!.effectAllowed = "move";
      e.dataTransfer!.setData("text/plain", qualityId);
    });

    clone.addEventListener("dragend", () => {
      draggedId = null;
      clone.classList.remove("ft-quality-dragging");
      clearDropIndicators();
    });

    clone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = "move";
      if (!draggedId || draggedId === qualityId) return;

      clearDropIndicators();
      const rect = clone.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        clone.classList.add("ft-quality-drop-above");
      } else {
        clone.classList.add("ft-quality-drop-below");
      }
    });

    clone.addEventListener("dragleave", () => {
      clone.classList.remove("ft-quality-drop-above", "ft-quality-drop-below");
    });

    clone.addEventListener("drop", async (e) => {
      e.preventDefault();
      if (!draggedId || draggedId === qualityId) return;

      const rect = clone.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertBefore = e.clientY < midY;

      await reorderFavourite(draggedId, qualityId, insertBefore);
      draggedId = null;
      clearDropIndicators();
    });

    clonedItems.push(clone);
  }

  if (clonedItems.length === 0) return;

  // Build the group container
  const group = document.createElement("div");
  group.id = FAV_GROUP_ID;
  group.className = "quality-group ft-favourites-group";

  const headerWrapper = document.createElement("div");
  headerWrapper.className = "ft-favourites-group__header-wrap";

  const header = document.createElement("span");
  header.className = "ft-favourites-group__header";
  header.textContent = "\u2605 Favourites";
  header.title =
    "Fallen Tweaks — Quality Favourites\nYour pinned qualities, gathered in one place.";

  headerWrapper.appendChild(header);

  const list = document.createElement("ul");
  list.className = "items items--list quality-group__items";

  for (const item of clonedItems) {
    list.appendChild(item);
  }

  group.appendChild(headerWrapper);
  group.appendChild(list);

  parent.insertBefore(group, firstGroup);
}

/** Remove the favourites group. */
function removeFavouritesGroup(): void {
  document.getElementById(FAV_GROUP_ID)?.remove();
}

/** Full refresh. */
function refreshAll(): void {
  buildFavouritesGroup();
}

/** Check whether all mutations originated from our own elements. */
function isOwnMutation(mutations: MutationRecord[]): boolean {
  return mutations.every((m) => {
    const target = m.target as HTMLElement;
    if (target.id === FAV_GROUP_ID || target.closest?.(`#${FAV_GROUP_ID}`)) {
      return true;
    }
    if (target.classList?.contains(STAR_CLASS)) return true;
    if (
      m.type === "childList" &&
      Array.from(m.addedNodes)
        .concat(Array.from(m.removedNodes))
        .every(
          (n) =>
            n instanceof HTMLElement &&
            (n.classList.contains(STAR_CLASS) || n.id === FAV_GROUP_ID),
        )
    ) {
      return true;
    }
    return false;
  });
}

export const qualityFavourites: FeatureModule = {
  id: "quality-favourites",

  async enable() {
    document.body.classList.add("ft-quality-favourites-active");
    favouriteIds = await getStorage("favouriteQualities");
    refreshAll();
    bindEvents();

    observer = new MutationObserver((mutations) => {
      if (isOwnMutation(mutations)) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refreshAll, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  disable() {
    document.body.classList.remove("ft-quality-favourites-active");
    unbindEvents();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    removeHoverStars();
    removeFavouritesGroup();
    favouriteIds = [];
  },
};
