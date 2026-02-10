export const EXTENSION_NAME = "Fallen Tweaks";
export const EXTENSION_VERSION = "0.1.0";
export const CANDLE_ICON = "\u{1F56F}\u{FE0F}";

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
}

/**
 * Central registry of all available feature modules.
 * Add new modules here — the popup and options page read from this list.
 */
export const MODULE_REGISTRY: ModuleInfo[] = [
  {
    id: "bazaar-total",
    name: "Bazaar Total Value",
    description: "Shows the total value of your items when selling at the Bazaar.",
  },
  {
    id: "card-favourites",
    name: "Opportunity Card Favourites",
    description:
      "Mark opportunity cards as favourites or ones to avoid. Favourites are highlighted; avoided cards are dimmed.",
  },
  {
    id: "quality-favourites",
    name: "Quality Favourites",
    description:
      "Pin your favourite qualities to the top of each category list for quick access.",
  },
];
