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
import { Decoder } from "../src/decoder.js";
import { Territory } from "../src/territory.js";
import { Point } from "../src/point.js";

// Smoke vectors taken directly from DecoderTest.java
// (decodeMapcodeWithTerritory / decodeWithTerritoryUnicode / hi-precision /
//  decodeToRectangle / decodeInternational). These exercise Decoder.decodeToMapcodeZone
// directly, without needing the codec layer (Task 13). Expected coordinates are the
// exact microdeg values asserted in DecoderTest.java.

function decodeCenter(mapcode: string, territory: Territory): Point {
  return Decoder.decodeToMapcodeZone(mapcode, territory).getCenter();
}

describe("Decoder smoke vectors", () => {
  it("decodes 49.4V with NLD", () => {
    // DecoderTest.decodeMapcodeWithTerritory: lat=52376514, lon=4908543 (microdeg).
    const center = decodeCenter("49.4V", Territory.NLD);
    const expected = Point.fromMicroDeg(52376514, 4908543);
    expect(Point.distanceInMeters(center, expected)).toBeLessThan(1.0);
    expect(center.getLatMicroDeg()).toBe(52376514);
    expect(center.getLonMicroDeg()).toBe(4908543);
  });

  it("decodes hi-precision 49.4V-K2 with NLD", () => {
    // DecoderTest.decodeMapcodeWithTerritoryAndPrecisionPostfix: lat=52376512, lon=4908540.
    const center = decodeCenter("49.4V-K2", Territory.NLD);
    expect(center.getLatMicroDeg()).toBe(52376512);
    expect(center.getLonMicroDeg()).toBe(4908540);
  });

  it("decodes international XXXXX.1234 with AAA", () => {
    // DecoderTest.decodeInternational: lat=59596312, lon=155931892.
    const center = decodeCenter("XXXXX.1234", Territory.AAA);
    expect(center.getLatMicroDeg()).toBe(59596312);
    expect(center.getLonMicroDeg()).toBe(155931892);
  });

  it("decodes international VHXGB.1J9J with AAA (rectangle center)", () => {
    // DecoderTest.decodeToRectangle: southWest=(52.376483,4.908505), northEast=(52.376525,4.908566).
    const center = decodeCenter("VHXGB.1J9J", Territory.AAA);
    const sw = Point.fromDeg(52.376483, 4.908505);
    const ne = Point.fromDeg(52.376525, 4.908566);
    const expectedCenter = Point.fromDeg(
      (sw.getLatDeg() + ne.getLatDeg()) / 2,
      (sw.getLonDeg() + ne.getLonDeg()) / 2,
    );
    expect(Point.distanceInMeters(center, expectedCenter)).toBeLessThan(3.0);
  });
});
