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
import * as MapcodeCodec from "../src/codec.js";
import { Mapcode } from "../src/mapcode.js";
import { Point } from "../src/point.js";
import { Territory } from "../src/territory.js";
import { UnknownMapcodeError } from "../src/errors.js";

// 1:1 port of com.mapcode.EncoderTest. Expected values taken verbatim from
// ../mapcode-java/src/test/java/com/mapcode/EncoderTest.java.

// Java assertEquals on List<Mapcode> compares Mapcode.equals (code + territory). We mirror that
// by comparing the getCodeWithTerritory() projections (Mapcode.toString()).
function mapcodeListsEqual(a: Mapcode[], b: Mapcode[]): void {
  expect(a.map((m) => m.toString())).toEqual(b.map((m) => m.toString()));
}

const CIUDAD_JUAREZ = Point.fromDeg(31.7, -106.5);
const VAALS = Point.fromDeg(50.8, 6.0);

describe("EncoderTest", () => {
  it("encodePoint", () => {
    mapcodeListsEqual(MapcodeCodec.encode(52.5, 5.2), MapcodeCodec.encode(Point.fromDeg(52.5, 5.2)));
  });

  it("encodeToInterInternationalnational", () => {
    expect(MapcodeCodec.encodeToInternational(52.5, 5.2).getCode()).toBe("VHYCC.2FWB");
    expect(MapcodeCodec.encodeToInternational(Point.fromDeg(52.5, 5.2)).getCode()).toBe("VHYCC.2FWB");
  });

  it("nearMultipleBorders", () => {
    expect(MapcodeCodec.isNearMultipleBorders(Point.fromDeg(52.175616, 4.577179), Territory.NLD)).toBe(false);
  });

  it("encodeMostResults", () => {
    const lat = 26.904899;
    const lon = 95.138515;

    const results = MapcodeCodec.encode(lat, lon);
    expect(results.length).toBe(21);
    let i = 0;
    expect(results[i++].getCodeWithTerritory()).toBe("MMR 9Z3R.YKP");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-NL WKS.H6");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-NL X57.Q6V");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-NL W7Y.9WBB");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-NL YT0.W584");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-NL XBN8.W4TD");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AR 51.XYW3");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AR W7Y.9WBB");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AR YT0.W584");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AR XBN8.W4TD");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AS SC86.C8");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AS W7Y.9WBB");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AS YT0.W584");
    expect(results[i++].getCodeWithTerritory()).toBe("IN-AS XBN8.W4TD");
    expect(results[i++].getCodeWithTerritory()).toBe("IND W7Y.9WBB");
    expect(results[i++].getCodeWithTerritory()).toBe("IND YT0.W584");
    expect(results[i++].getCodeWithTerritory()).toBe("IND XBN8.W4TD");
    expect(results[i++].getCodeWithTerritory()).toBe("CN-XZ SZW8.2TR");
    expect(results[i++].getCodeWithTerritory()).toBe("CN-XZ KQLF.C2K7");
    expect(results[i++].getCodeWithTerritory()).toBe("CHN KQLF.C2K7");
    expect(results[i++].getCodeWithTerritory()).toBe("AAA PRP60.0RVD");
    expect(i).toBe(results.length);

    // retrieve at different precisions
    i = 0;
    expect(results[i++].getCodeWithTerritory(8)).toBe("MMR 9Z3R.YKP-B4HPXXKP");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-NL WKS.H6-32112113");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-NL X57.Q6V-L4WW00TS");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-NL W7Y.9WBB-NQD30000");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-NL YT0.W584-FL321003");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-NL XBN8.W4TD-WL8H46QJ");
    expect(results[i++].getCodeWithTerritory(4)).toBe("IN-AR 51.XYW3-6DG4");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-AR W7Y.9WBB-NQD30000");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-AR YT0.W584-FL321003");
    expect(results[i++].getCodeWithTerritory(2)).toBe("IN-AR XBN8.W4TD-WL");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-AS SC86.C8-5TQ30000");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-AS W7Y.9WBB-NQD30000");
    expect(results[i++].getCodeWithTerritory(1)).toBe("IN-AS YT0.W584-F");
    expect(results[i++].getCodeWithTerritory(8)).toBe("IN-AS XBN8.W4TD-WL8H46QJ");
    expect(results[i++].getCodeWithTerritory(0)).toBe("IND W7Y.9WBB");
    expect(results[i++].getCodeWithTerritory(2)).toBe("IND YT0.W584-FL");
    expect(results[i++].getCodeWithTerritory(3)).toBe("IND XBN8.W4TD-WL8");
    expect(results[i++].getCodeWithTerritory(7)).toBe("CN-XZ SZW8.2TR-VJFX4DX");
    expect(results[i++].getCodeWithTerritory(8)).toBe("CN-XZ KQLF.C2K7-FG2S8QMK");
    expect(results[i++].getCodeWithTerritory(5)).toBe("CHN KQLF.C2K7-FG2S8");
    expect(results[i++].getCodeWithTerritory(8)).toBe("AAA PRP60.0RVD-VK1X5LHD");
    expect(i).toBe(results.length);
  });

  it("encodeWithTerritory", () => {
    const lat = 52.376514;
    const lon = 4.908542;

    const results = MapcodeCodec.encode(lat, lon, Territory.NLD);
    expect(results.length).toBe(4);
    expect(results[0].getCodeWithTerritory()).toBe("NLD 49.4V");
    expect(results[1].getCodeWithTerritory()).toBe("NLD G9.VWG");
    expect(results[2].getCodeWithTerritory()).toBe("NLD DL6.H9L");
    expect(results[3].getCodeWithTerritory()).toBe("NLD P25Z.N3Z");
  });

  it("encodeWithoutTerritory1", () => {
    const lat = 52.376514;
    const lon = 4.908542;

    const results = MapcodeCodec.encode(lat, lon);
    expect(results.length).toBe(5);
    expect(results[0].getCodeWithTerritory()).toBe("NLD 49.4V");
    expect(results[1].getCodeWithTerritory()).toBe("NLD G9.VWG");
    expect(results[2].getCodeWithTerritory()).toBe("NLD DL6.H9L");
    expect(results[3].getCodeWithTerritory()).toBe("NLD P25Z.N3Z");
    expect(results[4].getCodeWithTerritory()).toBe("AAA VHXGB.1J9J");
  });

  it("encodeWithoutTerritory2", () => {
    const lat = 26.87016;
    const lon = 75.847;

    const results = MapcodeCodec.encode(lat, lon);
    expect(results.length).toBe(10);
    expect(results[0].getCodeWithTerritory()).toBe("IN-RJ XX.XX");
    expect(results[1].getCodeWithTerritory()).toBe("IN-RJ 6X.NHG");
    expect(results[2].getCodeWithTerritory()).toBe("IN-RJ KH9.FGV");
    expect(results[3].getCodeWithTerritory()).toBe("IN-RJ H8M.6FTF");
    expect(results[4].getCodeWithTerritory()).toBe("IN-RJ 8BZ9.D61B");
    expect(results[5].getCodeWithTerritory()).toBe("IN-MP H8M.6FTF");
    expect(results[6].getCodeWithTerritory()).toBe("IN-MP 8BZ9.D61B");
    expect(results[7].getCodeWithTerritory()).toBe("IND H8M.6FTF");
    expect(results[8].getCodeWithTerritory()).toBe("IND 8BZ9.D61B");
    expect(results[9].getCodeWithTerritory()).toBe("AAA PQ0PF.5M1H");
  });

  it("encodeToInternational1", () => {
    const result = MapcodeCodec.encodeToInternational(52.376514, 4.908542);
    expect(result.getCode()).toBe("VHXGB.1J9J");
  });

  it("encodeToInternational2", () => {
    const result = MapcodeCodec.encodeToInternational(26.87016, 75.847);
    expect(result.getCode()).toBe("PQ0PF.5M1H");
  });

  it("encodeToShortest1", () => {
    const result = MapcodeCodec.encodeToShortest(52.376514, 4.908542, Territory.NLD);
    expect(result.getCodeWithTerritory()).toBe("NLD 49.4V");

    // test extremely precise encoding
    let m = MapcodeCodec.encodeToShortest(52.3, 4.908, Territory.fromString("NLD"));
    expect(m.getCodeWithTerritory(8)).toBe("NLD GG.NBC-SHR33333");
    m = MapcodeCodec.encodeToShortest(52.3000004, 4.9080004, Territory.fromString("NLD"));
    expect(m.getCodeWithTerritory(8)).toBe("NLD GG.NBC-SHSS1010");
    m = MapcodeCodec.encodeToShortest(52.299999999, 4.907999999, Territory.fromString("NLD"));
    expect(m.getCodeWithTerritory(8)).toBe("NLD GG.NBC-SHLWXWQB");
    m = MapcodeCodec.encodeToShortest(52.299932, 4.907866, Territory.fromString("NLD"));
    expect(m.getCodeWithTerritory(8)).toBe("NLD GG.NBC-00000000");
    m = MapcodeCodec.encodeToShortest(52.299932, 4.9078659999999, Territory.fromString("NLD"));
    expect(m.getCodeWithTerritory(8)).toBe("NLD GG.N98-45454545");
  });

  it("encodeToShortest2", () => {
    const result = MapcodeCodec.encodeToShortest(26.87016, 75.847, Territory.IN_RJ);
    expect(result.getCodeWithTerritory()).toBe("IN-RJ XX.XX");
  });

  it("encodeToShortest3", () => {
    const result = MapcodeCodec.encodeToShortest(52.376514, 4.908542, Territory.NLD);
    expect(result.getCodeWithTerritory()).toBe("NLD 49.4V");
  });

  it("encodeToShortest4 throws UnknownMapcodeError", () => {
    expect(() => MapcodeCodec.encodeToShortest(26.87016, 75.847, Territory.NLD)).toThrow(UnknownMapcodeError);
  });

  it("legalArguments", () => {
    expect(MapcodeCodec.encode(-90, 0).length).toBe(3); // 2 x ATA and AAA
    expect(MapcodeCodec.encode(-60, 0).length).toBe(2); // ATA and AAA
    expect(MapcodeCodec.encode(90, 0).length).toBe(1); // AAA only
    mapcodeListsEqual(MapcodeCodec.encode(0, -180), MapcodeCodec.encode(0, 180));
    mapcodeListsEqual(MapcodeCodec.encode(-91, 0), MapcodeCodec.encode(-90, 0));
    mapcodeListsEqual(MapcodeCodec.encode(91, 0), MapcodeCodec.encode(90, 0));
    mapcodeListsEqual(MapcodeCodec.encode(0, -181), MapcodeCodec.encode(0, 179));
    mapcodeListsEqual(MapcodeCodec.encode(0, 181), MapcodeCodec.encode(0, -179));
  });

  it("testEncodeCiudadJuarez", () => {
    const mapcodes = MapcodeCodec.encode(CIUDAD_JUAREZ);
    expect(mapcodes.length).toBe(13);
    expect(mapcodes[0].toString()).toBe("MX-CHH 5S.0G");
  });

  it("testEncodeRestrictToCountryISOCountryWithSubdivision", () => {
    const mapcodesMX = MapcodeCodec.encodeRestrictToCountryISO2(CIUDAD_JUAREZ, "MX");
    const mapcodesMX2 = MapcodeCodec.encodeRestrictToCountryISO(CIUDAD_JUAREZ, "MX");
    const mapcodesMEX = MapcodeCodec.encodeRestrictToCountryISO3(CIUDAD_JUAREZ, "MEX");
    const mapcodesMEX2 = MapcodeCodec.encodeRestrictToCountryISO(CIUDAD_JUAREZ, "MEX");
    expect(mapcodesMX.length).toBe(7);
    expect(mapcodesMX2.length).toBe(7);
    expect(mapcodesMEX.length).toBe(7);
    expect(mapcodesMEX2.length).toBe(7);
    expect(mapcodesMX[0].toString()).toBe("MX-CHH 5S.0G");
    expect(mapcodesMX2[0].toString()).toBe("MX-CHH 5S.0G");
    expect(mapcodesMEX[0].toString()).toBe("MX-CHH 5S.0G");
    expect(mapcodesMEX2[0].toString()).toBe("MX-CHH 5S.0G");

    const mapcodesUS = MapcodeCodec.encodeRestrictToCountryISO2(CIUDAD_JUAREZ, "us");
    const mapcodesUS2 = MapcodeCodec.encodeRestrictToCountryISO(CIUDAD_JUAREZ, "us");
    const mapcodesUSA = MapcodeCodec.encodeRestrictToCountryISO3(CIUDAD_JUAREZ, "usa");
    const mapcodesUSA2 = MapcodeCodec.encodeRestrictToCountryISO(CIUDAD_JUAREZ, "usa");
    expect(mapcodesUS.length).toBe(5);
    expect(mapcodesUS2.length).toBe(5);
    expect(mapcodesUSA.length).toBe(5);
    expect(mapcodesUSA2.length).toBe(5);
    expect(mapcodesUS[0].toString()).toBe("US-NM T1DZ.338");
    expect(mapcodesUS2[0].toString()).toBe("US-NM T1DZ.338");
    expect(mapcodesUSA[0].toString()).toBe("US-NM T1DZ.338");
    expect(mapcodesUSA2[0].toString()).toBe("US-NM T1DZ.338");
  });

  it("testEncodeRestrictToCountryISOCountryWithoutSubdivision", () => {
    const mapcodesNL = MapcodeCodec.encodeRestrictToCountryISO2(VAALS, "NL");
    const mapcodesNL2 = MapcodeCodec.encodeRestrictToCountryISO(VAALS, "NL");
    const mapcodesNLD = MapcodeCodec.encodeRestrictToCountryISO3(VAALS, "NLD");
    const mapcodesNLD2 = MapcodeCodec.encodeRestrictToCountryISO(VAALS, "NLD");
    expect(mapcodesNL.length).toBe(2);
    expect(mapcodesNL2.length).toBe(2);
    expect(mapcodesNLD.length).toBe(2);
    expect(mapcodesNLD2.length).toBe(2);
    expect(mapcodesNL[0].toString()).toBe("NLD ZNV.W78");
    expect(mapcodesNL2[0].toString()).toBe("NLD ZNV.W78");
    expect(mapcodesNLD[0].toString()).toBe("NLD ZNV.W78");
    expect(mapcodesNLD2[0].toString()).toBe("NLD ZNV.W78");

    const mapcodesBE = MapcodeCodec.encodeRestrictToCountryISO2(VAALS, "be");
    const mapcodesBE2 = MapcodeCodec.encodeRestrictToCountryISO(VAALS, "be");
    const mapcodesBEL = MapcodeCodec.encodeRestrictToCountryISO3(VAALS, "bel");
    const mapcodesBEL2 = MapcodeCodec.encodeRestrictToCountryISO(VAALS, "bel");
    expect(mapcodesBE.length).toBe(2);
    expect(mapcodesBE2.length).toBe(2);
    expect(mapcodesBEL.length).toBe(2);
    expect(mapcodesBEL2.length).toBe(2);
    expect(mapcodesBE[0].toString()).toBe("BEL DRQ.PNK");
    expect(mapcodesBE2[0].toString()).toBe("BEL DRQ.PNK");
    expect(mapcodesBEL[0].toString()).toBe("BEL DRQ.PNK");
    expect(mapcodesBEL2[0].toString()).toBe("BEL DRQ.PNK");
  });

  it("testEncodeRestrictToCountryISOForAll", () => {
    for (const territory of Territory.values()) {
      if (territory.toString() !== "AAA") {
        let countryISO3: string;
        const parent = territory.getParentTerritory();
        if (parent === null) {
          countryISO3 = territory.toString();
        } else {
          countryISO3 = parent.toString();
        }
        const countryISO2 = Territory.getCountryISO2FromISO3(countryISO3);
        expect(MapcodeCodec.encodeRestrictToCountryISO2(CIUDAD_JUAREZ, countryISO2)).not.toBeNull();
        expect(MapcodeCodec.encodeRestrictToCountryISO3(CIUDAD_JUAREZ, countryISO3)).not.toBeNull();
      }
    }
  });
});
