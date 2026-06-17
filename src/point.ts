// Copyright (C) 2026, Stichting Mapcode Foundation (http://www.mapcode.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { IllegalArgumentError } from "./errors.js";
import { DefaultRandom, type Random } from "./random.js";

export class Point {
  static readonly LON_DEG_MIN = -180.0;
  static readonly LON_DEG_MAX = 180.0;
  static readonly LAT_DEG_MIN = -90.0;
  static readonly LAT_DEG_MAX = 90.0;
  static readonly DEG_TO_MICRO_DEG = 1000000;
  static readonly MICRO_DEG_90 = 90 * Point.DEG_TO_MICRO_DEG;
  static readonly MICRO_DEG_180 = 180 * Point.DEG_TO_MICRO_DEG;
  static readonly MICRO_DEG_360 = 360 * Point.DEG_TO_MICRO_DEG;
  static readonly EARTH_RADIUS_X_METERS = 6378137.0;
  static readonly EARTH_RADIUS_Y_METERS = 6356752.3;
  static readonly EARTH_CIRCUMFERENCE_X = Point.EARTH_RADIUS_X_METERS * 2.0 * Math.PI;
  static readonly EARTH_CIRCUMFERENCE_Y = Point.EARTH_RADIUS_Y_METERS * 2.0 * Math.PI;
  static readonly METERS_PER_DEGREE_LAT = Point.EARTH_CIRCUMFERENCE_Y / 360.0;
  static readonly METERS_PER_DEGREE_LON_EQUATOR = Point.EARTH_CIRCUMFERENCE_X / 360.0;

  static readonly MICRODEG_TO_DEG_FACTOR = 1000000.0;
  static readonly MAX_PRECISION_FACTOR = 810000.0;
  static readonly LAT_MICRODEG_TO_FRACTIONS_FACTOR = Point.MAX_PRECISION_FACTOR;
  static readonly LON_MICRODEG_TO_FRACTIONS_FACTOR = Point.MAX_PRECISION_FACTOR * 4;
  static readonly LAT_TO_FRACTIONS_FACTOR = Point.MICRODEG_TO_DEG_FACTOR * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
  static readonly LON_TO_FRACTIONS_FACTOR = Point.MICRODEG_TO_DEG_FACTOR * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;

  private latMicroDeg = 0;
  private lonMicroDeg = 0;
  private latFractionOnlyDeg = 0;
  private lonFractionOnlyDeg = 0;
  private defined: boolean;

  private constructor(latDeg?: number, lonDeg?: number) {
    if (latDeg === undefined || lonDeg === undefined) {
      this.defined = false;
      return;
    }
    let lat = latDeg + 90;
    if (lat < 0) lat = 0;
    else if (lat > 180) lat = 180;
    const fractionRounding = 0.1;
    lat = lat * Point.LAT_TO_FRACTIONS_FACTOR;
    let latFractionOnly = Math.floor(lat + fractionRounding);
    this.latMicroDeg = Math.trunc(latFractionOnly / Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR);
    latFractionOnly = latFractionOnly - this.latMicroDeg * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
    this.latFractionOnlyDeg = Math.trunc(latFractionOnly);
    this.latMicroDeg = this.latMicroDeg - Point.MICRO_DEG_90;

    let lon = Math.min(360.0, Math.max(0.0, lonDeg - 360.0 * Math.floor(lonDeg / 360.0)));
    if (lon === 360.0) lon = 0.0;
    lon = lon * Point.LON_TO_FRACTIONS_FACTOR;
    let lonFractionOnly = Math.floor(lon + fractionRounding);
    this.lonMicroDeg = Math.trunc(lonFractionOnly / Point.LON_MICRODEG_TO_FRACTIONS_FACTOR);
    lonFractionOnly = lonFractionOnly - this.lonMicroDeg * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
    this.lonFractionOnlyDeg = Math.trunc(lonFractionOnly);
    if (this.lonMicroDeg >= Point.MICRO_DEG_180) this.lonMicroDeg = this.lonMicroDeg - Point.MICRO_DEG_360;
    this.defined = true;
  }

  static fromDeg(latDeg: number, lonDeg: number): Point {
    return new Point(latDeg, lonDeg);
  }

  static fromMicroDeg(latMicroDeg: number, lonMicroDeg: number): Point {
    const p = new Point();
    p.latMicroDeg = latMicroDeg;
    p.latFractionOnlyDeg = 0;
    p.lonMicroDeg = lonMicroDeg;
    p.lonFractionOnlyDeg = 0;
    p.defined = true;
    return p.wrap();
  }

  static fromLatLonFractions(latFraction: number, lonFraction: number): Point {
    const p = new Point();
    p.latMicroDeg = Math.floor(latFraction / Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR);
    p.latFractionOnlyDeg = Math.trunc(latFraction - Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR * p.latMicroDeg);
    p.lonMicroDeg = Math.floor(lonFraction / Point.LON_MICRODEG_TO_FRACTIONS_FACTOR);
    p.lonFractionOnlyDeg = Math.trunc(lonFraction - Point.LON_MICRODEG_TO_FRACTIONS_FACTOR * p.lonMicroDeg);
    p.defined = true;
    return p.wrap();
  }

  static undefined(): Point {
    return new Point();
  }

  static fromUniformlyDistributedRandomPoints(random: Random = new DefaultRandom()): Point {
    if (random == null) throw new IllegalArgumentError("Parameter randomGenerator should not be null");
    const unitRand1 = random.nextDouble();
    const unitRand2 = random.nextDouble();
    const theta0 = 2.0 * Math.PI * unitRand1;
    const theta1 = Math.acos(1.0 - 2.0 * unitRand2);
    const x = Math.sin(theta0) * Math.sin(theta1);
    const y = Math.cos(theta0) * Math.sin(theta1);
    const z = Math.cos(theta1);
    const latRad = Math.asin(z);
    const lonRad = Math.atan2(y, x);
    const lat = latRad * (180.0 / Math.PI);
    const lon = lonRad * (180.0 / Math.PI);
    return Point.fromDeg(lat, lon);
  }

  getLatDeg(): number {
    return this.latMicroDeg / Point.MICRODEG_TO_DEG_FACTOR + this.latFractionOnlyDeg / Point.LAT_TO_FRACTIONS_FACTOR;
  }
  getLonDeg(): number {
    return this.lonMicroDeg / Point.MICRODEG_TO_DEG_FACTOR + this.lonFractionOnlyDeg / Point.LON_TO_FRACTIONS_FACTOR;
  }
  getLatMicroDeg(): number { return this.latMicroDeg; }
  getLonMicroDeg(): number { return this.lonMicroDeg; }
  getLatFraction(): number { return this.latFractionOnlyDeg; }
  getLonFraction(): number { return this.lonFractionOnlyDeg; }
  isDefined(): boolean { return this.defined; }
  setUndefined(): void { this.defined = false; }

  wrap(): Point {
    if (this.defined) {
      if (this.latMicroDeg < -Point.MICRO_DEG_90) { this.latMicroDeg = -Point.MICRO_DEG_90; this.latFractionOnlyDeg = 0; }
      if (this.latMicroDeg > Point.MICRO_DEG_90) { this.latMicroDeg = Point.MICRO_DEG_90; this.latFractionOnlyDeg = 0; }
      this.lonMicroDeg %= Point.MICRO_DEG_360;
      if (this.lonMicroDeg >= Point.MICRO_DEG_180) this.lonMicroDeg -= Point.MICRO_DEG_360;
      else if (this.lonMicroDeg < -Point.MICRO_DEG_180) this.lonMicroDeg += Point.MICRO_DEG_360;
    }
    return this;
  }

  static distanceInMeters(p1: Point, p2: Point): number {
    let from: Point, to: Point;
    if (p1.getLonDeg() <= p2.getLonDeg()) { from = p1; to = p2; } else { from = p2; to = p1; }
    const avgLat = (from.getLatDeg() + to.getLatDeg()) / 2.0;
    const deltaLatDeg = Math.abs(to.getLatDeg() - from.getLatDeg());
    const deltaLonDeg360 = Math.abs(to.getLonDeg() - from.getLonDeg());
    const deltaLonDeg = deltaLonDeg360 <= 180.0 ? deltaLonDeg360 : 360.0 - deltaLonDeg360;
    const dx = Point.degreesLonToMetersAtLat(deltaLonDeg, avgLat);
    const dy = Point.degreesLatToMeters(deltaLatDeg);
    return Math.sqrt(dx * dx + dy * dy);
  }

  static degreesLatToMeters(latDegrees: number): number {
    return latDegrees * Point.METERS_PER_DEGREE_LAT;
  }
  static degreesLonToMetersAtLat(lonDegrees: number, lat: number): number {
    return lonDegrees * Point.METERS_PER_DEGREE_LON_EQUATOR * Math.cos((lat * Math.PI) / 180.0);
  }
  static metersToDegreesLonAtLat(eastMeters: number, lat: number): number {
    return (eastMeters / Point.METERS_PER_DEGREE_LON_EQUATOR) / Math.cos((lat * Math.PI) / 180.0);
  }
  static degToMicroDeg(deg: number): number {
    return Math.floor(deg * Point.MICRODEG_TO_DEG_FACTOR);
  }
  static microDegToDeg(microDeg: number): number {
    return microDeg / Point.MICRODEG_TO_DEG_FACTOR;
  }

  toString(): string {
    return this.defined ? `(${this.getLatDeg()}, ${this.getLonDeg()})` : "undefined";
  }
  equals(o: unknown): boolean {
    if (this === o) return true;
    if (!(o instanceof Point)) return false;
    return this.latMicroDeg === o.latMicroDeg && this.lonMicroDeg === o.lonMicroDeg &&
      this.latFractionOnlyDeg === o.latFractionOnlyDeg && this.lonFractionOnlyDeg === o.lonFractionOnlyDeg &&
      this.defined === o.defined;
  }
}
