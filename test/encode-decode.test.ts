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
import { JavaRandom } from "./helpers/java-random.js";
import { encode, encodeToInternational, decode, isNearMultipleBorders } from "../src/codec.js";
import { Point } from "../src/point.js";
import { Mapcode } from "../src/mapcode.js";
import { Territory } from "../src/territory.js";
import { Alphabet } from "../src/alphabet.js";

const NUM_POINTS = 5000;

/**
 * Faithful 1:1 port of EncodeDecodeTest.doEncodeDecode from the Java library
 * (mapcode-java/src/test/java/com/mapcode/EncodeDecodeTest.java).
 *
 * Generates NUM_POINTS uniformly distributed random points from a deterministic
 * java.util.Random (reproduced by JavaRandom). For each point the Java per-thread
 * body is replicated sequentially (Java used a thread pool only as a speedup):
 *
 *  - encodeToInternational vs encode(lat,lon) last-element equivalence
 *  - iterate Territory.values(), encode(lat,lon,territory); for each mapcode:
 *      * territory matches
 *      * for nrDigits 0..8: decode(code, territory), distance < safeMaxOffset,
 *        and re-encode(decoded, territory) reproduces the code (with parent-territory
 *        fallback and the isNearMultipleBorders exception)
 *      * for each Alphabet: convertStringToPlainAscii(getCode(alphabet)) === getCode(0)
 *
 * Accumulates an error count which must be zero.
 */
function runRoundTrip(seed: bigint): number {
  const rng = new JavaRandom(seed);
  let errors = 0;
  for (let i = 0; i < NUM_POINTS; i++) {
    // Encode location.
    const encodePoint = Point.fromUniformlyDistributedRandomPoints(rng);
    const latDeg = encodePoint.getLatDeg();
    const lonDeg = encodePoint.getLonDeg();

    // Check local and international codes.
    const mapcodeInternational = encodeToInternational(latDeg, lonDeg);

    // Check encodeToShortest and encodeToInternational.
    const resultsAll = encode(latDeg, lonDeg);
    expect(resultsAll.length).toBeGreaterThan(0);
    expect(resultsAll[resultsAll.length - 1].equals(mapcodeInternational)).toBe(true);

    for (const territory of Territory.values()) {
      const resultsLimited = encode(latDeg, lonDeg, territory);
      for (const mapcode of resultsLimited) {
        // Check if the territory matches.
        expect(mapcode.getTerritory()).toBe(territory);

        // Check max distance at every nrDigits, and verify encode(decode(m))=m.
        for (let nrDigits = 0; nrDigits <= 8; nrDigits++) {
          const codePrecision = mapcode.getCode(nrDigits);
          let decodeLocation: Point;
          try {
            decodeLocation = decode(codePrecision, territory);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(
              `FAILED Decode(${codePrecision} ${territory.toString()}) generated from (${latDeg}, ${lonDeg}): ${String(e)}`,
            );
            errors++;
            continue;
          }

          const distance = Point.distanceInMeters(encodePoint, decodeLocation);
          if (distance >= Mapcode.getSafeMaxOffsetInMeters(nrDigits)) {
            // eslint-disable-next-line no-console
            console.error(
              `encodeDecodeTest: ${mapcode.toString()} digits = ${nrDigits} distance = ${distance} >= ` +
                `${Mapcode.getSafeMaxOffsetInMeters(nrDigits)}`,
            );
            errors++;
          } else {
            // Check that decode can be encoded back to original.
            const recodedMapcodes = encode(decodeLocation, territory);
            let found = false;
            for (const candidate of recodedMapcodes) {
              if (codePrecision === candidate.getCode(nrDigits)) {
                found = true;
                break;
              }
            }
            if (!found) {
              // Perhaps it was inherited from the parent?
              const parentTerritory = territory.getParentTerritory();
              if (parentTerritory !== null) {
                const recodedMapcodesFromParent = encode(decodeLocation, parentTerritory);
                for (const candidate of recodedMapcodesFromParent) {
                  if (codePrecision === candidate.getCode(nrDigits)) {
                    found = true;
                    break;
                  }
                }
              }
              if (!found) {
                if (!isNearMultipleBorders(decodeLocation, territory)) {
                  // But should be found!
                  // eslint-disable-next-line no-console
                  console.error(
                    `Re-encode${nrDigits} of ${decodeLocation.toString()} failed for ${territory.toString()} ` +
                      `${codePrecision} from (${latDeg},${lonDeg})`,
                  );
                  errors++;
                  for (const candidate of recodedMapcodes) {
                    // eslint-disable-next-line no-console
                    console.info(` * candidate: ${candidate.getCode(nrDigits)}`);
                  }
                }
              }
            }
          }
        }

        // Check conversion from/to alphabets.
        for (const alphabet of Alphabet.values()) {
          const mapcodeAlphabet = mapcode.getCode(alphabet);
          const mapcodeAscii = Mapcode.convertStringToPlainAscii(mapcodeAlphabet);
          if (mapcode.getCode(0) !== mapcodeAscii) {
            // eslint-disable-next-line no-console
            console.error(
              `encodeDecodeTest: ${mapcode.toString()} alphabet=${alphabet.toString()}, ` +
                `original=${mapcode.getCode(0)}, mapcodeAlphabet=${mapcodeAlphabet}, mapcodeAscii=${mapcodeAscii}`,
            );
            errors++;
          }
        }
      }
    }
  }
  return errors;
}

describe("EncodeDecode round-trip", () => {
  it("fixed seed", () => {
    expect(runRoundTrip(1431977987367n)).toBe(0);
  });

  it("random seed", () => {
    const seed = BigInt(Math.floor(Date.now()));
    // eslint-disable-next-line no-console
    console.info(`encodeDecodeTestRandomSeed: seed=${seed}`);
    expect(runRoundTrip(seed)).toBe(0);
  });
});
