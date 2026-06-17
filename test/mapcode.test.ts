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
import { Mapcode } from "../src/mapcode.js";
import { UnknownPrecisionFormatError } from "../src/errors.js";

describe("Mapcode", () => {
  it("checkValidMapcodeFormat", () => {
    expect(Mapcode.isValidMapcodeFormat(" A1.B1")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("A1.B1 ")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat(" A1.B1 ")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("A1.B1")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("a1.B1")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("00.01")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AAA.01")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AAA.BBB")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AAAA.BBB")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AAAA.BBBB")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AAAAA.BBBB")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AA.AA-0")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AA.AA-01")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AA.AA-A")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AA.AA-AA")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AA.AA-Y")).toBe(true);
    expect(Mapcode.isValidMapcodeFormat("AA.AA-1Y")).toBe(true);
  });

  it("checkValidMapcodeFormatUnicode", () => {
    expect(Mapcode.isValidMapcodeFormat("THA จก.ผถฉ๕")).toBe(true); // THA GB.RMH5
    expect(Mapcode.isValidMapcodeFormat("รฉะ จก.ผถฉ๕")).toBe(true); // THA GB.RMH5
  });

  it("checkValidPrecisionFormats", () => {
    expect(Mapcode.getPrecisionFormat("P1.B1")).toBe(0);
    expect(Mapcode.getPrecisionFormat("p1.B1")).toBe(0);
    expect(Mapcode.getPrecisionFormat("00.01")).toBe(0);
    expect(Mapcode.getPrecisionFormat("PPP.01")).toBe(0);
    expect(Mapcode.getPrecisionFormat("PPP.BBB")).toBe(0);
    expect(Mapcode.getPrecisionFormat("PPPP.BBB")).toBe(0);
    expect(Mapcode.getPrecisionFormat("PPPP.BBBB")).toBe(0);
    expect(Mapcode.getPrecisionFormat("PPPPP.BBBB")).toBe(0);
    expect(Mapcode.getPrecisionFormat("PP.PP-0")).toBe(1);
    expect(Mapcode.getPrecisionFormat("PP.PP-01")).toBe(2);
    expect(Mapcode.getPrecisionFormat("PP.PP-P")).toBe(1);
    expect(Mapcode.getPrecisionFormat("PP.PP-PP")).toBe(2);
    expect(Mapcode.getPrecisionFormat("PP.PP-Y")).toBe(1);
    expect(Mapcode.getPrecisionFormat("PP.PP-1Y")).toBe(2);
    expect(Mapcode.getPrecisionFormat("PP.PP-321")).toBe(3);
    expect(Mapcode.getPrecisionFormat("PP.PP-21PQ")).toBe(4);
    expect(Mapcode.getPrecisionFormat("PP.PP-321PQ")).toBe(5);
    expect(Mapcode.getPrecisionFormat("PP.PP-321PQR")).toBe(6);
    expect(Mapcode.getPrecisionFormat("PP.PP-4321PRS")).toBe(7);
    expect(Mapcode.getPrecisionFormat("PP.PP-4321PQRS")).toBe(8);

    // Mapcode may contain correctly formatted (possible incorrect) territory code.
    expect(Mapcode.getPrecisionFormat("NLD XX.XX")).toBe(0);
    expect(Mapcode.getPrecisionFormat("USA-NLD XX.XX")).toBe(0);
    expect(Mapcode.getPrecisionFormat("IN XX.XX")).toBe(0);
    expect(Mapcode.getPrecisionFormat("US-IN XX.XX")).toBe(0);
    expect(Mapcode.getPrecisionFormat("US_IN XX.XX")).toBe(0);
    expect(Mapcode.getPrecisionFormat("RU-IN XX.XX")).toBe(0);
  });

  it("checkInvalidPrecisionFormats", () => {
    expect(Mapcode.isValidMapcodeFormat(null)).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("NL- XX.XX")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("US IN XX.XX")).toBe(false);

    expect(Mapcode.isValidMapcodeFormat("P")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PQ")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PQ.")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat(".P")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat(".PQ")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("P.Q")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("p.Q")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("0.1")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("00.1")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("0.01")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("00.01.")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("00.01.0")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("00.01.00")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("00.01-")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PPPPPP.QQQQ")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PPPPP.QQQQQ")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-1Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-12Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-123Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-1234Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-12345Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-123456Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-1234567Z")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PP.PP-123456789")).toBe(false); // more than 8 extension characters!
    expect(Mapcode.isValidMapcodeFormat("P.PPP")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PPP.P")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("P.PPP-1")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PPP.P-1")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("P.PPP-12")).toBe(false);
    expect(Mapcode.isValidMapcodeFormat("PPP.P-12")).toBe(false);
  });

  it("checkPrecisionFormat1", () => {
    expect(Mapcode.getPrecisionFormat("PP.QQ")).toBe(0);
    expect(Mapcode.getPrecisionFormat("PP.QQ-1")).toBe(1);
    expect(Mapcode.getPrecisionFormat("PP.QQ-12")).toBe(2);
    expect(Mapcode.getPrecisionFormat("PP.QQ-123")).toBe(3);
    expect(Mapcode.getPrecisionFormat("PP.QQ-1234")).toBe(4);
    expect(Mapcode.getPrecisionFormat("PP.QQ-12345")).toBe(5);
    expect(Mapcode.getPrecisionFormat("PP.QQ-123456")).toBe(6);
    expect(Mapcode.getPrecisionFormat("PP.QQ-1234567")).toBe(7);
    expect(Mapcode.getPrecisionFormat("PP.QQ-12345678")).toBe(8);

    expect(Mapcode.getPrecisionFormat("ບທຄ ຫວຄ.ວ3ສ")).toBe(0);
    expect(Mapcode.getPrecisionFormat("ཀཤཕ ན5ཁ5.གར9-ཀ")).toBe(1);
    expect(Mapcode.getPrecisionFormat("ΝΛΔ ΧΦ8.Φ3Ω-Ξ7")).toBe(2);
  });

  it("checkUnknownPrecisionFormatException1", () => {
    expect(() => Mapcode.getPrecisionFormat("ABC")).toThrow(UnknownPrecisionFormatError);
  });

  it("checkUnknownPrecisionFormatException2", () => {
    expect(() => Mapcode.getPrecisionFormat("494.V494V")).toThrow(UnknownPrecisionFormatError);
  });

  it("checkConvertToAscii", () => {
    // Check ASCII characters.
    expect(Mapcode.convertStringToPlainAscii("KM.8K")).toBe("KM.8K");
    expect(Mapcode.convertStringToPlainAscii("HJ.Q2-Z")).toBe("HJ.Q2-Z");
    expect(Mapcode.convertStringToPlainAscii("36228.92UW")).toBe("36228.92UW");
    expect(Mapcode.convertStringToPlainAscii("36228.92UW-TK")).toBe("36228.92UW-TK");
    expect(Mapcode.convertStringToPlainAscii("12345.12EU-12345678")).toBe("12345.12EU-12345678");

    // Check unicode characters.
    expect(Mapcode.convertStringToPlainAscii("ΓΨΞ")).toBe("GRC");
    expect(Mapcode.convertStringToPlainAscii("チナ.8チ")).toBe("KM.8K");
    expect(Mapcode.convertStringToPlainAscii("ΗΠ.Θ2-Б")).toBe("HJ.Q2-Z");
  });
});
