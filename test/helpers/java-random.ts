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

import type { Random } from "../../src/random.js";

/**
 * Faithful reproduction of {@code java.util.Random}.
 *
 * Implements the same 48-bit linear congruential generator (LCG) as the JDK,
 * so a fixed seed produces exactly the same sequence of {@code nextDouble()}
 * values as Java. This keeps fixed-seed tests deterministic across the Java
 * and TypeScript ports.
 *
 * The 48-bit multiply exceeds {@code 2^53}, so the seed arithmetic is done in
 * {@code BigInt}. The {@code nextDouble()} mantissa combination stays below
 * {@code 2^53}, so it is computed in regular numbers (exact).
 */
export class JavaRandom implements Random {
  private static readonly MULTIPLIER = 0x5deece66dn;
  private static readonly ADDEND = 0xbn;
  private static readonly MASK = (1n << 48n) - 1n;

  private seed: bigint;

  constructor(seed: bigint | number) {
    this.seed = (BigInt(seed) ^ JavaRandom.MULTIPLIER) & JavaRandom.MASK;
  }

  /** Equivalent to {@code java.util.Random.next(int bits)}. */
  private next(bits: number): number {
    this.seed = (this.seed * JavaRandom.MULTIPLIER + JavaRandom.ADDEND) & JavaRandom.MASK;
    return Number(BigInt.asIntN(32, this.seed >> (48n - BigInt(bits))));
  }

  /** Returns a double in [0.0, 1.0), matching {@code java.util.Random.nextDouble()}. */
  nextDouble(): number {
    const hi = this.next(26);
    const lo = this.next(27);
    return (hi * 2 ** 27 + lo) / 2 ** 53;
  }
}
