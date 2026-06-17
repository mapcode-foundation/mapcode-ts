import { Point } from "./point.js";
import { Boundary } from "./boundary.js";

export class MapcodeZone {
  private lonFractionMin: number;
  private lonFractionMax: number;
  private latFractionMin: number;
  private latFractionMax: number;

  constructor(latFractionMin = 0.0, latFractionMax = 0.0, lonFractionMin = 0.0, lonFractionMax = 0.0) {
    this.latFractionMin = latFractionMin;
    this.latFractionMax = latFractionMax;
    this.lonFractionMin = lonFractionMin;
    this.lonFractionMax = lonFractionMax;
  }

  static copy(z: MapcodeZone): MapcodeZone {
    return new MapcodeZone(z.latFractionMin, z.latFractionMax, z.lonFractionMin, z.lonFractionMax);
  }

  getLonFractionMin(): number { return this.lonFractionMin; }
  getLonFractionMax(): number { return this.lonFractionMax; }
  getLatFractionMin(): number { return this.latFractionMin; }
  getLatFractionMax(): number { return this.latFractionMax; }
  setLonFractionMin(v: number): void { this.lonFractionMin = v; }
  setLonFractionMax(v: number): void { this.lonFractionMax = v; }
  setLatFractionMin(v: number): void { this.latFractionMin = v; }
  setLatFractionMax(v: number): void { this.latFractionMax = v; }

  setFromFractions(latFraction: number, lonFraction: number, latFractionDelta: number, lonFractionDelta: number): void {
    this.lonFractionMin = lonFraction;
    this.lonFractionMax = lonFraction + lonFractionDelta;
    if (latFractionDelta < 0) {
      this.latFractionMin = latFraction + 1 + latFractionDelta;
      this.latFractionMax = latFraction + 1;
    } else {
      this.latFractionMin = latFraction;
      this.latFractionMax = latFraction + latFractionDelta;
    }
  }

  isEmpty(): boolean {
    return this.lonFractionMax <= this.lonFractionMin || this.latFractionMax <= this.latFractionMin;
  }

  getCenter(): Point {
    if (this.isEmpty()) return Point.undefined();
    const latFrac = Math.floor((this.latFractionMin + this.latFractionMax) / 2.0);
    const lonFrac = Math.floor((this.lonFractionMin + this.lonFractionMax) / 2.0);
    return Point.fromLatLonFractions(latFrac, lonFrac);
  }

  restrictZoneTo(area: Boundary): MapcodeZone {
    const z = new MapcodeZone(this.latFractionMin, this.latFractionMax, this.lonFractionMin, this.lonFractionMax);
    const latMin = area.getLatMicroDegMin() * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
    if (z.latFractionMin < latMin) z.latFractionMin = latMin;
    const latMax = area.getLatMicroDegMax() * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
    if (z.latFractionMax > latMax) z.latFractionMax = latMax;
    if (z.latFractionMin < z.latFractionMax) {
      let lonMin = area.getLonMicroDegMin() * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      let lonMax = area.getLonMicroDegMax() * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      if (lonMax < 0 && z.lonFractionMin > 0) {
        lonMin += Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
        lonMax += Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      } else if (lonMin > 1 && z.lonFractionMax < 0) {
        lonMin -= Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
        lonMax -= Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      }
      if (z.lonFractionMin < lonMin) z.lonFractionMin = lonMin;
      if (z.lonFractionMax > lonMax) z.lonFractionMax = lonMax;
    }
    return z;
  }

  toString(): string {
    return this.isEmpty() ? "empty" :
      `[${this.latFractionMin / Point.LAT_TO_FRACTIONS_FACTOR}, ${this.latFractionMax / Point.LAT_TO_FRACTIONS_FACTOR}), [` +
      `${this.lonFractionMin / Point.LON_TO_FRACTIONS_FACTOR}, ${this.lonFractionMax / Point.LON_TO_FRACTIONS_FACTOR})`;
  }
}
