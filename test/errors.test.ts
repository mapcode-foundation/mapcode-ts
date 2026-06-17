import { describe, it, expect } from "vitest";
import {
  IllegalArgumentError, IllegalStateError, UnknownMapcodeError,
  UnknownTerritoryError, UnknownAlphabetError, UnknownPrecisionFormatError,
  UnknownDecodeError, IncorrectDataModelError,
} from "../src/errors.js";

describe("errors", () => {
  it("set message and name", () => {
    const e = new UnknownMapcodeError("boom");
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe("boom");
    expect(e.name).toBe("UnknownMapcodeError");
  });
  it("territory/alphabet/precision errors are IllegalArgumentError", () => {
    expect(new UnknownTerritoryError("x")).toBeInstanceOf(IllegalArgumentError);
    expect(new UnknownAlphabetError("x")).toBeInstanceOf(IllegalArgumentError);
    expect(new UnknownPrecisionFormatError("x")).toBeInstanceOf(IllegalArgumentError);
  });
  it("decode/datamodel errors are IllegalStateError", () => {
    expect(new UnknownDecodeError("x")).toBeInstanceOf(IllegalStateError);
    expect(new IncorrectDataModelError("x")).toBeInstanceOf(IllegalStateError);
  });
  it("UnknownTerritoryError carries an optional code", () => {
    expect(new UnknownTerritoryError("x").getCode()).toBeNull();
    expect(new UnknownTerritoryError(42).getCode()).toBe(42);
  });
});
