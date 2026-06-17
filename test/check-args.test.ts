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
