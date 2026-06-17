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
import { Encoder } from "../src/encoder.js";
import { Territory } from "../src/territory.js";

// Smoke test for the Encoder in isolation. Expected values are taken directly
// from ../mapcode-java/src/test/java/com/mapcode/EncoderTest.java. The full 1:1
// port of EncoderTest will be done in a later sub-task once codec functions exist.
describe("Encoder smoke test", () => {
  // Source: EncoderTest.encodeWithTerritory (lat=52.376514, lon=4.908542, Territory.NLD).
  it("encodes with territory NLD", () => {
    const results = Encoder.encode(52.376514, 4.908542, Territory.NLD, false);
    expect(results.length).toBe(4);
    expect(results[0].getCodeWithTerritory()).toBe("NLD 49.4V");
    expect(results[1].getCodeWithTerritory()).toBe("NLD G9.VWG");
    expect(results[2].getCodeWithTerritory()).toBe("NLD DL6.H9L");
    expect(results[3].getCodeWithTerritory()).toBe("NLD P25Z.N3Z");
  });

  // Source: EncoderTest.encodeToInterInternationalnational
  // (MapcodeCodec.encodeToInternational(52.5, 5.2) -> "VHYCC.2FWB"), i.e. Territory.AAA.
  it("encodes to international (AAA)", () => {
    const results = Encoder.encode(52.5, 5.2, Territory.AAA, false);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[results.length - 1].getCode()).toBe("VHYCC.2FWB");
  });
});
