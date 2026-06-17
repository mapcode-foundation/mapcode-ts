import { describe, it, expect } from "vitest";
import { MapcodeZone } from "../src/mapcode-zone.js";

describe("MapcodeZone", () => {
  it("empty by default", () => { expect(new MapcodeZone().isEmpty()).toBe(true); });
  it("non-empty has a defined center", () => {
    const z = new MapcodeZone();
    z.setFromFractions(0, 0, 810000, 3240000);
    expect(z.isEmpty()).toBe(false);
    expect(z.getCenter().isDefined()).toBe(true);
  });
});
