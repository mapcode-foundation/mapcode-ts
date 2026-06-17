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
