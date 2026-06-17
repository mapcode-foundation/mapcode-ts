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
import { readFileSync } from "node:fs";
import { DataModel } from "../src/data-model.js";
import { IncorrectDataModelError } from "../src/errors.js";

const load = (name: string) =>
  new Uint8Array(readFileSync(`test/resources/com/mapcode/${name}`));

describe("DataModel", () => {
  it("loads a valid file", () => {
    expect(() => new DataModel(load("mminfo_ok.dat"))).not.toThrow();
  });
  it("rejects a too-short file", () => {
    expect(() => new DataModel(load("mminfo_too_short.dat"))).toThrow(IncorrectDataModelError);
  });
  it("rejects a file that ends early", () => {
    expect(() => new DataModel(load("mminfo_ends_early.dat"))).toThrow(IncorrectDataModelError);
  });
  it("rejects a file with no header", () => {
    expect(() => new DataModel(load("mminfo_no_header.dat"))).toThrow(IncorrectDataModelError);
  });
  it("rejects a wrong-version file", () => {
    expect(() => new DataModel(load("mminfo_wrong_version.dat"))).toThrow(IncorrectDataModelError);
  });
});
