import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Fallen Tweaks",
  description:
    "UI tweaks for advanced Fallen London players. Not affiliated with Failbetter Games.",
  version: "0.1.0",
  permissions: ["storage"],
  action: {
    default_popup: "src/popup/popup.html",
    default_icon: {
      16: "src/assets/icon-16.png",
      48: "src/assets/icon-48.png",
      128: "src/assets/icon-128.png",
    },
  },
  icons: {
    16: "src/assets/icon-16.png",
    48: "src/assets/icon-48.png",
    128: "src/assets/icon-128.png",
  },
  background: {
    service_worker: "src/background/service-worker.ts",
  },
  content_scripts: [
    {
      matches: ["https://www.fallenlondon.com/*"],
      js: ["src/content/index.ts"],
    },
  ],
  options_page: "src/options/options.html",
});
