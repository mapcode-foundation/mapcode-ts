import { describe, it, expect } from "vitest";
import { encode, decode, Territory, Alphabet, Point } from "../src/index.js";

describe("public API", () => {
  it("encodes and decodes a known point", () => {
    const results = encode(52.376514, 4.908542, Territory.NLD);
    expect(results.length).toBeGreaterThan(0);
    const p = decode(results[0].getCodeWithTerritory());
    expect(Point.distanceInMeters(p, Point.fromDeg(52.376514, 4.908542))).toBeLessThan(10);
  });
  it("exposes enums", () => {
    expect(Alphabet.GREEK.getNumber()).toBe(1);
    expect(Territory.AAA).toBeDefined();
  });
});
