import { describe, it, expect } from "vitest";
import { Alphabet } from "../src/alphabet.js";
import { Mapcode } from "../src/mapcode.js";
import { Territory } from "../src/territory.js";
import * as MapcodeCodec from "../src/codec.js";
import { UnknownAlphabetError } from "../src/errors.js";

// Ported from AlphabetTest.convertCodeInAlphabet (codec-dependent helper).
function convertCodeInAlphabet(code: string, territory: Territory, alphabet: Alphabet, precision: number): void {
  // Check type.
  const type = Mapcode.getPrecisionFormat(code);
  expect(type, `code = ${code}, type = ${type}`).toBe(precision);

  // Check original code and converted to ASCII point at same location.
  const codeAscii = Mapcode.convertStringToPlainAscii(code);
  const pointCode = MapcodeCodec.decode(code, territory);
  const pointAscii = MapcodeCodec.decode(codeAscii, territory);
  expect(pointCode.equals(pointAscii)).toBe(true);

  // Check if it re-encodes to the same mapcode codes.
  const mapcode = MapcodeCodec.encodeToShortest(pointCode, territory);
  let codeRoman: string;
  let codeAlphabet: string;
  if (Mapcode.containsTerritory(code)) {
    codeRoman = mapcode.getCodeWithTerritory(precision);
    codeAlphabet = mapcode.getCodeWithTerritory(precision, alphabet);
  } else {
    codeRoman = mapcode.getCode(precision);
    codeAlphabet = mapcode.getCode(precision, alphabet);
  }
  expect(codeRoman).toBe(codeAscii);
  expect(codeAlphabet).toBe(code);
}

// Hardcoded ASCII/Greek pairs from AlphabetTest.CODE_TEST_PAIRS (Java).
const CODE_TEST_PAIRS: readonly string[] = [
  "26.53UK", "Α61.328Υ",
  "FR.B016", "ΕΨ1.0716",
  "000.EU", "Α00.23",
  "PQ.YZ", "ΡΘ.57Ζ",
  "PQ.XYZ", "ΡΘ.56ΥΖ",
  "PQR.YZ", "ΡΘ.89ΥΖ",
  "PQ.RXYZ", "ΡΘ3.Χ0ΥΖ",
  "PQR.XYZ", "ΡΘ6.Χ1ΥΖ",
  "PQRX.YZ", "ΡΘ9.Χ2ΥΖ",
  "PQR.SXYZ", "ΡΘ4.ΣΧ9ΥΖ",
  "PQRS.XYZ", "ΡΘ8.ΣΧ9ΥΖ",
  "PQRS.WXYZ", "ΡΘ7Σ.8ΩΧ2Υ",
  "PQRST.WXYZ", "ΡΘ7ΣΤ.8ΩΧ2Υ",
  "P4.YZ", "Ρ4.ΥΖ",
  "PQ.4Z", "ΡΘ.4Ζ",
  "PQ.4YZ", "ΡΘ.26ΥΖ",
  "PQ4.YZ", "ΡΘ4.ΥΖ",
  "PQ.46YZ", "ΡΘ1.61ΥΖ",
  "PQ4.6YZ", "ΡΘ4.6ΥΖ",
  "PQ46.YZ", "ΡΘ46.ΥΖ",
  "PQ4.S6YZ", "ΡΘ2.Σ66ΥΖ",
  "PQ4S.6YZ", "ΡΘ4Σ.6ΥΖ",
  "PQ4S.W6YZ", "ΡΘ4Σ.Ω6ΥΖ",
  "PQ4PQ.6YZ9", "ΡΘ4ΡΘ.6ΥΖ9",
  "PQ.YZ-BCD", "ΡΘ.57Ζ-ΒΞΔ",
  "PQ.XYZ-BCD", "ΡΘ.56ΥΖ-ΒΞΔ",
  "PQR.YZ-BCD", "ΡΘ.89ΥΖ-ΒΞΔ",
  "PQ.RXYZ-BCD", "ΡΘ3.Χ0ΥΖ-ΒΞΔ",
  "PQR.XYZ-BCD", "ΡΘ6.Χ1ΥΖ-ΒΞΔ",
  "PQRX.YZ-BCD", "ΡΘ9.Χ2ΥΖ-ΒΞΔ",
  "PQR.SXYZ-BCD", "ΡΘ4.ΣΧ9ΥΖ-ΒΞΔ",
  "PQRS.XYZ-BCD", "ΡΘ8.ΣΧ9ΥΖ-ΒΞΔ",
  "PQRS.WXYZ-BCD", "ΡΘ7Σ.8ΩΧ2Υ-ΒΞΔ",
  "PQRST.WXYZ-BCD", "ΡΘ7ΣΤ.8ΩΧ2Υ-ΒΞΔ",
  "P4.YZ-BCD", "Ρ4.ΥΖ-ΒΞΔ",
  "PQ.4Z-BCD", "ΡΘ.4Ζ-ΒΞΔ",
  "PQ.4YZ-BCD", "ΡΘ.26ΥΖ-ΒΞΔ",
  "PQ4.YZ-BCD", "ΡΘ4.ΥΖ-ΒΞΔ",
  "PQ.46YZ-BCD", "ΡΘ1.61ΥΖ-ΒΞΔ",
  "PQ4.6YZ-BCD", "ΡΘ4.6ΥΖ-ΒΞΔ",
  "PQ46.YZ-BCD", "ΡΘ46.ΥΖ-ΒΞΔ",
  "PQ4.S6YZ-BCD", "ΡΘ2.Σ66ΥΖ-ΒΞΔ",
  "PQ4S.6YZ-BCD", "ΡΘ4Σ.6ΥΖ-ΒΞΔ",
  "PQ4S.W6YZ-BCD", "ΡΘ4Σ.Ω6ΥΖ-ΒΞΔ",
  "PQ4PQ.6YZ9-BCD", "ΡΘ4ΡΘ.6ΥΖ9-ΒΞΔ",
];

describe("Alphabet", () => {
  it("values are in numeric order", () => {
    const v = Alphabet.values();
    for (let i = 0; i < v.length; i++) expect(v[i].getNumber()).toBe(i);
  });
  it("fromString case-insensitive", () => {
    expect(Alphabet.fromString("greek")).toBe(Alphabet.GREEK);
    expect(Alphabet.fromString("  ROMAN ")).toBe(Alphabet.ROMAN);
  });
  it("fromString numeric throws", () => { expect(() => Alphabet.fromString("1")).toThrow(UnknownAlphabetError); });
  it("fromString empty throws", () => { expect(() => Alphabet.fromString("")).toThrow(UnknownAlphabetError); });
  it("fromString malformed throws", () => { expect(() => Alphabet.fromString("GR1")).toThrow(UnknownAlphabetError); });
  it("fromString out-of-range numeric throws", () => { expect(() => Alphabet.fromString("99")).toThrow(UnknownAlphabetError); });
  it("fromString trailing number throws", () => { expect(() => Alphabet.fromString("GREEK1")).toThrow(UnknownAlphabetError); });

  it("testConvertToAlphabet", () => {
    convertCodeInAlphabet("ΗΠ.22", Territory.GRC, Alphabet.GREEK, 0);
    convertCodeInAlphabet("ΗΠ.22-Φ2", Territory.GRC, Alphabet.GREEK, 2);
    convertCodeInAlphabet("GRC ΗΠ.22-Φ2", Territory.GRC, Alphabet.GREEK, 2);

    for (let i = 0; i < CODE_TEST_PAIRS.length; i += 2) {
      const code = CODE_TEST_PAIRS[i];
      const expect_ = CODE_TEST_PAIRS[i + 1];
      const codeGreek = Mapcode.convertStringToAlphabet(code, Alphabet.GREEK);
      expect(codeGreek).toBe(expect_);
      const codeAscii = Mapcode.convertStringToPlainAscii(codeGreek);
      expect(codeAscii).toBe(code);
    }
  });
});
