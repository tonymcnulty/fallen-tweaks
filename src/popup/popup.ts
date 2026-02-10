import { MODULE_REGISTRY } from "@shared/constants";
import { getAllModuleStates, setModuleEnabled, onStorageChanged } from "@shared/storage";

async function init(): Promise<void> {
  const list = document.getElementById("module-list")!;
  const states = await getAllModuleStates();

  for (const mod of MODULE_REGISTRY) {
    const li = document.createElement("li");
    li.className = "popup-module";

    const name = document.createElement("span");
    name.className = "popup-module-name";
    name.textContent = mod.name;

    const toggle = document.createElement("label");
    toggle.className = "popup-toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = states[mod.id] ?? false;
    input.dataset.moduleId = mod.id;

    const track = document.createElement("span");
    track.className = "popup-toggle-track";

    input.addEventListener("change", async () => {
      await setModuleEnabled(mod.id, input.checked);
    });

    toggle.appendChild(input);
    toggle.appendChild(track);
    li.appendChild(name);
    li.appendChild(toggle);
    list.appendChild(li);
  }

  // Keep toggles in sync if changed elsewhere (e.g. options page)
  onStorageChanged((changes) => {
    if (!changes.moduleStates?.newValue) return;
    const newStates = changes.moduleStates.newValue;
    const inputs = list.querySelectorAll<HTMLInputElement>("input[data-module-id]");
    for (const input of inputs) {
      const id = input.dataset.moduleId!;
      input.checked = newStates[id] ?? false;
    }
  });

  // Settings button
  document.getElementById("settings-btn")!.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

init();
