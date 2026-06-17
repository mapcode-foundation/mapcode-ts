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
import { JavaRandom } from "./java-random.js";

describe("JavaRandom", () => {
  it("reproduces java.util.Random's first nextDouble() for seed 0", () => {
    // Known value produced by java.util.Random(0).nextDouble() in the JDK.
    expect(new JavaRandom(0n).nextDouble()).toBe(0.730967787376657);
  });

  it("reproduces the full nextDouble() sequence for seed 0", () => {
    const rng = new JavaRandom(0n);
    // First three values of new java.util.Random(0).
    expect(rng.nextDouble()).toBe(0.730967787376657);
    expect(rng.nextDouble()).toBe(0.24053641567148587);
    expect(rng.nextDouble()).toBe(0.6374174253501083);
  });

  it("reproduces the first nextDouble() for seed 42", () => {
    expect(new JavaRandom(42n).nextDouble()).toBe(0.7275636800328681);
  });

  it("accepts a number seed equivalently to a bigint seed", () => {
    expect(new JavaRandom(0).nextDouble()).toBe(new JavaRandom(0n).nextDouble());
  });
});
