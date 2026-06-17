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
import { MapcodeZone } from "../src/mapcode-zone.js";

describe("MapcodeZone", () => {
  it("empty by default", () => { expect(new MapcodeZone().isEmpty()).toBe(true); });
  it("non-empty has a defined center", () => {
    const z = new MapcodeZone();
    z.setFromFractions(0, 0, 810000, 3240000);
    expect(z.isEmpty()).toBe(false);
    expect(z.getCenter().isDefined()).toBe(true);
  });
});
