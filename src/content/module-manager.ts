import { getStorage, onStorageChanged } from "@shared/storage";
import type { FeatureModule } from "./modules/types";

/**
 * Manages the lifecycle of feature modules.
 *
 * Reads initial enabled/disabled state from storage, activates the
 * appropriate modules, and listens for real-time toggle changes from
 * the popup or options page.
 */
class ModuleManager {
  private modules = new Map<string, FeatureModule>();
  private activeModules = new Set<string>();

  /** Register a module. Does not enable it — call `initialize()` after all registrations. */
  register(module: FeatureModule): void {
    if (this.modules.has(module.id)) {
      console.warn(`[Fallen Tweaks] Module "${module.id}" already registered.`);
      return;
    }
    this.modules.set(module.id, module);
  }

  /** Read stored state, enable active modules, and start listening for changes. */
  async initialize(): Promise<void> {
    const states = await getStorage("moduleStates");

    for (const [id, module] of this.modules) {
      if (states[id]) {
        this.enableModule(module);
      }
    }

    onStorageChanged((changes) => {
      if (!changes.moduleStates?.newValue) return;

      const newStates = changes.moduleStates.newValue;
      const oldStates = changes.moduleStates.oldValue ?? {};

      for (const [id, module] of this.modules) {
        const wasEnabled = oldStates[id] ?? false;
        const isEnabled = newStates[id] ?? false;

        if (isEnabled && !wasEnabled) {
          this.enableModule(module);
        } else if (!isEnabled && wasEnabled) {
          this.disableModule(module);
        }
      }
    });
  }

  private async enableModule(module: FeatureModule): Promise<void> {
    if (this.activeModules.has(module.id)) return;

    try {
      await module.enable();
      this.activeModules.add(module.id);
      console.log(`[Fallen Tweaks] Enabled: ${module.id}`);
    } catch (err) {
      console.error(`[Fallen Tweaks] Failed to enable "${module.id}":`, err);
    }
  }

  private disableModule(module: FeatureModule): void {
    if (!this.activeModules.has(module.id)) return;

    try {
      module.disable();
      this.activeModules.delete(module.id);
      console.log(`[Fallen Tweaks] Disabled: ${module.id}`);
    } catch (err) {
      console.error(`[Fallen Tweaks] Failed to disable "${module.id}":`, err);
    }
  }
}

export const moduleManager = new ModuleManager();
