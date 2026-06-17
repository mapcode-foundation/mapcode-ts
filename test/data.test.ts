import { describe, it, expect } from "vitest";
import { Data } from "../src/data.js";

describe("Data", () => {
  it("has 34 ENCODE_CHARS", () => {
    expect(Data.ENCODE_CHARS.length).toBe(34);
  });
  it("getCodex(0) returns a number in 1..99", () => {
    const codex = Data.getCodex(0);
    expect(codex).toBeGreaterThanOrEqual(1);
    expect(codex).toBeLessThanOrEqual(99);
  });
});
