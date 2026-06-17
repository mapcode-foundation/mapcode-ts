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
