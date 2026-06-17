import { describe, it, expect } from "vitest";
import { checkNonnull, checkDefined, checkMapcodeCode } from "../src/check-args.js";
import { Point } from "../src/point.js";
import { IllegalArgumentError } from "../src/errors.js";

describe("CheckArgs", () => {
  it("checkNonnull OK", () => { expect(() => checkNonnull("x", "v")).not.toThrow(); });
  it("checkNonnull throws on null", () => { expect(() => checkNonnull("x", null)).toThrow(IllegalArgumentError); });
  it("checkDefined OK", () => { expect(() => checkDefined("p", Point.fromDeg(1, 2))).not.toThrow(); });
  it("checkDefined throws on undefined point", () => { expect(() => checkDefined("p", Point.undefined())).toThrow(IllegalArgumentError); });
  it("testMapcodeCodeOK", () => { expect(() => checkMapcodeCode("test", "XX.XX")).not.toThrow(); });
  it("testMapcodeCodeError", () => { expect(() => checkMapcodeCode("test", "XX.XX-")).toThrow(IllegalArgumentError); });
});
