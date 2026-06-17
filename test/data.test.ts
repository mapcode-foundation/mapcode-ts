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
