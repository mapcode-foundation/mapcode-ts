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
