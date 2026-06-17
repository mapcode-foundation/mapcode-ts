import { describe, it, expect } from "vitest";
import { Rectangle } from "../src/rectangle.js";
import { Point } from "../src/point.js";

describe("Rectangle", () => {
  it("exposes corners and center", () => {
    const sw = Point.fromDeg(0, 0), ne = Point.fromDeg(2, 4);
    const r = new Rectangle(sw, ne);
    expect(r.getSouthWest()).toBe(sw);
    expect(r.getNorthEast()).toBe(ne);
    expect(r.isDefined()).toBe(true);
    const c = r.getCenter();
    expect(c.getLatDeg()).toBeCloseTo(1, 6);
    expect(c.getLonDeg()).toBeCloseTo(2, 6);
  });
  it("undefined when a corner is undefined", () => {
    const r = new Rectangle(Point.undefined(), Point.fromDeg(1, 1));
    expect(r.isDefined()).toBe(false);
    expect(r.getCenter().isDefined()).toBe(false);
  });
});
