import { describe, it, expect, beforeEach } from "vitest";
import { resetStorage } from "../setup";
import {
  getStorage,
  setStorage,
  isModuleEnabled,
  toggleModule,
  setModuleEnabled,
  getAllModuleStates,
  initializeStorage,
} from "@shared/storage";

beforeEach(() => {
  resetStorage();
});

describe("getStorage / setStorage", () => {
  it("returns default empty object for moduleStates when unset", async () => {
    const states = await getStorage("moduleStates");
    expect(states).toEqual({});
  });

  it("returns default empty array for favouriteQualities when unset", async () => {
    const favs = await getStorage("favouriteQualities");
    expect(favs).toEqual([]);
  });

  it("round-trips a value", async () => {
    await setStorage("moduleStates", { "bazaar-total": true });
    const result = await getStorage("moduleStates");
    expect(result).toEqual({ "bazaar-total": true });
  });
});

describe("isModuleEnabled", () => {
  it("returns false for a module that has no stored state", async () => {
    expect(await isModuleEnabled("bazaar-total")).toBe(false);
  });

  it("returns true when the module is enabled", async () => {
    await setStorage("moduleStates", { "bazaar-total": true });
    expect(await isModuleEnabled("bazaar-total")).toBe(true);
  });
});

describe("toggleModule", () => {
  it("toggles from off to on", async () => {
    const newState = await toggleModule("bazaar-total");
    expect(newState).toBe(true);
    expect(await isModuleEnabled("bazaar-total")).toBe(true);
  });

  it("toggles from on to off", async () => {
    await setStorage("moduleStates", { "bazaar-total": true });
    const newState = await toggleModule("bazaar-total");
    expect(newState).toBe(false);
    expect(await isModuleEnabled("bazaar-total")).toBe(false);
  });
});

describe("setModuleEnabled", () => {
  it("explicitly enables a module", async () => {
    await setModuleEnabled("card-favourites", true);
    expect(await isModuleEnabled("card-favourites")).toBe(true);
  });

  it("explicitly disables a module", async () => {
    await setModuleEnabled("card-favourites", true);
    await setModuleEnabled("card-favourites", false);
    expect(await isModuleEnabled("card-favourites")).toBe(false);
  });
});

describe("getAllModuleStates", () => {
  it("returns all registry modules with defaults", async () => {
    const states = await getAllModuleStates();
    expect(states).toEqual({
      "bazaar-total": false,
      "card-favourites": false,
      "quality-favourites": false,
    });
  });

  it("reflects stored enabled states", async () => {
    await setStorage("moduleStates", { "bazaar-total": true });
    const states = await getAllModuleStates();
    expect(states["bazaar-total"]).toBe(true);
    expect(states["card-favourites"]).toBe(false);
  });
});

describe("initializeStorage", () => {
  it("sets defaults when storage is empty", async () => {
    await initializeStorage();
    const states = await getStorage("moduleStates");
    expect(states).toEqual({
      "bazaar-total": false,
      "card-favourites": false,
      "quality-favourites": false,
    });
  });

  it("does not overwrite existing state", async () => {
    await setStorage("moduleStates", { "bazaar-total": true });
    await initializeStorage();
    const states = await getStorage("moduleStates");
    expect(states["bazaar-total"]).toBe(true);
  });
});
