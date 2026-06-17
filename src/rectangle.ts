import { Point } from "./point.js";

export class Rectangle {
  private readonly southWest: Point;
  private readonly northEast: Point;
  constructor(southWest: Point, northEast: Point) {
    this.southWest = southWest;
    this.northEast = northEast;
  }
  getSouthWest(): Point { return this.southWest; }
  getNorthEast(): Point { return this.northEast; }
  getCenter(): Point {
    if (!this.isDefined()) return Point.undefined();
    const centerLat = (this.southWest.getLatDeg() + this.northEast.getLatDeg()) / 2.0;
    const centerLon = (this.southWest.getLonDeg() + this.northEast.getLonDeg()) / 2.0;
    return Point.fromDeg(centerLat, centerLon);
  }
  isDefined(): boolean { return this.southWest.isDefined() && this.northEast.isDefined(); }
  toString(): string { return `[${this.southWest}, ${this.northEast}]`; }
  equals(o: unknown): boolean {
    if (this === o) return true;
    if (!(o instanceof Rectangle)) return false;
    return this.southWest.equals(o.southWest) && this.northEast.equals(o.northEast);
  }
}
