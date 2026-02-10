import { describe, it, expect } from "vitest";
import {
  parseQuantity,
  parsePrice,
  parseScripPrice,
  computeTotal,
  formatEchoes,
  formatCurrency,
} from "@modules/bazaar-total";

describe("parseQuantity", () => {
  it("parses a plain number", () => {
    expect(parseQuantity("42")).toBe(42);
  });

  it("parses a comma-separated number", () => {
    expect(parseQuantity("3,966")).toBe(3966);
  });

  it("handles large numbers with multiple commas", () => {
    expect(parseQuantity("1,234,567")).toBe(1234567);
  });

  it("trims whitespace", () => {
    expect(parseQuantity("  100  ")).toBe(100);
  });

  it("returns 0 for non-numeric input", () => {
    expect(parseQuantity("")).toBe(0);
    expect(parseQuantity("abc")).toBe(0);
  });
});

describe("parsePrice", () => {
  it("parses a decimal price", () => {
    expect(parsePrice("0.01")).toBeCloseTo(0.01);
  });

  it("parses a whole number price", () => {
    expect(parsePrice("12")).toBe(12);
  });

  it("parses a larger decimal", () => {
    expect(parsePrice("62.50")).toBeCloseTo(62.5);
  });

  it("trims whitespace", () => {
    expect(parsePrice("  2.50  ")).toBeCloseTo(2.5);
  });

  it("returns 0 for non-numeric input", () => {
    expect(parsePrice("")).toBe(0);
    expect(parsePrice("abc")).toBe(0);
  });
});

describe("parseScripPrice", () => {
  it("parses '1 x Hinterland Scrip'", () => {
    expect(parseScripPrice("1 x Hinterland Scrip")).toBe(1);
  });

  it("parses '2 x Hinterland Scrip'", () => {
    expect(parseScripPrice("2 x Hinterland Scrip")).toBe(2);
  });

  it("handles surrounding text from item desc", () => {
    expect(
      parseScripPrice("Unidentified Thigh Bone 1 x Hinterland Scrip"),
    ).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(parseScripPrice("3 x hinterland scrip")).toBe(3);
  });

  it("returns 0 for non-scrip text", () => {
    expect(parseScripPrice("0.02")).toBe(0);
    expect(parseScripPrice("Drop of Prisoner's Honey")).toBe(0);
    expect(parseScripPrice("")).toBe(0);
  });
});

describe("computeTotal", () => {
  it("returns 0 for an empty list", () => {
    expect(computeTotal([])).toBe(0);
  });

  it("computes a single item total", () => {
    expect(computeTotal([{ quantity: 3966, price: 0.01 }])).toBeCloseTo(39.66);
  });

  it("computes multiple items", () => {
    const items = [
      { quantity: 3966, price: 0.01 },
      { quantity: 10, price: 62.5 },
      { quantity: 1, price: 12.5 },
    ];
    // 39.66 + 625 + 12.5 = 677.16
    expect(computeTotal(items)).toBeCloseTo(677.16);
  });

  it("handles zero quantities", () => {
    expect(computeTotal([{ quantity: 0, price: 100 }])).toBe(0);
  });

  it("handles zero prices", () => {
    expect(computeTotal([{ quantity: 500, price: 0 }])).toBe(0);
  });
});

describe("formatCurrency", () => {
  describe("Echoes", () => {
    it("formats a small value", () => {
      expect(formatCurrency(39.66, "Echoes")).toBe("39.66 Echoes");
    });

    it("formats a whole number", () => {
      expect(formatCurrency(100, "Echoes")).toBe("100.00 Echoes");
    });

    it("adds thousands separators", () => {
      expect(formatCurrency(1234.56, "Echoes")).toBe("1,234.56 Echoes");
    });

    it("handles large numbers", () => {
      expect(formatCurrency(1234567.89, "Echoes")).toBe("1,234,567.89 Echoes");
    });

    it("rounds to two decimal places", () => {
      expect(formatCurrency(0.001, "Echoes")).toBe("0.00 Echoes");
      expect(formatCurrency(0.005, "Echoes")).toBe("0.01 Echoes");
      expect(formatCurrency(1.999, "Echoes")).toBe("2.00 Echoes");
    });

    it("formats zero", () => {
      expect(formatCurrency(0, "Echoes")).toBe("0.00 Echoes");
    });
  });

  describe("Hinterland Scrip", () => {
    it("formats a whole number", () => {
      expect(formatCurrency(50, "Hinterland Scrip")).toBe(
        "50 Hinterland Scrip",
      );
    });

    it("rounds to nearest integer", () => {
      expect(formatCurrency(49.7, "Hinterland Scrip")).toBe(
        "50 Hinterland Scrip",
      );
    });

    it("adds thousands separators", () => {
      expect(formatCurrency(12500, "Hinterland Scrip")).toBe(
        "12,500 Hinterland Scrip",
      );
    });
  });
});

describe("formatEchoes (backwards compat)", () => {
  it("delegates to formatCurrency with Echoes", () => {
    expect(formatEchoes(39.66)).toBe("39.66 Echoes");
    expect(formatEchoes(1234.56)).toBe("1,234.56 Echoes");
  });
});
