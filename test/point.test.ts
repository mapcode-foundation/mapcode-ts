import { describe, it, expect } from "vitest";
import { Point } from "../src/point.js";

const DELTA = 0.000001;

describe("Point", () => {
  it("invalidPoint", () => {
    const point = Point.undefined();
    expect(point.isDefined()).toBe(false);
  });

  it("validPoint", () => {
    const point = Point.fromMicroDeg(2, 1);
    expect(point.isDefined()).toBe(true);

    expect(Point.fromDeg(0, 0).getLatMicroDeg()).toBe(0);
    expect(Point.fromDeg(0, 0).getLonMicroDeg()).toBe(0);

    expect(Point.fromDeg(90, 0).getLatMicroDeg()).toBe(Point.MICRO_DEG_90);
    expect(Point.fromDeg(-90, 0).getLatMicroDeg()).toBe(-Point.MICRO_DEG_90);

    expect(Point.fromDeg(0, 180).getLonMicroDeg()).toBe(-Point.MICRO_DEG_180);
    expect(Point.fromDeg(0, 180).getLonMicroDeg()).toBe(-Point.MICRO_DEG_180);
  });

  it("invalidatedPoint", () => {
    const point = Point.fromMicroDeg(2, 1);
    point.setUndefined();
    expect(point.isDefined()).toBe(false);
  });

  it("pointStored", () => {
    const point = Point.fromMicroDeg(2, 1);
    expect(point.getLonMicroDeg()).toBe(1);
    expect(point.getLatMicroDeg()).toBe(2);
  });

  it("testDegreesLatToMeters", () => {
    expect(Point.degreesLatToMeters(0)).toBe(0);
    expect(Point.degreesLatToMeters(0.5)).toBe(Point.METERS_PER_DEGREE_LAT / 2.0);
    expect(Point.degreesLatToMeters(1)).toBe(Point.METERS_PER_DEGREE_LAT);
    expect(Point.degreesLatToMeters(90)).toBe(Point.METERS_PER_DEGREE_LAT * 90);
    expect(Point.degreesLatToMeters(-90)).toBe(-Point.METERS_PER_DEGREE_LAT * 90);
  });

  it("testDegreesLonToMeters", () => {
    expect(Point.degreesLonToMetersAtLat(0, 0)).toBe(0);
    expect(Point.degreesLonToMetersAtLat(0.5, 0)).toBe(Point.METERS_PER_DEGREE_LON_EQUATOR / 2.0);
    expect(Point.degreesLonToMetersAtLat(1, 0)).toBe(Point.METERS_PER_DEGREE_LON_EQUATOR);
    expect(Point.degreesLonToMetersAtLat(180, 0)).toBe(Point.METERS_PER_DEGREE_LON_EQUATOR * 180);
    expect(Point.degreesLonToMetersAtLat(-180, 0)).toBe(-Point.METERS_PER_DEGREE_LON_EQUATOR * 180);
    expect(Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR / 2.0) - Point.degreesLonToMetersAtLat(1, 60))).toBeLessThan(DELTA);
    expect(Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR / 2.0) - Point.degreesLonToMetersAtLat(1, -60))).toBeLessThan(DELTA);
  });

  it("testMetersToDegreesLon", () => {
    expect(Point.metersToDegreesLonAtLat(0, 0)).toBe(0);
    expect(Point.metersToDegreesLonAtLat(Point.METERS_PER_DEGREE_LON_EQUATOR / 2, 0)).toBe(0.5);
    expect(Point.metersToDegreesLonAtLat(Point.METERS_PER_DEGREE_LON_EQUATOR, 0)).toBe(1);
    expect(Point.metersToDegreesLonAtLat(Point.METERS_PER_DEGREE_LON_EQUATOR * 180, 0)).toBe(180);
    expect(Point.metersToDegreesLonAtLat(Point.METERS_PER_DEGREE_LON_EQUATOR * -180, 0)).toBe(-180);
    expect(Math.abs(2.0 - Point.metersToDegreesLonAtLat(Point.METERS_PER_DEGREE_LON_EQUATOR, 60))).toBeLessThan(DELTA);
    expect(Math.abs(2.0 - Point.metersToDegreesLonAtLat(Point.METERS_PER_DEGREE_LON_EQUATOR, -60))).toBeLessThan(DELTA);
  });

  it("testDistanceInMeters", () => {
    let d: number;
    let delta: number;

    d = Point.distanceInMeters(Point.fromMicroDeg(-500000, 0), Point.fromMicroDeg(500000, 0));
    delta = Math.abs(Point.METERS_PER_DEGREE_LAT - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(80000000, 0), Point.fromMicroDeg(81000000, 0));
    delta = Math.abs(Point.METERS_PER_DEGREE_LAT - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(59000000, 0), Point.fromMicroDeg(61000000, 0));
    delta = Math.abs((Point.METERS_PER_DEGREE_LAT * 2) - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 1000000), Point.fromMicroDeg(0, 0));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 2000000), Point.fromMicroDeg(0, 0));
    delta = Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR * 2) - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 2000000), Point.fromMicroDeg(0, -1000000));
    delta = Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR * 3) - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, -1000000), Point.fromMicroDeg(0, 0));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, -1000000), Point.fromMicroDeg(0, 1000000));
    delta = Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR * 2) - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, -1000000), Point.fromMicroDeg(0, 2000000));
    delta = Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR * 3) - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, -500000), Point.fromMicroDeg(0, 500000));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 80000000), Point.fromMicroDeg(0, 81000000));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(60000000, 80000000), Point.fromMicroDeg(60000000, 81000000));
    delta = Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR / 2.0) - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, -1000000), Point.fromMicroDeg(0, 1000000));
    delta = Math.abs((Point.METERS_PER_DEGREE_LON_EQUATOR * 2) - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 1000000), Point.fromMicroDeg(0, 2000000));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 178000000), Point.fromMicroDeg(0, 179000000));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 179000000), Point.fromMicroDeg(0, Point.MICRO_DEG_180));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, 179500000), Point.fromMicroDeg(0, -179500000));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, -179500000), Point.fromMicroDeg(0, 179500000));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    d = Point.distanceInMeters(Point.fromMicroDeg(0, -179000000), Point.fromMicroDeg(0, -Point.MICRO_DEG_180));
    delta = Math.abs(Point.METERS_PER_DEGREE_LON_EQUATOR - d);
    expect(delta).toBeLessThanOrEqual(DELTA);

    expect(Point.distanceInMeters(Point.fromDeg(0.0, 180.0), Point.fromDeg(0.0, -179.999977))).toBeLessThan(10.0);
    expect(Point.distanceInMeters(Point.fromDeg(0.0, -179.999977), Point.fromDeg(0.0, 180.0))).toBeLessThan(10.0);
  });

  it("testWrap", () => {
    for (let i = 0; i < 5; ++i) {
      expect(Point.fromDeg(0.0, 0.0).wrap().equals(Point.fromDeg(0.0, (i * 360) + 0.0))).toBe(true);

      expect(Point.fromDeg(-90.0, 0.0).wrap().equals(Point.fromDeg(-90.0, (i * 360) + 0.0))).toBe(true);
      expect(Point.fromDeg(-89.99, 0.0).wrap().equals(Point.fromDeg(-89.99, (i * 360) + 0.0))).toBe(true);
      expect(Point.fromDeg(-90.0, 0.0).wrap().equals(Point.fromDeg(-90.01, (i * 360) + 0.0))).toBe(true);

      expect(Point.fromDeg(90.0, 0.0).wrap().equals(Point.fromDeg(90.0, (i * 360) + 0.0))).toBe(true);
      expect(Point.fromDeg(89.99, 0.0).wrap().equals(Point.fromDeg(89.99, (i * 360) + 0.0))).toBe(true);
      expect(Point.fromDeg(90.0, 0.0).wrap().equals(Point.fromDeg(90.01, (i * 360) + 0.0))).toBe(true);

      expect(Point.fromDeg(0.0, -180.0).wrap().equals(Point.fromDeg(0.0, (i * 360) - 180.0))).toBe(true);
      expect(Point.fromDeg(0.0, -179.99).wrap().equals(Point.fromDeg(0.0, (i * 360) - 179.99))).toBe(true);
      expect(Point.fromDeg(0.0, 179.99).wrap().equals(Point.fromDeg(0.0, (i * 360) - 180.01))).toBe(true);

      expect(Point.fromDeg(0.0, -180.0).wrap().equals(Point.fromDeg(0.0, (i * 360) + 180.0))).toBe(true);
      expect(Point.fromDeg(0.0, 179.99).wrap().equals(Point.fromDeg(0.0, (i * 360) + 179.99))).toBe(true);
      expect(Point.fromDeg(0.0, -179.99).wrap().equals(Point.fromDeg(0.0, (i * 360) + 180.01))).toBe(true);
    }

    // Has caused a failure once:
    assertPointOK(Point.fromDeg(1.0e307, 1.0e307));
    assertPointOK(Point.fromDeg(Number.MIN_VALUE, Number.MIN_VALUE));
    assertPointOK(Point.fromDeg(Number.MAX_VALUE, Number.MAX_VALUE));
    assertPointOK(Point.fromDeg(8.988465674311579e307, 6.964924833637635e307));
    assertPointOK(Point.fromDeg(-8.139756926185767e307, 8.15622502365209e307));
  });
});

function assertPointOK(p: Point): void {
  expect(p.getLatDeg()).toBeGreaterThanOrEqual(-90);
  expect(p.getLatDeg()).toBeLessThanOrEqual(90);
  expect(p.getLonDeg()).toBeGreaterThanOrEqual(-180);
  expect(p.getLonDeg()).toBeLessThan(180);
}
