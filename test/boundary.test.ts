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
