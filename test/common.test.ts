import { describe, it, expect } from "vitest";
import { Common } from "../src/common.js";

describe("Common", () => {
  it("NC powers of 31", () => {
    expect(Common.NC).toEqual([1, 31, 961, 29791, 923521, 28629151, 887503681]);
  });
  it("X_SIDE / Y_SIDE", () => {
    expect(Common.X_SIDE).toEqual([0, 5, 31, 168, 961, 5208, 29791, 165869, 923521, 5141947]);
    expect(Common.Y_SIDE).toEqual([0, 6, 31, 176, 961, 5456, 29791, 165869, 923521, 5141947]);
  });
  it("xDivider lookups", () => {
    expect(Common.xDivider(0, 1)).toBe(360);          // latMax>=0, latMin... see Java branches
    expect(Common.xDivider(90000000, 90000001)).toBeGreaterThan(0);
  });
});
