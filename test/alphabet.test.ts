import { describe, it, expect } from "vitest";
import { Alphabet } from "../src/alphabet.js";
import { UnknownAlphabetError } from "../src/errors.js";

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

  // TODO(task-13): port testConvertToAlphabet once Mapcode.getCode(alphabet) exists
});
