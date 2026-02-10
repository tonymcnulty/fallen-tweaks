import { initializeStorage } from "@shared/storage";

/** Initialize storage defaults on first install. */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await initializeStorage();
  }
});
