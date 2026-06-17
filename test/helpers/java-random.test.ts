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
