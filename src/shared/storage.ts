import { MODULE_REGISTRY } from "./constants";

/** Keys used in chrome.storage.sync */
export interface StorageSchema {
  /** Module enabled states: { "bazaar-total": true, "card-favourites": false, ... } */
  moduleStates: Record<string, boolean>;
  /** Card favourite/avoid preferences */
  cardPreferences: Record<string, "favourite" | "avoid">;
  /** IDs of favourite qualities */
  favouriteQualities: string[];
}

type StorageKey = keyof StorageSchema;

/** Get a single value from chrome.storage.sync. */
export async function getStorage<K extends StorageKey>(
  key: K,
): Promise<StorageSchema[K]> {
  const result = await chrome.storage.sync.get(key);
  return (result[key] as StorageSchema[K] | undefined) ?? getDefault(key);
}

/** Set a single value in chrome.storage.sync. */
export async function setStorage<K extends StorageKey>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  await chrome.storage.sync.set({ [key]: value });
}

/** Get the enabled state for a specific module. */
export async function isModuleEnabled(moduleId: string): Promise<boolean> {
  const states = await getStorage("moduleStates");
  return states[moduleId] ?? false;
}

/** Toggle a module on or off. Returns the new state. */
export async function toggleModule(moduleId: string): Promise<boolean> {
  const states = await getStorage("moduleStates");
  const newState = !states[moduleId];
  states[moduleId] = newState;
  await setStorage("moduleStates", states);
  return newState;
}

/** Set a module to a specific enabled state. */
export async function setModuleEnabled(
  moduleId: string,
  enabled: boolean,
): Promise<void> {
  const states = await getStorage("moduleStates");
  states[moduleId] = enabled;
  await setStorage("moduleStates", states);
}

/** Get all module states, filling in defaults for any missing entries. */
export async function getAllModuleStates(): Promise<Record<string, boolean>> {
  const states = await getStorage("moduleStates");
  const result: Record<string, boolean> = {};
  for (const mod of MODULE_REGISTRY) {
    result[mod.id] = states[mod.id] ?? false;
  }
  return result;
}

/** Listen for changes to a specific storage key. */
export function onStorageChanged(
  callback: (changes: {
    [K in StorageKey]?: { oldValue?: StorageSchema[K]; newValue?: StorageSchema[K] };
  }) => void,
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
      callback(changes as Parameters<typeof callback>[0]);
    }
  });
}

/** Initialize storage with defaults on first install. */
export async function initializeStorage(): Promise<void> {
  const result = await chrome.storage.sync.get("moduleStates");
  if (!result.moduleStates) {
    const defaults: Record<string, boolean> = {};
    for (const mod of MODULE_REGISTRY) {
      defaults[mod.id] = false;
    }
    await chrome.storage.sync.set({
      moduleStates: defaults,
      cardPreferences: {},
      favouriteQualities: [],
    });
  }
}

function getDefault<K extends StorageKey>(key: K): StorageSchema[K] {
  const defaults: StorageSchema = {
    moduleStates: {},
    cardPreferences: {},
    favouriteQualities: [],
  };
  return defaults[key];
}
