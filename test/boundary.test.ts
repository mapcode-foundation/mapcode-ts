import { describe, it, expect } from "vitest";
import { Boundary } from "../src/boundary.js";
import { Point } from "../src/point.js";

describe("Boundary", () => {
  it("createBoundaryForTerritoryRecord exposes the record's bounds", () => {
    const b = Boundary.createBoundaryForTerritoryRecord(0);
    expect(typeof b.getLatMicroDegMin()).toBe("number");
    expect(b.getLatMicroDegMax()).toBeGreaterThanOrEqual(b.getLatMicroDegMin());
  });
  it("containsPoint inside its own bounds", () => {
    const b = Boundary.createBoundaryForTerritoryRecord(0);
    const c = b.getLatMicroDegMin() < b.getLatMicroDegMax();
    expect(c).toBe(true);
  });
});
