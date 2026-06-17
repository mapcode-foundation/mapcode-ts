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
