/**
 * Vitest setup — mocks the Chrome extension APIs.
 */

const store: Record<string, unknown> = {};
const listeners: Array<
  (
    changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
    areaName: string,
  ) => void
> = [];

const chromeMock = {
  storage: {
    sync: {
      get: async (keys: string | string[]) => {
        const keyList = typeof keys === "string" ? [keys] : keys;
        const result: Record<string, unknown> = {};
        for (const key of keyList) {
          if (key in store) {
            result[key] = structuredClone(store[key]);
          }
        }
        return result;
      },
      set: async (items: Record<string, unknown>) => {
        const changes: Record<
          string,
          { oldValue?: unknown; newValue?: unknown }
        > = {};
        for (const [key, value] of Object.entries(items)) {
          changes[key] = {
            oldValue: store[key] ? structuredClone(store[key]) : undefined,
            newValue: structuredClone(value),
          };
          store[key] = structuredClone(value);
        }
        for (const listener of listeners) {
          listener(changes, "sync");
        }
      },
    },
    onChanged: {
      addListener: (
        fn: (
          changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
          areaName: string,
        ) => void,
      ) => {
        listeners.push(fn);
      },
      removeListener: (
        fn: (
          changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
          areaName: string,
        ) => void,
      ) => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
      },
    },
  },
  runtime: {
    openOptionsPage: () => Promise.resolve(),
  },
};

// Expose as global `chrome`
Object.defineProperty(globalThis, "chrome", {
  value: chromeMock,
  writable: true,
});

/** Helper to reset storage between tests. */
export function resetStorage(): void {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
  listeners.length = 0;
}
