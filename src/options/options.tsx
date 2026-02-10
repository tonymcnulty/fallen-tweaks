import { render } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import {
  MODULE_REGISTRY,
  EXTENSION_NAME,
  EXTENSION_VERSION,
  CANDLE_ICON,
} from "@shared/constants";
import type { ModuleInfo } from "@shared/constants";
import { getAllModuleStates, setModuleEnabled, onStorageChanged } from "@shared/storage";

function App() {
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllModuleStates().then((states) => {
      setModuleStates(states);
      setLoaded(true);
    });

    onStorageChanged((changes) => {
      if (changes.moduleStates?.newValue) {
        setModuleStates((prev) => ({ ...prev, ...changes.moduleStates!.newValue }));
      }
    });
  }, []);

  const handleToggle = useCallback(async (moduleId: string, enabled: boolean) => {
    setModuleStates((prev) => ({ ...prev, [moduleId]: enabled }));
    await setModuleEnabled(moduleId, enabled);
  }, []);

  if (!loaded) return null;

  return (
    <div class="options">
      <Header />
      <main class="options-main">
        <div class="options-modules">
          {MODULE_REGISTRY.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              enabled={moduleStates[mod.id] ?? false}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header class="options-header">
      <div class="options-header-left">
        <span class="options-header-icon">{CANDLE_ICON}</span>
        <h1 class="options-header-title">{EXTENSION_NAME}</h1>
      </div>
      <span class="options-header-version">v{EXTENSION_VERSION}</span>
    </header>
  );
}

interface ModuleCardProps {
  module: ModuleInfo;
  enabled: boolean;
  onToggle: (moduleId: string, enabled: boolean) => void;
}

function ModuleCard({ module, enabled, onToggle }: ModuleCardProps) {
  return (
    <div class={`module-card ${enabled ? "module-card--enabled" : ""}`}>
      <div class="module-card-content">
        <h2 class="module-card-title">{module.name}</h2>
        <p class="module-card-description">{module.description}</p>
      </div>
      <label class="module-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(module.id, (e.target as HTMLInputElement).checked)}
        />
        <span class="module-toggle-track" />
      </label>
    </div>
  );
}

function Footer() {
  return (
    <footer class="options-footer">
      <span>
        {CANDLE_ICON} {EXTENSION_NAME}
      </span>
      <span class="options-footer-separator">·</span>
      <span>Not affiliated with Failbetter Games</span>
    </footer>
  );
}

render(<App />, document.getElementById("app")!);
