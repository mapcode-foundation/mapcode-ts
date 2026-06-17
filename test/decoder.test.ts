import { describe, it, expect } from "vitest";
import { DECODE_CHARS, ASCII2LANGUAGE, UNICODE2ASCII } from "../src/alphabet-converter.js";

// Ported from DecoderTest.java: the three lookup-table tests.

describe("Decoder tables", () => {
  it("tableDecodeChars", () => {
    expect(DECODE_CHARS.length).toBe(256);
  });

  it("tableAscii2Language", () => {
    // ASCII2LANGUAGE.length == UNICODE2ASCII.length - 10 (digit rows) - 3 (lowercase rows).
    expect(ASCII2LANGUAGE.length).toBe(UNICODE2ASCII.length - 10 - 3);
    for (let i = 0; i < ASCII2LANGUAGE.length; i++) {
      expect(ASCII2LANGUAGE[i].length, `At row ${i}`).toBe(36);
    }
  });

  it("tableUnicodeToAscii", () => {
    for (const [min, max, convert] of UNICODE2ASCII) {
      expect(convert.length, `Error at: u${min.toString(16)}`).toBe(max - min + 1);
    }
  });
});
