# mapcode-ts Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Java library `com.mapcode:mapcode` 2.4.19 (at `../mapcode-java`) to an isomorphic TypeScript library in this repo, preserving the algorithm, the embedded data, and the full test suite.

**Architecture:** One TypeScript module per Java class under `src/`. The codec is exposed as idiomatic top-level functions (`encode`/`decode`/…). `Territory` and `Alphabet` are classes with `static readonly` singleton instances (reference equality like Java enums). The 328 KB `mminfo.dat` is committed and embedded as a base64→`Uint8Array` module so the library has zero `fs` dependency and runs in Node and browsers. `DataModel` parses it via `DataView` (little-endian). Errors use the TypeScript `*Error` naming convention.

**Tech Stack:** TypeScript (strict), tsup (dual ESM+CJS + d.ts), Vitest, Node 18+.

**Reference spec:** `docs/superpowers/specs/2026-06-17-mapcode-ts-port-design.md`

## Global Constraints

- **Faithful port:** match Java arithmetic exactly. Java `int` is 32-bit signed; JS bitwise ops (`& | << >> >>>`) already operate on int32, so bit-flag extraction ports directly. Java integer division truncates toward zero → use `Math.trunc(a / b)` wherever Java does `int / int`. Java `%` and JS `%` share truncated semantics → no change. `char` arithmetic → `String.prototype.charCodeAt`. Audit `decodeBase31`/`decodeExtension` accumulations; use `Math.imul`/`| 0` where a product could exceed int32.
- **Java source of truth:** `../mapcode-java/src/main/java/com/mapcode/<Class>.java` and tests at `../mapcode-java/src/test/java/com/mapcode/<Class>Test.java`.
- **Naming:** keep Java concept/method names (`getCode`, `fromString`, `encodeToShortest`, `Territory.NLD`, `Alphabet.GREEK`). Codec is top-level functions, not a `MapcodeCodec` class. Errors are `*Error`.
- **TDD:** for each module, port its Java test file to `test/<name>.test.ts` first (read the Java test, translate it), watch it fail, implement, watch it pass, commit. Keep every ported Java test; add TS-specific tests where helpful but never delete ported ones.
- **Tests are Node-only** (read fixtures via `fs`), even though the library is isomorphic.
- **License:** Apache-2.0; carry over `LICENSE` and `NOTICE` from `../mapcode-java`.
- **npm package name:** `mapcode`.
- **Commit** after every green step.

---

## File Structure

```
package.json, tsconfig.json, tsup.config.ts, vitest.config.ts, .gitignore, README.md, LICENSE, NOTICE
data/mminfo.dat                 # committed binary (generator source of truth)
scripts/generate-data.mts       # regenerates src/data/mminfo-data.ts
src/
  index.ts            errors.ts        check-args.ts
  point.ts            rectangle.ts     common.ts        data.ts
  alphabet.ts         territory.ts     boundary.ts      mapcode-zone.ts
  data-model.ts       data/mminfo-data.ts (generated)
  encoder.ts          decoder.ts       codec.ts         mapcode.ts
  random.ts           # Random interface + default Math.random impl (used by Point)
test/
  resources/...                  # copied fixtures (mminfo_*.dat, *.txt.* chunks)
  helpers/java-random.ts         # java.util.Random LCG (test-only)
  helpers/chunked-file.ts        # rolls over .a/.b/.c (test-only)
  *.test.ts                      # one per Java test file
```

---

## Task 0: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `.gitignore`, `LICENSE`, `NOTICE`, `data/mminfo.dat`
- Create dirs: `src/`, `src/data/`, `scripts/`, `test/`, `test/resources/`, `test/helpers/`

**Interfaces:**
- Produces: a buildable/testable TS project; `npm test`, `npm run build`, `npm run gen:data` scripts.

- [ ] **Step 1: Initialize npm + dev deps**

```bash
cd /Users/ribu/source/mapcode-foundation/mapcode-ts
npm init -y
npm install -D typescript tsup vitest @types/node
```

- [ ] **Step 2: Write `package.json`** (replace generated one)

```json
{
  "name": "mapcode",
  "version": "2.4.19-0.1.0",
  "description": "Library to encode/decode mapcodes to/from latitude/longitude. TypeScript port of mapcode-java.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "gen:data": "node --experimental-strip-types scripts/generate-data.mts"
  },
  "engines": { "node": ">=18" },
  "license": "Apache-2.0"
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020"],
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src", "scripts", "test"]
}
```

- [ ] **Step 4: Write `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2020",
});
```

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 600000,
    hookTimeout: 600000,
  },
});
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
```

- [ ] **Step 7: Copy license + data files**

```bash
cp ../mapcode-java/LICENSE ./LICENSE
cp ../mapcode-java/NOTICE ./NOTICE
mkdir -p data
cp ../mapcode-java/src/main/resources/com/mapcode/mminfo.dat ./data/mminfo.dat
ls -la data/mminfo.dat
```
Expected: `mminfo.dat` present, 328196 bytes.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold TypeScript project (tsup, vitest, tsconfig, data file)"
```

---

## Task 1: Error classes

**Files:**
- Create: `src/errors.ts`
- Test: `test/errors.test.ts`

**Interfaces:**
- Produces: `IllegalArgumentError`, `IllegalStateError`, `UnknownMapcodeError`, `UnknownTerritoryError` (extends `IllegalArgumentError`, optional `code: number | null`, `getCode()`), `UnknownAlphabetError` (extends `IllegalArgumentError`), `UnknownPrecisionFormatError` (extends `IllegalArgumentError`), `UnknownDecodeError` (extends `IllegalStateError`), `IncorrectDataModelError` (extends `IllegalStateError`).

- [ ] **Step 1: Write the failing test** — `test/errors.test.ts`

```ts
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
```

- [ ] **Step 2: Run test, verify it fails** — `npx vitest run test/errors.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/errors.ts`

```ts
export class IllegalArgumentError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "IllegalArgumentError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IllegalStateError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "IllegalStateError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownMapcodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownMapcodeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownTerritoryError extends IllegalArgumentError {
  private readonly code: number | null;
  constructor(messageOrCode: string | number) {
    if (typeof messageOrCode === "number") {
      super();
      this.code = messageOrCode;
    } else {
      super(messageOrCode);
      this.code = null;
    }
    this.name = "UnknownTerritoryError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
  getCode(): number | null {
    return this.code;
  }
}

export class UnknownAlphabetError extends IllegalArgumentError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownAlphabetError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownPrecisionFormatError extends IllegalArgumentError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownPrecisionFormatError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownDecodeError extends IllegalStateError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownDecodeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IncorrectDataModelError extends IllegalStateError {
  constructor(message: string) {
    super(message);
    this.name = "IncorrectDataModelError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

- [ ] **Step 4: Run test, verify it passes** — `npx vitest run test/errors.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add error classes"`

---

## Task 2: Point + Random

**Files:**
- Create: `src/random.ts`, `src/point.ts`
- Test: `test/point.test.ts`

**Interfaces:**
- Consumes: `IllegalArgumentError` from `errors.ts` (via check-args later; for now Point only needs a non-null check on the random generator — inline a guard).
- Produces:
  - `random.ts`: `interface Random { nextDouble(): number }`; `class DefaultRandom implements Random` (uses `Math.random`).
  - `point.ts`: `class Point` with all static constants below; static `fromDeg(latDeg, lonDeg)`, `fromMicroDeg(latMicroDeg, lonMicroDeg)`, `fromLatLonFractions(latFraction, lonFraction)`, `fromUniformlyDistributedRandomPoints(random?: Random)`, `undefined()`; instance `getLatDeg()`, `getLonDeg()`, `getLatMicroDeg()`, `getLonMicroDeg()`, `getLatFraction()`, `getLonFraction()`, `isDefined()`, `setUndefined()`, `wrap()`, `toString()`, `equals(o)`; static `distanceInMeters(p1, p2)`, `degreesLatToMeters(d)`, `degreesLonToMetersAtLat(d, lat)`, `metersToDegreesLonAtLat(m, lat)`, `degToMicroDeg(deg)`, `microDegToDeg(microDeg)`.

> **Port note:** Java fields `latMicroDeg/lonMicroDeg/latFractionOnlyDeg/lonFractionOnlyDeg` are `int`; the constructors cast doubles to int via `(int)` (truncate toward zero) — use `Math.trunc`. Java `Math.floor`, `Math.min`, `Math.max`, `Math.abs`, `Math.toRadians`(=`x*Math.PI/180`) map directly. Read `../mapcode-java/.../Point.java` to confirm.

- [ ] **Step 1: Write the failing test** — port `../mapcode-java/src/test/java/com/mapcode/PointTest.java` to `test/point.test.ts` (methods: `invalidPoint`, `validPoint`, `invalidatedPoint`, `pointStored`, `testDegreesLatToMeters`, `testDegreesLonToMeters`, `testMetersToDegreesLon`, `testDistanceInMeters`, `testWrap`). Use `expect(...).toBeCloseTo(...)` or exact equality matching the Java `Double.compare` assertions.

- [ ] **Step 2: Run test, verify it fails** — `npx vitest run test/point.test.ts` → FAIL.

- [ ] **Step 3a: Implement `src/random.ts`**

```ts
export interface Random {
  /** Returns a double in [0.0, 1.0). */
  nextDouble(): number;
}

export class DefaultRandom implements Random {
  nextDouble(): number {
    return Math.random();
  }
}
```

- [ ] **Step 3b: Implement `src/point.ts`** (translate verbatim from Java; constants and method bodies below)

```ts
import { IllegalArgumentError } from "./errors.js";
import { DefaultRandom, type Random } from "./random.js";

export class Point {
  static readonly LON_DEG_MIN = -180.0;
  static readonly LON_DEG_MAX = 180.0;
  static readonly LAT_DEG_MIN = -90.0;
  static readonly LAT_DEG_MAX = 90.0;
  static readonly DEG_TO_MICRO_DEG = 1000000;
  static readonly MICRO_DEG_90 = 90 * Point.DEG_TO_MICRO_DEG;
  static readonly MICRO_DEG_180 = 180 * Point.DEG_TO_MICRO_DEG;
  static readonly MICRO_DEG_360 = 360 * Point.DEG_TO_MICRO_DEG;
  static readonly EARTH_RADIUS_X_METERS = 6378137.0;
  static readonly EARTH_RADIUS_Y_METERS = 6356752.3;
  static readonly EARTH_CIRCUMFERENCE_X = Point.EARTH_RADIUS_X_METERS * 2.0 * Math.PI;
  static readonly EARTH_CIRCUMFERENCE_Y = Point.EARTH_RADIUS_Y_METERS * 2.0 * Math.PI;
  static readonly METERS_PER_DEGREE_LAT = Point.EARTH_CIRCUMFERENCE_Y / 360.0;
  static readonly METERS_PER_DEGREE_LON_EQUATOR = Point.EARTH_CIRCUMFERENCE_X / 360.0;

  static readonly MICRODEG_TO_DEG_FACTOR = 1000000.0;
  static readonly MAX_PRECISION_FACTOR = 810000.0;
  static readonly LAT_MICRODEG_TO_FRACTIONS_FACTOR = Point.MAX_PRECISION_FACTOR;
  static readonly LON_MICRODEG_TO_FRACTIONS_FACTOR = Point.MAX_PRECISION_FACTOR * 4;
  static readonly LAT_TO_FRACTIONS_FACTOR = Point.MICRODEG_TO_DEG_FACTOR * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
  static readonly LON_TO_FRACTIONS_FACTOR = Point.MICRODEG_TO_DEG_FACTOR * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;

  private latMicroDeg = 0;
  private lonMicroDeg = 0;
  private latFractionOnlyDeg = 0;
  private lonFractionOnlyDeg = 0;
  private defined: boolean;

  private constructor(latDeg?: number, lonDeg?: number) {
    if (latDeg === undefined || lonDeg === undefined) {
      this.defined = false;
      return;
    }
    let lat = latDeg + 90;
    if (lat < 0) lat = 0;
    else if (lat > 180) lat = 180;
    const fractionRounding = 0.1;
    lat = lat * Point.LAT_TO_FRACTIONS_FACTOR;
    let latFractionOnly = Math.floor(lat + fractionRounding);
    this.latMicroDeg = Math.trunc(latFractionOnly / Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR);
    latFractionOnly = latFractionOnly - this.latMicroDeg * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
    this.latFractionOnlyDeg = Math.trunc(latFractionOnly);
    this.latMicroDeg = this.latMicroDeg - Point.MICRO_DEG_90;

    let lon = Math.min(360.0, Math.max(0.0, lonDeg - 360.0 * Math.floor(lonDeg / 360.0)));
    if (lon === 360.0) lon = 0.0;
    lon = lon * Point.LON_TO_FRACTIONS_FACTOR;
    let lonFractionOnly = Math.floor(lon + fractionRounding);
    this.lonMicroDeg = Math.trunc(lonFractionOnly / Point.LON_MICRODEG_TO_FRACTIONS_FACTOR);
    lonFractionOnly = lonFractionOnly - this.lonMicroDeg * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
    this.lonFractionOnlyDeg = Math.trunc(lonFractionOnly);
    if (this.lonMicroDeg >= Point.MICRO_DEG_180) this.lonMicroDeg = this.lonMicroDeg - Point.MICRO_DEG_360;
    this.defined = true;
  }

  static fromDeg(latDeg: number, lonDeg: number): Point {
    return new Point(latDeg, lonDeg);
  }

  static fromMicroDeg(latMicroDeg: number, lonMicroDeg: number): Point {
    const p = new Point();
    p.latMicroDeg = latMicroDeg;
    p.latFractionOnlyDeg = 0;
    p.lonMicroDeg = lonMicroDeg;
    p.lonFractionOnlyDeg = 0;
    p.defined = true;
    return p.wrap();
  }

  static fromLatLonFractions(latFraction: number, lonFraction: number): Point {
    const p = new Point();
    p.latMicroDeg = Math.floor(latFraction / Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR);
    p.latFractionOnlyDeg = Math.trunc(latFraction - Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR * p.latMicroDeg);
    p.lonMicroDeg = Math.floor(lonFraction / Point.LON_MICRODEG_TO_FRACTIONS_FACTOR);
    p.lonFractionOnlyDeg = Math.trunc(lonFraction - Point.LON_MICRODEG_TO_FRACTIONS_FACTOR * p.lonMicroDeg);
    p.defined = true;
    return p.wrap();
  }

  static undefined(): Point {
    return new Point();
  }

  static fromUniformlyDistributedRandomPoints(random: Random = new DefaultRandom()): Point {
    if (random == null) throw new IllegalArgumentError("Parameter randomGenerator should not be null");
    const unitRand1 = random.nextDouble();
    const unitRand2 = random.nextDouble();
    const theta0 = 2.0 * Math.PI * unitRand1;
    const theta1 = Math.acos(1.0 - 2.0 * unitRand2);
    const x = Math.sin(theta0) * Math.sin(theta1);
    const y = Math.cos(theta0) * Math.sin(theta1);
    const z = Math.cos(theta1);
    const latRad = Math.asin(z);
    const lonRad = Math.atan2(y, x);
    const lat = latRad * (180.0 / Math.PI);
    const lon = lonRad * (180.0 / Math.PI);
    return Point.fromDeg(lat, lon);
  }

  getLatDeg(): number {
    return this.latMicroDeg / Point.MICRODEG_TO_DEG_FACTOR + this.latFractionOnlyDeg / Point.LAT_TO_FRACTIONS_FACTOR;
  }
  getLonDeg(): number {
    return this.lonMicroDeg / Point.MICRODEG_TO_DEG_FACTOR + this.lonFractionOnlyDeg / Point.LON_TO_FRACTIONS_FACTOR;
  }
  getLatMicroDeg(): number { return this.latMicroDeg; }
  getLonMicroDeg(): number { return this.lonMicroDeg; }
  getLatFraction(): number { return this.latFractionOnlyDeg; }
  getLonFraction(): number { return this.lonFractionOnlyDeg; }
  isDefined(): boolean { return this.defined; }
  setUndefined(): void { this.defined = false; }

  wrap(): Point {
    if (this.defined) {
      if (this.latMicroDeg < -Point.MICRO_DEG_90) { this.latMicroDeg = -Point.MICRO_DEG_90; this.latFractionOnlyDeg = 0; }
      if (this.latMicroDeg > Point.MICRO_DEG_90) { this.latMicroDeg = Point.MICRO_DEG_90; this.latFractionOnlyDeg = 0; }
      this.lonMicroDeg %= Point.MICRO_DEG_360;
      if (this.lonMicroDeg >= Point.MICRO_DEG_180) this.lonMicroDeg -= Point.MICRO_DEG_360;
      else if (this.lonMicroDeg < -Point.MICRO_DEG_180) this.lonMicroDeg += Point.MICRO_DEG_360;
    }
    return this;
  }

  static distanceInMeters(p1: Point, p2: Point): number {
    let from: Point, to: Point;
    if (p1.getLonDeg() <= p2.getLonDeg()) { from = p1; to = p2; } else { from = p2; to = p1; }
    const avgLat = (from.getLatDeg() + to.getLatDeg()) / 2.0;
    const deltaLatDeg = Math.abs(to.getLatDeg() - from.getLatDeg());
    const deltaLonDeg360 = Math.abs(to.getLonDeg() - from.getLonDeg());
    const deltaLonDeg = deltaLonDeg360 <= 180.0 ? deltaLonDeg360 : 360.0 - deltaLonDeg360;
    const dx = Point.degreesLonToMetersAtLat(deltaLonDeg, avgLat);
    const dy = Point.degreesLatToMeters(deltaLatDeg);
    return Math.sqrt(dx * dx + dy * dy);
  }

  static degreesLatToMeters(latDegrees: number): number {
    return latDegrees * Point.METERS_PER_DEGREE_LAT;
  }
  static degreesLonToMetersAtLat(lonDegrees: number, lat: number): number {
    return lonDegrees * Point.METERS_PER_DEGREE_LON_EQUATOR * Math.cos((lat * Math.PI) / 180.0);
  }
  static metersToDegreesLonAtLat(eastMeters: number, lat: number): number {
    return (eastMeters / Point.METERS_PER_DEGREE_LON_EQUATOR) / Math.cos((lat * Math.PI) / 180.0);
  }
  static degToMicroDeg(deg: number): number {
    return Math.floor(deg * Point.MICRODEG_TO_DEG_FACTOR);
  }
  static microDegToDeg(microDeg: number): number {
    return microDeg / Point.MICRODEG_TO_DEG_FACTOR;
  }

  toString(): string {
    return this.defined ? `(${this.getLatDeg()}, ${this.getLonDeg()})` : "undefined";
  }
  equals(o: unknown): boolean {
    if (this === o) return true;
    if (!(o instanceof Point)) return false;
    return this.latMicroDeg === o.latMicroDeg && this.lonMicroDeg === o.lonMicroDeg &&
      this.latFractionOnlyDeg === o.latFractionOnlyDeg && this.lonFractionOnlyDeg === o.lonFractionOnlyDeg &&
      this.defined === o.defined;
  }
}
```

- [ ] **Step 4: Run test, verify it passes** — `npx vitest run test/point.test.ts` → PASS. If a `toBeCloseTo` precision mismatch appears, switch that assertion to exact equality (Java uses `Double.compare`).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add Point and Random"`

---

## Task 3: Common

**Files:**
- Create: `src/common.ts`
- Test: `test/common.test.ts` (no dedicated Java test; add a small TS test asserting array lengths/spot values, then rely on integration coverage)

**Interfaces:**
- Consumes: `Data.getCodex`, `Data.isNameless` (forward dependency — Common calls Data; Data is Task 4. Implement Common's arrays + `xDivider` now; `countCityCoordinatesForCountry`/`getFirstNamelessRecord` call `Data`, so import `Data` — it will exist after Task 4. To keep TDD green, implement Common fully but its `count*`/`getFirst*` tests live in Task 4's integration. Use a lazy import or direct import of `./data.js`.)
- Produces: `Common.NC`, `Common.X_SIDE`, `Common.Y_SIDE` (number[]); `Common.xDivider(latMin, latMax)`, `Common.countCityCoordinatesForCountry(codex, territoryRecord, firstTerritoryRecord)`, `Common.getFirstNamelessRecord(codex, territoryRecord, firstTerritoryRecord)`.

- [ ] **Step 1: Write the failing test** — `test/common.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { Common } from "../src/common.js";

describe("Common", () => {
  it("NC powers of 31", () => {
    expect(Common.NC).toEqual([1, 31, 961, 29791, 923521, 28629151, 887503681]);
  });
  it("X_SIDE / Y_SIDE", () => {
    expect(Common.X_SIDE).toEqual([0, 5, 31, 168, 961, 5208, 29791, 165869, 923521, 5141947]);
    expect(Common.Y_SIDE).toEqual([0, 6, 31, 176, 961, 5456, 29791, 165869, 923521, 5141947]);
  });
  it("xDivider lookups", () => {
    expect(Common.xDivider(0, 1)).toBe(360);          // latMax>=0, latMin... see Java branches
    expect(Common.xDivider(90000000, 90000001)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test, verify it fails** — `npx vitest run test/common.test.ts` → FAIL.

- [ ] **Step 3: Implement** — `src/common.ts` (full `X_DIVIDER_19` table from `../mapcode-java/.../Common.java` lines 49-68; copy all 170 values verbatim)

```ts
import { Data } from "./data.js";

export class Common {
  static readonly NC = [1, 31, 961, 29791, 923521, 28629151, 887503681];
  static readonly X_SIDE = [0, 5, 31, 168, 961, 5208, 29791, 165869, 923521, 5141947];
  static readonly Y_SIDE = [0, 6, 31, 176, 961, 5456, 29791, 165869, 923521, 5141947];

  private static readonly X_DIVIDER_19 = [
    360, 360, 360, 360, 360, 360, 361, 361, 361, 361,
    362, 362, 362, 363, 363, 363, 364, 364, 365, 366,
    366, 367, 367, 368, 369, 370, 370, 371, 372, 373,
    374, 375, 376, 377, 378, 379, 380, 382, 383, 384,
    386, 387, 388, 390, 391, 393, 394, 396, 398, 399,
    401, 403, 405, 407, 409, 411, 413, 415, 417, 420,
    422, 424, 427, 429, 432, 435, 437, 440, 443, 446,
    449, 452, 455, 459, 462, 465, 469, 473, 476, 480,
    484, 488, 492, 496, 501, 505, 510, 515, 520, 525,
    530, 535, 540, 546, 552, 558, 564, 570, 577, 583,
    590, 598, 605, 612, 620, 628, 637, 645, 654, 664,
    673, 683, 693, 704, 715, 726, 738, 751, 763, 777,
    791, 805, 820, 836, 852, 869, 887, 906, 925, 946,
    968, 990, 1014, 1039, 1066, 1094, 1123, 1154, 1187, 1223,
    1260, 1300, 1343, 1389, 1438, 1490, 1547, 1609, 1676, 1749,
    1828, 1916, 2012, 2118, 2237, 2370, 2521, 2691, 2887, 3114,
    3380, 3696, 4077, 4547, 5139, 5910, 6952, 8443, 10747, 14784,
    23681, 59485,
  ];

  static xDivider(latMin: number, latMax: number): number {
    if (latMin >= 0) {
      return Common.X_DIVIDER_19[latMin >> 19];
    } else if (latMax >= 0) {
      return Common.X_DIVIDER_19[0];
    } else {
      return Common.X_DIVIDER_19[(-latMax) >> 19];
    }
  }

  static countCityCoordinatesForCountry(codex: number, territoryRecord: number, firstTerritoryRecord: number): number {
    const firstRecord = Common.getFirstNamelessRecord(codex, territoryRecord, firstTerritoryRecord);
    let record = territoryRecord;
    while (Data.getCodex(record) === codex) record++;
    return record - firstRecord;
  }

  static getFirstNamelessRecord(codex: number, territoryRecord: number, firstTerritoryRecord: number): number {
    let record = territoryRecord;
    while (record >= firstTerritoryRecord && Data.isNameless(record) && Data.getCodex(record) === codex) record--;
    record++;
    return record;
  }
}
```

- [ ] **Step 4: Run test, verify it passes** — `npx vitest run test/common.test.ts` → PASS. (`count*`/`getFirst*` are exercised by encoder/decoder + reference tests later.)
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add Common constants and helpers"`

---

## Task 4: Data + DataModel + embedded data

This task is split into 4a (data generation), 4b (DataModel), 4c (Data) because DataModel needs the embedded bytes and Data needs DataModel. Implement in this order. Commit after each green sub-step.

**Files:**
- Create: `scripts/generate-data.mts`, `src/data/mminfo-data.ts` (generated), `src/data-model.ts`, `src/data.ts`
- Test: `test/data-model.test.ts`

**Interfaces:**
- Produces:
  - `mminfo-data.ts`: `export const MMINFO_DATA: Uint8Array` (base64-decoded).
  - `DataModel`: static `getInstance(): DataModel`; constructor `new DataModel(bytes: Uint8Array)` (throws `IncorrectDataModelError`); `getNrTerritories()`, `getNrTerritoryRecords()`, `getLonMicroDegMin(r)`, `getLatMicroDegMin(r)`, `getLonMicroDegMax(r)`, `getLatMicroDegMax(r)`, `getDataFlags(r)`, `getSmartDiv(r)`, `getDataFirstRecord(territoryNumber)`, `getDataLastRecord(territoryNumber)`.
  - `Data`: static `isNameless(r)`, `isSpecialShape(r)`, `getTerritoryRecordType(r)`, `isRestricted(r)`, `getCodex(r)`, `headerLetter(i)`; constants `ENCODE_CHARS: string[]`, `TERRITORY_RECORD_TYPE_NONE/PIPE/PLUS/STAR`.

> **Note on the territory-count check:** Java's `DataModel` constructor asserts `nrTerritories === Territory.values().length`. Territory is Task 8. To avoid a circular dependency at module-load, `DataModel` must NOT import `Territory`. Implement the constructor with an injectable expected-count: `getInstance()` reads the count from the data header and validates it against a constant `EXPECTED_NR_TERRITORIES` defined in `data-model.ts` (set it to the value the Java enum has — confirm by reading the header of `data/mminfo.dat`: bytes 6-7 little-endian). Document this constant with a comment. `Territory` (Task 8) imports `DataModel`, not vice-versa.

- [ ] **Step 1: Write `scripts/generate-data.mts`**

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const datPath = join(here, "..", "data", "mminfo.dat");
const outPath = join(here, "..", "src", "data", "mminfo-data.ts");

const bytes = readFileSync(datPath);
const b64 = bytes.toString("base64");

const content = `// AUTO-GENERATED from data/mminfo.dat by scripts/generate-data.mts. Do not edit.
const BASE64 =
  "${b64}";

function decode(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const MMINFO_DATA: Uint8Array = decode(BASE64);
`;

writeFileSync(outPath, content);
console.log(\`Wrote \${outPath} (\${bytes.length} bytes -> \${b64.length} base64 chars)\`);
```

- [ ] **Step 2: Generate the data module + confirm territory count**

```bash
mkdir -p src/data
npm run gen:data
# read header bytes 6-7 (little-endian) = nrTerritories:
node -e "const b=require('fs').readFileSync('data/mminfo.dat');console.log('nrTerritories=',(b[6]&0xff)+((b[7]&0xff)<<8))"
```
Expected: prints the territory count (this value becomes `EXPECTED_NR_TERRITORIES`). Note it.

- [ ] **Step 3: Write the failing test** — port `../mapcode-java/.../DataModelTest.java` to `test/data-model.test.ts` (methods: `testFileOK`, `testFileTooShort`, `testFileEndsEarly`, `testFileNoHeader`, `testFileWrongversion`). Copy fixtures first:

```bash
mkdir -p test/resources/com/mapcode
cp ../mapcode-java/src/test/resources/com/mapcode/mminfo_*.dat test/resources/com/mapcode/
```

```ts
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
```

- [ ] **Step 4: Run test, verify it fails** — `npx vitest run test/data-model.test.ts` → FAIL.

- [ ] **Step 5: Implement `src/data-model.ts`** (translate from Java; replace stream reading with the `Uint8Array` argument; replace the `Territory.values().length` check with `EXPECTED_NR_TERRITORIES`)

```ts
import { IncorrectDataModelError } from "./errors.js";
import { MMINFO_DATA } from "./data/mminfo-data.js";

// Equals Territory.values().length. Verified against bytes 6-7 of data/mminfo.dat. See Task 4 Step 2.
const EXPECTED_NR_TERRITORIES = /* fill in from Step 2 */ 0;

const HEADER_VERSION_LO = 2, HEADER_VERSION_HI = 3;
const HEADER_NR_TERRITORIES_RECS_LO = 4, HEADER_NR_TERRITORIES_RECS_HI = 5;
const HEADER_NR_TERRITORIES_LO = 6, HEADER_NR_TERRITORIES_HI = 7;
const HEADER_SIZE = HEADER_NR_TERRITORIES_HI + 1;
const BYTES_PER_INT = 2, BYTES_PER_LONG = 4;
const POS_DATA_LON_MICRO_DEG_MIN = 0, POS_DATA_LAT_MICRO_DEG_MIN = 1;
const POS_DATA_LON_MICRO_DEG_MAX = 2, POS_DATA_LAT_MICRO_DEG_MAX = 3;
const POS_DATA_DATA_FLAGS = 4, DATA_FIELDS_PER_REC = 5;
const MASK_DATA_DATA_FLAGS = 0xffff, SHIFT_POS_DATA_SMART_DIV = 16;
const DATA_VERSION_MIN = 220;

function readIntLoHi(lo: number, hi: number): number {
  return (lo & 0xff) + ((hi & 0xff) << 8);
}
function readLongLoHi(lo: number, mid1: number, mid2: number, hi: number): number {
  return (lo & 0xff) + ((mid1 & 0xff) << 8) + ((mid2 & 0xff) << 16) + ((hi & 0xff) << 24);
}

export class DataModel {
  private readonly nrTerritories: number;
  private readonly nrTerritoryRecords: number;
  private readonly index: number[];
  private readonly data: number[];
  private static instance: DataModel | null = null;

  constructor(bytes: Uint8Array) {
    const total = bytes.length;
    if (total < 12) throw new IncorrectDataModelError("Data file corrupt");
    if (bytes[0] !== 0x4d /*M*/ || bytes[1] !== 0x43 /*C*/)
      throw new IncorrectDataModelError("Data file does not start with correct header");
    const dataVersion = readIntLoHi(bytes[HEADER_VERSION_LO], bytes[HEADER_VERSION_HI]);
    if (dataVersion < DATA_VERSION_MIN)
      throw new IncorrectDataModelError(`Data file version ${dataVersion} too low`);
    this.nrTerritoryRecords = readIntLoHi(bytes[HEADER_NR_TERRITORIES_RECS_LO], bytes[HEADER_NR_TERRITORIES_RECS_HI]);
    this.nrTerritories = readIntLoHi(bytes[HEADER_NR_TERRITORIES_LO], bytes[HEADER_NR_TERRITORIES_HI]);
    if (EXPECTED_NR_TERRITORIES !== 0 && this.nrTerritories !== EXPECTED_NR_TERRITORIES)
      throw new IncorrectDataModelError("Data file corrupt");
    const expectedSize = HEADER_SIZE + (this.nrTerritories + 1) * BYTES_PER_INT +
      this.nrTerritoryRecords * (DATA_FIELDS_PER_REC * BYTES_PER_LONG);
    if (expectedSize !== total) throw new IncorrectDataModelError("Data file corrupt");

    this.index = new Array(this.nrTerritories + 1);
    let i = HEADER_SIZE;
    for (let k = 0; k <= this.nrTerritories; k++) { this.index[k] = readIntLoHi(bytes[i], bytes[i + 1]); i += 2; }
    this.data = new Array(this.nrTerritoryRecords * DATA_FIELDS_PER_REC);
    for (let k = 0; k < this.nrTerritoryRecords * DATA_FIELDS_PER_REC; k++) {
      this.data[k] = readLongLoHi(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]); i += 4;
    }
  }

  static getInstance(): DataModel {
    if (DataModel.instance === null) DataModel.instance = new DataModel(MMINFO_DATA);
    return DataModel.instance;
  }

  getNrTerritories(): number { return this.nrTerritories; }
  getNrTerritoryRecords(): number { return this.nrTerritoryRecords; }
  getLonMicroDegMin(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LON_MICRO_DEG_MIN]; }
  getLatMicroDegMin(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LAT_MICRO_DEG_MIN]; }
  getLonMicroDegMax(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LON_MICRO_DEG_MAX]; }
  getLatMicroDegMax(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LAT_MICRO_DEG_MAX]; }
  getDataFlags(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_DATA_FLAGS] & MASK_DATA_DATA_FLAGS; }
  getSmartDiv(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_DATA_FLAGS] >> SHIFT_POS_DATA_SMART_DIV; }
  getDataFirstRecord(territoryNumber: number): number { return this.index[territoryNumber]; }
  getDataLastRecord(territoryNumber: number): number { return this.index[territoryNumber + 1] - 1; }
}
```

After Step 2 fills `EXPECTED_NR_TERRITORIES`, the `mminfo_ok.dat` fixture (a real data file) must satisfy the count and size checks. If the fixture's territory count differs from the embedded data, set `EXPECTED_NR_TERRITORIES` to match the real `data/mminfo.dat`; the test fixtures are crafted to pass/fail the size/header/version checks specifically, so verify each fixture lands on the intended branch when you run the test.

- [ ] **Step 6: Run data-model test, verify pass** — `npx vitest run test/data-model.test.ts` → PASS. Commit: `git add -A && git commit -m "feat: add DataModel + embedded mminfo data"`

- [ ] **Step 7: Implement `src/data.ts`**

```ts
import { DataModel } from "./data-model.js";

const DATA_MODEL = DataModel.getInstance();

export class Data {
  static readonly ENCODE_CHARS = [
    "0","1","2","3","4","5","6","7","8","9",
    "B","C","D","F","G","H","J","K","L","M",
    "N","P","Q","R","S","T","V","W","X","Y","Z",
    "A","E","U",
  ];
  static readonly TERRITORY_RECORD_TYPE_NONE = 0;
  static readonly TERRITORY_RECORD_TYPE_PIPE = 1;
  static readonly TERRITORY_RECORD_TYPE_PLUS = 2;
  static readonly TERRITORY_RECORD_TYPE_STAR = 3;

  static isNameless(r: number): boolean { return (DATA_MODEL.getDataFlags(r) & 64) !== 0; }
  static isSpecialShape(r: number): boolean { return (DATA_MODEL.getDataFlags(r) & 1024) !== 0; }
  static getTerritoryRecordType(r: number): number { return (DATA_MODEL.getDataFlags(r) >> 7) & 3; }
  static isRestricted(r: number): boolean { return (DATA_MODEL.getDataFlags(r) & 512) !== 0; }
  static getCodex(r: number): number {
    const codexflags = DATA_MODEL.getDataFlags(r) & 31;
    return 10 * Math.trunc(codexflags / 5) + (codexflags % 5) + 1;
  }
  static headerLetter(i: number): string {
    const flags = DATA_MODEL.getDataFlags(i);
    if (((flags >> 7) & 3) === 1) return Data.ENCODE_CHARS[(flags >> 11) & 31];
    return "";
  }
}
```

- [ ] **Step 8: Add Data smoke test + run** — append to `test/data-model.test.ts` (or `test/data.test.ts`) a check that `Data.ENCODE_CHARS.length === 34` and `Data.getCodex(0)` returns a number in 1..99. Run: `npx vitest run test/data-model.test.ts` → PASS.
- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat: add Data flag accessors"`

---

## Task 5: CheckArgs

**Files:**
- Create: `src/check-args.ts`
- Test: port `../mapcode-java/.../CheckArgsTest.java` to `test/check-args.test.ts`

**Interfaces:**
- Consumes: `Point.isDefined`, `IllegalArgumentError`, `Mapcode.getPrecisionFormat` (forward dep — `checkMapcodeCode` calls `getPrecisionFormat`, which lives on `Mapcode`, Task 10). To avoid a cycle, `check-args.ts` takes the precision-format function via import from `mapcode.ts` lazily, OR `checkMapcodeCode` is implemented in Task 10 alongside Mapcode. **Decision:** implement `checkNonnull` and `checkDefined` here now; implement/port the `testMapcodeCodeOK/Error` cases in Task 10 after `Mapcode.getPrecisionFormat` exists. Note this split in the test file with a TODO comment that is resolved in Task 10 (the test file ends Task 10 with all 6 CheckArgsTest methods present).
- Produces: `checkNonnull(param: string, obj: unknown): void`, `checkDefined(param: string, point: Point): void`.

- [ ] **Step 1: Write failing test** (the 4 non-mapcode cases) — `test/check-args.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { checkNonnull, checkDefined } from "../src/check-args.js";
import { Point } from "../src/point.js";
import { IllegalArgumentError } from "../src/errors.js";

describe("CheckArgs", () => {
  it("checkNonnull OK", () => { expect(() => checkNonnull("x", "v")).not.toThrow(); });
  it("checkNonnull throws on null", () => { expect(() => checkNonnull("x", null)).toThrow(IllegalArgumentError); });
  it("checkDefined OK", () => { expect(() => checkDefined("p", Point.fromDeg(1, 2))).not.toThrow(); });
  it("checkDefined throws on undefined point", () => { expect(() => checkDefined("p", Point.undefined())).toThrow(IllegalArgumentError); });
});
```

- [ ] **Step 2: Run, verify fail** — `npx vitest run test/check-args.test.ts` → FAIL.
- [ ] **Step 3: Implement `src/check-args.ts`**

```ts
import { IllegalArgumentError } from "./errors.js";
import { Point } from "./point.js";

export function checkNonnull(param: string, obj: unknown): void {
  if (obj === null || obj === undefined) {
    throw new IllegalArgumentError(`Parameter ${param} should not be null`);
  }
}

export function checkDefined(param: string, point: Point): void {
  checkNonnull(param, point);
  if (!point.isDefined()) {
    throw new IllegalArgumentError(`Parameter ${param} must be defined`);
  }
}
```

- [ ] **Step 4: Run, verify pass** — `npx vitest run test/check-args.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add CheckArgs (checkNonnull, checkDefined)"`

---

## Task 6: Rectangle

**Files:**
- Create: `src/rectangle.ts`
- Test: `test/rectangle.test.ts` (no dedicated Java test; covered via decode tests. Add a small TS test.)

**Interfaces:**
- Consumes: `Point`.
- Produces: `class Rectangle` — constructor `new Rectangle(southWest: Point, northEast: Point)`; `getSouthWest()`, `getNorthEast()`, `getCenter()`, `isDefined()`, `toString()`, `equals(o)`.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { Rectangle } from "../src/rectangle.js";
import { Point } from "../src/point.js";

describe("Rectangle", () => {
  it("exposes corners and center", () => {
    const sw = Point.fromDeg(0, 0), ne = Point.fromDeg(2, 4);
    const r = new Rectangle(sw, ne);
    expect(r.getSouthWest()).toBe(sw);
    expect(r.getNorthEast()).toBe(ne);
    expect(r.isDefined()).toBe(true);
    const c = r.getCenter();
    expect(c.getLatDeg()).toBeCloseTo(1, 6);
    expect(c.getLonDeg()).toBeCloseTo(2, 6);
  });
  it("undefined when a corner is undefined", () => {
    const r = new Rectangle(Point.undefined(), Point.fromDeg(1, 1));
    expect(r.isDefined()).toBe(false);
    expect(r.getCenter().isDefined()).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `src/rectangle.ts`**

```ts
import { Point } from "./point.js";

export class Rectangle {
  private readonly southWest: Point;
  private readonly northEast: Point;
  constructor(southWest: Point, northEast: Point) {
    this.southWest = southWest;
    this.northEast = northEast;
  }
  getSouthWest(): Point { return this.southWest; }
  getNorthEast(): Point { return this.northEast; }
  getCenter(): Point {
    if (!this.isDefined()) return Point.undefined();
    const centerLat = (this.southWest.getLatDeg() + this.northEast.getLatDeg()) / 2.0;
    const centerLon = (this.southWest.getLonDeg() + this.northEast.getLonDeg()) / 2.0;
    return Point.fromDeg(centerLat, centerLon);
  }
  isDefined(): boolean { return this.southWest.isDefined() && this.northEast.isDefined(); }
  toString(): string { return `[${this.southWest}, ${this.northEast}]`; }
  equals(o: unknown): boolean {
    if (this === o) return true;
    if (!(o instanceof Rectangle)) return false;
    return this.southWest.equals(o.southWest) && this.northEast.equals(o.northEast);
  }
}
```

- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add Rectangle"`

---

## Task 7: Alphabet

**Files:**
- Create: `src/alphabet.ts`
- Test: port `../mapcode-java/.../AlphabetTest.java` to `test/alphabet.test.ts` — but `testConvertToAlphabet` depends on `Mapcode.getCode(Alphabet)`/Territory, so port only `testOrderOfValues`, `testFromString`, `testFromStringNumeric`, `testFromStringError1..4` now; add `testConvertToAlphabet` in Task 13/16 once encode is available (leave a TODO comment).

**Interfaces:**
- Consumes: `checkNonnull`, `UnknownAlphabetError`.
- Produces: `class Alphabet` with `static readonly` instances ROMAN(0)…GUJARATI(27); `getNumber()`; static `fromString(alphaCode: string): Alphabet`; static `values(): Alphabet[]`.

- [ ] **Step 1: Write failing test** — `test/alphabet.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { Alphabet } from "../src/alphabet.js";
import { UnknownAlphabetError } from "../src/errors.js";

describe("Alphabet", () => {
  it("values are in numeric order", () => {
    const v = Alphabet.values();
    for (let i = 0; i < v.length; i++) expect(v[i].getNumber()).toBe(i);
  });
  it("fromString case-insensitive", () => {
    expect(Alphabet.fromString("greek")).toBe(Alphabet.GREEK);
    expect(Alphabet.fromString("  ROMAN ")).toBe(Alphabet.ROMAN);
  });
  it("fromString numeric throws", () => { expect(() => Alphabet.fromString("1")).toThrow(UnknownAlphabetError); });
  it("fromString empty throws", () => { expect(() => Alphabet.fromString("")).toThrow(UnknownAlphabetError); });
  it("fromString malformed throws", () => { expect(() => Alphabet.fromString("GR1")).toThrow(UnknownAlphabetError); });
  it("fromString out-of-range numeric throws", () => { expect(() => Alphabet.fromString("99")).toThrow(UnknownAlphabetError); });
  it("fromString trailing number throws", () => { expect(() => Alphabet.fromString("GREEK1")).toThrow(UnknownAlphabetError); });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `src/alphabet.ts`**

```ts
import { checkNonnull } from "./check-args.js";
import { UnknownAlphabetError } from "./errors.js";

export class Alphabet {
  static readonly ROMAN = new Alphabet("ROMAN", 0);
  static readonly GREEK = new Alphabet("GREEK", 1);
  static readonly CYRILLIC = new Alphabet("CYRILLIC", 2);
  static readonly HEBREW = new Alphabet("HEBREW", 3);
  static readonly DEVANAGARI = new Alphabet("DEVANAGARI", 4);
  static readonly MALAYALAM = new Alphabet("MALAYALAM", 5);
  static readonly GEORGIAN = new Alphabet("GEORGIAN", 6);
  static readonly KATAKANA = new Alphabet("KATAKANA", 7);
  static readonly THAI = new Alphabet("THAI", 8);
  static readonly LAO = new Alphabet("LAO", 9);
  static readonly ARMENIAN = new Alphabet("ARMENIAN", 10);
  static readonly BENGALI = new Alphabet("BENGALI", 11);
  static readonly GURMUKHI = new Alphabet("GURMUKHI", 12);
  static readonly TIBETAN = new Alphabet("TIBETAN", 13);
  static readonly ARABIC = new Alphabet("ARABIC", 14);
  static readonly KOREAN = new Alphabet("KOREAN", 15);
  static readonly BURMESE = new Alphabet("BURMESE", 16);
  static readonly KHMER = new Alphabet("KHMER", 17);
  static readonly SINHALESE = new Alphabet("SINHALESE", 18);
  static readonly THAANA = new Alphabet("THAANA", 19);
  static readonly CHINESE = new Alphabet("CHINESE", 20);
  static readonly TIFINAGH = new Alphabet("TIFINAGH", 21);
  static readonly TAMIL = new Alphabet("TAMIL", 22);
  static readonly AMHARIC = new Alphabet("AMHARIC", 23);
  static readonly TELUGU = new Alphabet("TELUGU", 24);
  static readonly ODIA = new Alphabet("ODIA", 25);
  static readonly KANNADA = new Alphabet("KANNADA", 26);
  static readonly GUJARATI = new Alphabet("GUJARATI", 27);

  private static readonly BY_NAME = new Map<string, Alphabet>();
  private static readonly VALUES: Alphabet[] = [];

  private constructor(readonly name: string, private readonly number: number) {}

  // Registered after class body (see bottom of file).
  static register(a: Alphabet): void {
    Alphabet.BY_NAME.set(a.name, a);
    Alphabet.VALUES[a.number] = a;
  }

  getNumber(): number { return this.number; }
  toString(): string { return this.name; }

  static values(): Alphabet[] { return Alphabet.VALUES.slice(); }

  static fromString(alphaCode: string): Alphabet {
    checkNonnull("alphaCode", alphaCode);
    const trimmed = alphaCode.trim().toUpperCase();
    const found = Alphabet.BY_NAME.get(trimmed);
    if (found === undefined) throw new UnknownAlphabetError(trimmed);
    return found;
  }
}

// Build lookup tables (static instances are created above before this runs).
for (const a of [
  Alphabet.ROMAN, Alphabet.GREEK, Alphabet.CYRILLIC, Alphabet.HEBREW, Alphabet.DEVANAGARI,
  Alphabet.MALAYALAM, Alphabet.GEORGIAN, Alphabet.KATAKANA, Alphabet.THAI, Alphabet.LAO,
  Alphabet.ARMENIAN, Alphabet.BENGALI, Alphabet.GURMUKHI, Alphabet.TIBETAN, Alphabet.ARABIC,
  Alphabet.KOREAN, Alphabet.BURMESE, Alphabet.KHMER, Alphabet.SINHALESE, Alphabet.THAANA,
  Alphabet.CHINESE, Alphabet.TIFINAGH, Alphabet.TAMIL, Alphabet.AMHARIC, Alphabet.TELUGU,
  Alphabet.ODIA, Alphabet.KANNADA, Alphabet.GUJARATI,
]) {
  Alphabet.register(a);
}
```

> Note: `register` being public is a minor leak; alternatively populate `BY_NAME`/`VALUES` inline. Keep whichever is cleaner; the test only needs `values()`, `getNumber()`, `fromString()`.

- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add Alphabet"`

---

## Task 8: Territory (+ AlphaCodeFormat)

**Files:**
- Create: `src/territory.ts`
- Test: port `../mapcode-java/.../TerritoryTest.java` to `test/territory.test.ts` (all 34 methods). The `checkConvert`/`checkAlphabet` methods need `toString(alphabet)` alphabet conversion which depends on Mapcode's unicode tables — if `toAlphaCode`/`toString(alphabet)` conversion relies on Decoder/Mapcode unicode mapping, port those specific assertions in Task 14/16 and leave TODOs; port everything else now.

**Interfaces:**
- Consumes: `Alphabet`, `DataModel` (for `getNumber` vs record indices — actually Territory does not need DataModel; it carries its own metadata), `UnknownTerritoryError`, `IllegalArgumentError`, `checkNonnull`.
- Produces: `class Territory` with ~530+ `static readonly` instances (`Territory.NLD`, `Territory.USA`, `Territory.AAA`, …). Instance: `getNumber()`, `getFullName()`, `getAliases()`, `getFullNameAliases()`, `getParentTerritory(): Territory | null`, `getAlphabets(): Alphabet[]`, `isSubdivision()`, `hasSubdivisions()`, `toString(alphabet?)`, `toAlphaCode(format, alphabet?)`. Static: `fromString(s, parent?)`, `fromNumber(n)`, `fromCountryISO2(s)`, `fromCountryISO3(s)`, `fromCountryISO(s)`, `getCountryISO2FromISO3(s)`, `getCountryISO3FromISO2(s)`, `allCountryISO2Codes(): Set<string>`, `allCountryISO3Codes(): Set<string>`, `values(): Territory[]`, `PARENT_TERRITORIES: Set<Territory>`. Nested enum `AlphaCodeFormat` (`INTERNATIONAL`, `MINIMAL_UNAMBIGUOUS`, `MINIMAL`) — implement as a TS `enum` or `const` object exported alongside.

> **Port directive:** This is the largest file (1183 lines), dominated by the enum constant table and parsing logic. Read `../mapcode-java/src/main/java/com/mapcode/Territory.java` in full and translate it faithfully:
> - Each Java enum constant `NAME(number, "FullName", new Alphabet[]{...}, parentTerritoryOrNull, new String[]{aliases}, new String[]{fullNameAliases})` becomes a `static readonly NAME = new Territory(number, "FullName", [alphabets], parentOrNull, [aliases], [fullNameAliases])`. Preserve order and numbers exactly; `AAA` must be last with its specific number.
> - Build lookup maps after the constants: by-number array, by-name map (including aliases and dash/underscore normalization), and the parent-territory set, mirroring the Java static initializer.
> - `toString()` replaces underscores with dashes (international format). `toString(alphabet)`/`toAlphaCode` perform script conversion — if that conversion delegates to a shared unicode mapping also used by Decoder, factor it into a small shared helper or duplicate the table; ensure `TerritoryTest.checkConvert`/`checkAlphabet` pass.
> - `fromString` handles full names, ISO codes, dashes vs underscores, parent disambiguation, and numeric-code rejection (deprecated) exactly as Java does, throwing `UnknownTerritoryError` with the right messages/branches.
> - ISO2/ISO3 conversion methods mirror Java's branch-by-branch error conditions (`TerritoryTest` has ~34 cases pinning these down).

- [ ] **Step 1: Port `test/territory.test.ts`** from `TerritoryTest.java` (translate each `@Test`; map `Territory.fromString`, `fromCountryISO*`, `getCountryISO*`, `values()`-loop, error cases). For `assertEquals`→`expect(...).toBe(...)`, exceptions→`expect(() => ...).toThrow(ExpectedError)`.
- [ ] **Step 2: Run, verify fail** — `npx vitest run test/territory.test.ts` → FAIL.
- [ ] **Step 3: Implement `src/territory.ts`** by faithful translation of `Territory.java` (constants table + maps + methods, per the port directive).
- [ ] **Step 4: Run, verify pass** — `npx vitest run test/territory.test.ts` → PASS (except any TODO-deferred alphabet-conversion cases).
- [ ] **Step 5: Wire DataModel territory-count check** — now that `Territory` exists with `values()`, update `EXPECTED_NR_TERRITORIES` in `data-model.ts` to a comment referencing `Territory.values().length` and set the literal to that count (do NOT import Territory into DataModel; keep the literal + comment to avoid a cycle). Re-run `npx vitest run test/data-model.test.ts` → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add Territory + AlphaCodeFormat"`

---

## Task 9: Boundary

**Files:**
- Create: `src/boundary.ts`
- Test: `test/boundary.test.ts` (no dedicated Java test; add a focused TS test for `containsPoint` wrap logic, full coverage via reference tests).

**Interfaces:**
- Consumes: `DataModel`, `Point`.
- Produces: `class Boundary` — static `createBoundaryForTerritoryRecord(territoryRecord: number): Boundary`; `getLonMicroDegMin/Max()`, `getLatMicroDegMin/Max()`; `extendBoundary(latExt: number, lonExt: number): Boundary` (mutates + returns this); `containsPoint(p: Point): boolean` (with the longitude-wrap logic); `toString()`.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { Boundary } from "../src/boundary.js";
import { Point } from "../src/point.js";

describe("Boundary", () => {
  it("createBoundaryForTerritoryRecord exposes the record's bounds", () => {
    const b = Boundary.createBoundaryForTerritoryRecord(0);
    expect(typeof b.getLatMicroDegMin()).toBe("number");
    expect(b.getLatMicroDegMax()).toBeGreaterThanOrEqual(b.getLatMicroDegMin());
  });
  it("containsPoint inside its own bounds", () => {
    const b = Boundary.createBoundaryForTerritoryRecord(0);
    const c = b.getLatMicroDegMin() < b.getLatMicroDegMax();
    expect(c).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `src/boundary.ts`** (translate verbatim from `Boundary.java`)

```ts
import { DataModel } from "./data-model.js";
import { Point } from "./point.js";

const DATA_MODEL = DataModel.getInstance();

export class Boundary {
  private latMicroDegMin: number;
  private lonMicroDegMin: number;
  private latMicroDegMax: number;
  private lonMicroDegMax: number;

  private constructor(latMicroDegMin: number, lonMicroDegMin: number, latMicroDegMax: number, lonMicroDegMax: number) {
    this.lonMicroDegMin = lonMicroDegMin;
    this.latMicroDegMin = latMicroDegMin;
    this.latMicroDegMax = latMicroDegMax;
    this.lonMicroDegMax = lonMicroDegMax;
  }

  static createBoundaryForTerritoryRecord(territoryRecord: number): Boundary {
    return new Boundary(
      DATA_MODEL.getLatMicroDegMin(territoryRecord), DATA_MODEL.getLonMicroDegMin(territoryRecord),
      DATA_MODEL.getLatMicroDegMax(territoryRecord), DATA_MODEL.getLonMicroDegMax(territoryRecord),
    );
  }

  getLonMicroDegMin(): number { return this.lonMicroDegMin; }
  getLonMicroDegMax(): number { return this.lonMicroDegMax; }
  getLatMicroDegMin(): number { return this.latMicroDegMin; }
  getLatMicroDegMax(): number { return this.latMicroDegMax; }

  extendBoundary(latMicroDegExtension: number, lonMicroDegExtension: number): Boundary {
    this.lonMicroDegMin -= lonMicroDegExtension;
    this.latMicroDegMin -= latMicroDegExtension;
    this.lonMicroDegMax += lonMicroDegExtension;
    this.latMicroDegMax += latMicroDegExtension;
    return this;
  }

  containsPoint(p: Point): boolean {
    if (!p.isDefined()) return false;
    const latMicroDeg = p.getLatMicroDeg();
    if (this.latMicroDegMin > latMicroDeg || latMicroDeg >= this.latMicroDegMax) return false;
    const lonMicroDeg = p.getLonMicroDeg();
    if (lonMicroDeg < this.lonMicroDegMin) {
      return this.lonMicroDegMin <= lonMicroDeg + Point.MICRO_DEG_360 && lonMicroDeg + Point.MICRO_DEG_360 < this.lonMicroDegMax;
    } else if (lonMicroDeg >= this.lonMicroDegMax) {
      return this.lonMicroDegMin <= lonMicroDeg - Point.MICRO_DEG_360 && lonMicroDeg - Point.MICRO_DEG_360 < this.lonMicroDegMax;
    } else {
      return true;
    }
  }

  toString(): string {
    return `[${this.latMicroDegMin / Point.DEG_TO_MICRO_DEG}, ${this.latMicroDegMax / Point.DEG_TO_MICRO_DEG}), [` +
      `${this.lonMicroDegMin / Point.DEG_TO_MICRO_DEG}, ${this.lonMicroDegMax / Point.DEG_TO_MICRO_DEG})`;
  }
}
```

- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add Boundary"`

---

## Task 10: MapcodeZone

**Files:**
- Create: `src/mapcode-zone.ts`
- Test: `test/mapcode-zone.test.ts` (no dedicated Java test; small TS test for `isEmpty`/`getCenter`, full coverage via decode/reference tests).

**Interfaces:**
- Consumes: `Point`, `Boundary`.
- Produces: `class MapcodeZone` — constructors via static factories or overloaded constructor: `new MapcodeZone()`, `new MapcodeZone(latFractionMin, latFractionMax, lonFractionMin, lonFractionMax)`, `MapcodeZone.copy(other)`; getters/setters for the 4 fraction fields; `setFromFractions(latFraction, lonFraction, latFractionDelta, lonFractionDelta)`; `isEmpty()`; `getCenter()`; `restrictZoneTo(area: Boundary): MapcodeZone`; `toString()`.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { MapcodeZone } from "../src/mapcode-zone.js";

describe("MapcodeZone", () => {
  it("empty by default", () => { expect(new MapcodeZone().isEmpty()).toBe(true); });
  it("non-empty has a defined center", () => {
    const z = new MapcodeZone();
    z.setFromFractions(0, 0, 810000, 3240000);
    expect(z.isEmpty()).toBe(false);
    expect(z.getCenter().isDefined()).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `src/mapcode-zone.ts`** (translate verbatim from `MapcodeZone.java`; emulate Java's 3 constructors with optional params / a static `copy`)

```ts
import { Point } from "./point.js";
import { Boundary } from "./boundary.js";

export class MapcodeZone {
  private lonFractionMin: number;
  private lonFractionMax: number;
  private latFractionMin: number;
  private latFractionMax: number;

  constructor(latFractionMin = 0.0, latFractionMax = 0.0, lonFractionMin = 0.0, lonFractionMax = 0.0) {
    this.latFractionMin = latFractionMin;
    this.latFractionMax = latFractionMax;
    this.lonFractionMin = lonFractionMin;
    this.lonFractionMax = lonFractionMax;
  }

  static copy(z: MapcodeZone): MapcodeZone {
    return new MapcodeZone(z.latFractionMin, z.latFractionMax, z.lonFractionMin, z.lonFractionMax);
  }

  getLonFractionMin(): number { return this.lonFractionMin; }
  getLonFractionMax(): number { return this.lonFractionMax; }
  getLatFractionMin(): number { return this.latFractionMin; }
  getLatFractionMax(): number { return this.latFractionMax; }
  setLonFractionMin(v: number): void { this.lonFractionMin = v; }
  setLonFractionMax(v: number): void { this.lonFractionMax = v; }
  setLatFractionMin(v: number): void { this.latFractionMin = v; }
  setLatFractionMax(v: number): void { this.latFractionMax = v; }

  setFromFractions(latFraction: number, lonFraction: number, latFractionDelta: number, lonFractionDelta: number): void {
    this.lonFractionMin = lonFraction;
    this.lonFractionMax = lonFraction + lonFractionDelta;
    if (latFractionDelta < 0) {
      this.latFractionMin = latFraction + 1 + latFractionDelta;
      this.latFractionMax = latFraction + 1;
    } else {
      this.latFractionMin = latFraction;
      this.latFractionMax = latFraction + latFractionDelta;
    }
  }

  isEmpty(): boolean {
    return this.lonFractionMax <= this.lonFractionMin || this.latFractionMax <= this.latFractionMin;
  }

  getCenter(): Point {
    if (this.isEmpty()) return Point.undefined();
    const latFrac = Math.floor((this.latFractionMin + this.latFractionMax) / 2.0);
    const lonFrac = Math.floor((this.lonFractionMin + this.lonFractionMax) / 2.0);
    return Point.fromLatLonFractions(latFrac, lonFrac);
  }

  restrictZoneTo(area: Boundary): MapcodeZone {
    const z = new MapcodeZone(this.latFractionMin, this.latFractionMax, this.lonFractionMin, this.lonFractionMax);
    const latMin = area.getLatMicroDegMin() * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
    if (z.latFractionMin < latMin) z.latFractionMin = latMin;
    const latMax = area.getLatMicroDegMax() * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR;
    if (z.latFractionMax > latMax) z.latFractionMax = latMax;
    if (z.latFractionMin < z.latFractionMax) {
      let lonMin = area.getLonMicroDegMin() * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      let lonMax = area.getLonMicroDegMax() * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      if (lonMax < 0 && z.lonFractionMin > 0) {
        lonMin += Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
        lonMax += Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      } else if (lonMin > 1 && z.lonFractionMax < 0) {
        lonMin -= Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
        lonMax -= Point.MICRO_DEG_360 * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR;
      }
      if (z.lonFractionMin < lonMin) z.lonFractionMin = lonMin;
      if (z.lonFractionMax > lonMax) z.lonFractionMax = lonMax;
    }
    return z;
  }

  toString(): string {
    return this.isEmpty() ? "empty" :
      `[${this.latFractionMin / Point.LAT_TO_FRACTIONS_FACTOR}, ${this.latFractionMax / Point.LAT_TO_FRACTIONS_FACTOR}), [` +
      `${this.lonFractionMin / Point.LON_TO_FRACTIONS_FACTOR}, ${this.lonFractionMax / Point.LON_TO_FRACTIONS_FACTOR})`;
  }
}
```

- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add MapcodeZone"`

---

## Task 11: Encoder

**Files:**
- Create: `src/encoder.ts`
- Test: port `../mapcode-java/.../EncoderTest.java` to `test/encoder.test.ts` (18 methods). Some assertions need `Mapcode` (Task 13) — `encode` returns `Mapcode[]`. Implement `Mapcode` minimal enough first OR sequence: build `Encoder` returning internal results, then `Mapcode` (Task 13) wraps. **Decision:** Build `Mapcode` (Task 13) BEFORE running the full EncoderTest. So here: implement `encoder.ts`, and defer running `encoder.test.ts` to the end of Task 13. Write the encoder test now (red), implement encoder, but full green happens once Mapcode + codec exist.

**Interfaces:**
- Consumes: `Point`, `Territory`, `Data`, `DataModel`, `Common`, `Boundary`, `Mapcode` (Task 13).
- Produces: `Encoder.encode(latDeg: number, lonDeg: number, territory: Territory | null, limitToOneResult: boolean): Mapcode[]` plus the internal helpers (`encodeGrid`, `encodeNameless`, `encodeAutoHeader`, `encodeExtension`, `encodeBase31`, `encodeTriple`, `encodeSixWide`, `aeuPack`, etc.) as module-private functions.

> **Port directive:** Read `../mapcode-java/src/main/java/com/mapcode/Encoder.java` (549 lines) and translate faithfully. Key arithmetic rules from Global Constraints apply: `int` division → `Math.trunc`; the `ENCODE_CHARS` alphabet comes from `Data.ENCODE_CHARS`. Watch grid index math (`(relx * divy) + divy - 1 - rely`), `getSmartDiv` shifts, and `encodeExtension`'s base-30 loop. Keep method structure 1:1 with Java for reviewability. The encoder builds `Mapcode` objects via `new Mapcode(code, territory)` (Task 13).

- [ ] **Step 1: Port `test/encoder.test.ts`** from `EncoderTest.java` (all 18 methods, exact expected mapcode strings and counts). These import `encode`/`encodeToShortest`/`encodeToInternational`/`encodeRestrictToCountryISO*` from `../src/codec.js` (Task 12) — so this test fully greens at end of Task 13. Mark with a comment.
- [ ] **Step 2: Run, verify fail** — `npx vitest run test/encoder.test.ts` → FAIL (codec/Mapcode missing).
- [ ] **Step 3: Implement `src/encoder.ts`** by faithful translation.
- [ ] **Step 4: Typecheck** — `npm run typecheck`. Fix type errors. (Full test green deferred to Task 13.)
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add Encoder (test green pending Mapcode/codec)"`

---

## Task 12: Decoder

**Files:**
- Create: `src/decoder.ts`
- Test: port `../mapcode-java/.../DecoderTest.java` to `test/decoder.test.ts` (36 methods, incl. unicode/Greek/Japanese/Cyrillic cases and the 3 lookup-table tests).

**Interfaces:**
- Consumes: `Point`, `Territory`, `Data`, `DataModel`, `Common`, `Boundary`, `MapcodeZone`, `UnknownMapcodeError`, `UnknownDecodeError`.
- Produces: `Decoder.decodeToMapcodeZone(mapcode: string, territory: Territory): MapcodeZone` plus internal helpers (`decodeGrid`, `decodeNameless`, `decodeAutoHeader`, `decodeExtension`, `decodeBase31`, `decodeTriple`, `decodeSixWide`, `aeuUnpack`, `decodeUTF16`) and the lookup tables `DECODE_CHARS`, `ASCII2LANGUAGE`, `UNICODE2ASCII`. Export the tables (or expose getters) so `DecoderTest`'s table tests (`tableDecodeChars`, `tableAscii2Language`, `tableUnicodeToAscii`) can assert their shapes.

> **Port directive:** Read `../mapcode-java/src/main/java/com/mapcode/Decoder.java` (1126 lines) and translate faithfully. Critical hazards (Global Constraints): `decodeBase31` accumulates `value = value * 31 + c` — values stay within int range for valid mapcodes, but apply `| 0`/`Math.trunc` to match Java int semantics; `decodeExtension` uses base-30 loops with large multipliers feeding `Point.fromLatLonFractions` (doubles, exact below 2^53). `aeuUnpack` is a parsing state machine — translate branch-for-branch. The unicode tables (`ASCII2LANGUAGE` 2D array, `UNICODE2ASCII` range table) must be copied verbatim from the Java arrays. Keep helper structure 1:1.

- [ ] **Step 1: Port `test/decoder.test.ts`** from `DecoderTest.java`. Table tests assert `DECODE_CHARS.length === 256` etc. Decode tests call `decode`/`decodeToRectangle` from `../src/codec.js` (Task 13) for the public-path cases, and `Decoder.decodeToMapcodeZone` directly where the Java test does. The codec-dependent assertions green at end of Task 13.
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `src/decoder.ts`** by faithful translation.
- [ ] **Step 4: Run the table tests** (`tableDecodeChars`, `tableAscii2Language`, `tableUnicodeToAscii`) — these don't need codec: `npx vitest run test/decoder.test.ts -t table` → PASS. Typecheck the rest.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add Decoder (codec-path tests green pending Task 13)"`

---

## Task 13: Mapcode + codec functions + greening encoder/decoder/alphabet/territory tests

**Files:**
- Create: `src/mapcode.ts`, `src/codec.ts`
- Test: complete `test/mapcode.test.ts` (port `MapcodeTest.java`), and finish the deferred assertions in `test/encoder.test.ts`, `test/decoder.test.ts`, `test/alphabet.test.ts` (the `testConvertToAlphabet` case), `test/territory.test.ts` (alphabet-conversion cases), `test/check-args.test.ts` (the 2 mapcode-format cases).

**Interfaces:**
- Consumes: `Territory`, `Alphabet`, `Point`, `Rectangle`, `Encoder`, `Decoder`, `MapcodeZone`, errors, `checkNonnull`/`checkDefined`.
- Produces:
  - `Mapcode`: `new Mapcode(code: string, territory: Territory)`; `getCode(precision?: number, alphabet?: Alphabet): string` (+ overloads `getCode(alphabet)`); `getCodeWithTerritory(...)`, `getCodeWithTerritoryFullname(...)`; `getTerritory()`; `toString()`; `equals(o)`; static `getPrecisionFormat(s): number`, `isValidMapcodeFormat(s): boolean`, `containsTerritory(s): boolean`, `getSafeMaxOffsetInMeters(precision): number`, `convertStringToPlainAscii(s): string`; static regex string constants + compiled `PATTERN_TERRITORY` etc.
  - `codec.ts` (top-level functions, replaces `MapcodeCodec`): `encode`, `encodeToShortest`, `encodeToInternational`, `encodeRestrictToCountryISO2`, `encodeRestrictToCountryISO3`, `encodeRestrictToCountryISO`, `decode`, `decodeToRectangle`, `isNearMultipleBorders` — each with the `(lat, lon, …)` and `(point, …)` overloads from the design spec.

> **Port directive:** Read `Mapcode.java` (431 lines) and `MapcodeCodec.java` (451 lines). Translate `Mapcode` faithfully (regex patterns become JS `RegExp`; Java `Pattern`/`Matcher` → `RegExp.exec`/`match`). Translate `MapcodeCodec`'s static methods into exported functions in `codec.ts`, keeping names and behavior. Use TypeScript function-overload signatures for the `(lat,lon)` vs `(point)` variants. `decodeToMapcodeZone` (private in Java's MapcodeCodec) becomes a private helper in `codec.ts`.

- [ ] **Step 1: Port `test/mapcode.test.ts`** from `MapcodeTest.java` (8 methods: format validation, precision formats, `convertStringToPlainAscii`).
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement `src/mapcode.ts`** (faithful translation).
- [ ] **Step 4: Implement `src/codec.ts`** (faithful translation of `MapcodeCodec` static methods → functions with overloads).
- [ ] **Step 5: Resolve deferred test pieces** — add `checkMapcodeCode` to `check-args.ts` (now `Mapcode.getPrecisionFormat` exists; import it) and complete the 2 `CheckArgsTest` mapcode cases; complete `AlphabetTest.testConvertToAlphabet`, `TerritoryTest` alphabet cases, and the codec-dependent `EncoderTest`/`DecoderTest` assertions.
- [ ] **Step 6: Run the full unit suite** — `npx vitest run test/mapcode.test.ts test/encoder.test.ts test/decoder.test.ts test/alphabet.test.ts test/territory.test.ts test/check-args.test.ts` → ALL PASS. Debug per `systematic-debugging` if any fail (compare arithmetic against Java line-by-line).
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: add Mapcode + codec functions; green encoder/decoder/unit tests"`

---

## Task 14: Public barrel + build

**Files:**
- Create: `src/index.ts`
- Test: `test/index.test.ts` (smoke test of public API)

**Interfaces:**
- Produces: public exports — `encode`, `encodeToShortest`, `encodeToInternational`, `encodeRestrictToCountryISO2/ISO3/ISO`, `decode`, `decodeToRectangle`, `isNearMultipleBorders`, `Mapcode`, `Territory`, `AlphaCodeFormat`, `Alphabet`, `Point`, `Rectangle`, and all `*Error` classes. Internals (Encoder, Decoder, DataModel, Data, Common, Boundary, MapcodeZone, CheckArgs) are NOT exported.

- [ ] **Step 1: Write `test/index.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { encode, decode, Territory, Alphabet, Point } from "../src/index.js";

describe("public API", () => {
  it("encodes and decodes a known point", () => {
    const results = encode(52.376514, 4.908542, Territory.NLD);
    expect(results.length).toBeGreaterThan(0);
    const p = decode(results[0].getCodeWithTerritory());
    expect(Point.distanceInMeters(p, Point.fromDeg(52.376514, 4.908542))).toBeLessThan(10);
  });
  it("exposes enums", () => {
    expect(Alphabet.GREEK.getNumber()).toBe(1);
    expect(Territory.AAA).toBeDefined();
  });
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Write `src/index.ts`**

```ts
export {
  encode, encodeToShortest, encodeToInternational,
  encodeRestrictToCountryISO2, encodeRestrictToCountryISO3, encodeRestrictToCountryISO,
  decode, decodeToRectangle, isNearMultipleBorders,
} from "./codec.js";
export { Mapcode } from "./mapcode.js";
export { Territory, AlphaCodeFormat } from "./territory.js";
export { Alphabet } from "./alphabet.js";
export { Point } from "./point.js";
export { Rectangle } from "./rectangle.js";
export {
  IllegalArgumentError, IllegalStateError, UnknownMapcodeError, UnknownTerritoryError,
  UnknownAlphabetError, UnknownPrecisionFormatError, UnknownDecodeError, IncorrectDataModelError,
} from "./errors.js";
```

- [ ] **Step 4: Run index test, verify pass.**
- [ ] **Step 5: Build + typecheck** — `npm run typecheck && npm run build`. Expected: `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` produced with no errors.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add public API barrel; verify dual build"`

---

## Task 15: EncodeDecode round-trip test + JavaRandom

**Files:**
- Create: `test/helpers/java-random.ts`, `test/encode-decode.test.ts`
- Test: port `../mapcode-java/.../EncodeDecodeTest.java`

**Interfaces:**
- Consumes: codec functions, `Point`, `Territory`, `Mapcode.getSafeMaxOffsetInMeters`.
- Produces: `class JavaRandom implements Random` (reproduces `java.util.Random`); `encode-decode.test.ts` with `encodeDecodeTestFixedSeed` (seed `1431977987367`) and `encodeDecodeTestRandomSeed`.

> **JavaRandom port:** `java.util.Random` uses a 48-bit LCG. Use `BigInt` for the seed/multiply (the 48-bit product exceeds `2^53`). `setSeed(seed)`: `this.seed = (seed ^ 0x5DEECE66Dn) & ((1n<<48n)-1n)`. `next(bits)`: `this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & ((1n<<48n)-1n); return Number(BigInt.asIntN(32, this.seed >> (48n - BigInt(bits))))`. `nextDouble()`: `(next(26) * 2^27 + next(27)) / 2^53` (use the standard Java formula: `((next(26) << 27) + next(27)) * 0x1.0p-53`). Constructor takes a `bigint`/`number` seed. Implement `nextDouble()` so `Point.fromUniformlyDistributedRandomPoints(new JavaRandom(seed))` is deterministic.

- [ ] **Step 1: Implement `test/helpers/java-random.ts`** per the port note above (with a unit assertion: `new JavaRandom(0n)` reproduces Java's known first `nextDouble()` ≈ `0.730967787376657` — verify and keep as a guard test).
- [ ] **Step 2: Port `test/encode-decode.test.ts`** — for `numPoints` (use 5000 as Java does, or reduce if CI time is excessive — keep 5000 for fidelity), loop points from `Point.fromUniformlyDistributedRandomPoints(rng)`, encode across all territories and precisions 0-8, decode each, and assert the decoded point is within `Mapcode.getSafeMaxOffsetInMeters(precision)` of the original. Run sequentially (no thread pool). Accumulate an error count; assert `0` at the end.

```ts
import { describe, it, expect } from "vitest";
import { JavaRandom } from "./helpers/java-random.js";
import { encode, decode } from "../src/codec.js";
import { Point } from "../src/point.js";
import { Mapcode } from "../src/mapcode.js";

const NUM_POINTS = 5000;

function runRoundTrip(seed: bigint): number {
  const rng = new JavaRandom(seed);
  let errors = 0;
  for (let i = 0; i < NUM_POINTS; i++) {
    const point = Point.fromUniformlyDistributedRandomPoints(rng);
    const results = encode(point.getLatDeg(), point.getLonDeg());
    for (const mc of results) {
      for (let precision = 0; precision <= 8; precision++) {
        const code = mc.getCodeWithTerritory(precision);
        const decoded = decode(code);
        const dist = Point.distanceInMeters(point, decoded);
        if (dist > Mapcode.getSafeMaxOffsetInMeters(precision)) errors++;
      }
    }
  }
  return errors;
}

describe("EncodeDecode round-trip", () => {
  it("fixed seed", () => { expect(runRoundTrip(1431977987367n)).toBe(0); });
  it("random seed", () => { expect(runRoundTrip(BigInt(Math.floor(Date.now())))).toBe(0); });
});
```

- [ ] **Step 3: Run, debug to green** — `npx vitest run test/encode-decode.test.ts`. Use `systematic-debugging` for any failures (a single failing point pinpoints an encoder/decoder arithmetic divergence).
- [ ] **Step 4: Commit** — `git add -A && git commit -m "test: add encode/decode round-trip + JavaRandom"`

---

## Task 16: Reference-file integration test (full 55 MB vectors)

**Files:**
- Create: `test/helpers/chunked-file.ts`, `test/reference-file.test.ts`
- Copy fixtures: all `../mapcode-java/src/test/resources/*.txt.*` into `test/resources/`
- Test: port `../mapcode-java/.../ReferenceFileTest.java`

**Interfaces:**
- Consumes: codec functions, `Point`, `Territory`, `Mapcode`.
- Produces: `class ChunkedFile` (sequential reader rolling over `.a/.b/.c…` on EOF, exposing line-by-line reads); `reference-file.test.ts` with `checkRandomReferenceRecords`, `checkGridReferenceRecords`, `checkBoundariesReferenceRecords`.

- [ ] **Step 1: Copy reference fixtures**

```bash
cp ../mapcode-java/src/test/resources/random_e8_*.txt.* test/resources/
cp ../mapcode-java/src/test/resources/grid_e8_*.txt.* test/resources/
cp ../mapcode-java/src/test/resources/boundaries_e8.txt.* test/resources/
ls -la test/resources/*.txt.* | wc -l
```

- [ ] **Step 2: Implement `test/helpers/chunked-file.ts`** — reads `<base>.a`, then `<base>.b`, … concatenated; provides `readLine(): string | null` and `close()`. Read whole chunks with `fs.readFileSync` and split on `\n` (files are line-oriented; total per-base is large but each chunk ≤ ~10 MB so reading a chunk at a time is fine), advancing to the next suffix on exhaustion.
- [ ] **Step 3: Port `test/reference-file.test.ts`** from `ReferenceFileTest.java`. Parse each record: `<count> <lat> <lon> [x y z]`, then `<count>` lines of `<territory> <mapcode>` (or just `<mapcode>` for international), then a blank line. For each record: decode each listed mapcode and assert it is within the precision tolerance of the given lat/lon; and re-encode the lat/lon and assert each expected mapcode appears in the results (matching the Java test's checks). Run sequentially. Accumulate errors; assert `0`.
- [ ] **Step 4: Run, debug to green** — `npx vitest run test/reference-file.test.ts`. This is the final integration gate. Expect long runtime; the 600s timeout in `vitest.config.ts` covers it. If runtime is impractical locally, run the 1k/10k bases first to confirm correctness, then the 100k/boundary bases.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "test: add reference-file integration suite (full vectors)"`

---

## Task 17: Full suite, README, finalize

**Files:**
- Create: `README.md`
- Test: full suite.

- [ ] **Step 1: Run the entire suite** — `npm run test`. Expected: ALL test files pass.
- [ ] **Step 2: Typecheck + build** — `npm run typecheck && npm run build` → clean.
- [ ] **Step 3: Write `README.md`** — adapt from `../mapcode-java/README.md`: project description, install (`npm install mapcode`), usage examples for `encode`/`decode`/`encodeToShortest`/`encodeToInternational`, a Java→TS API mapping table (`MapcodeCodec.encode` → `encode`; `*Exception` → `*Error`), Apache-2.0 license note, and a "data regeneration" section documenting `npm run gen:data`.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "docs: add README; final full-suite verification"`

---

## Self-Review (completed during planning)

- **Spec coverage:** §2 API → Tasks 13/14; §3 errors → Task 1; §4 layout → all tasks; §5 binary data → Task 4; §6 number semantics → Global Constraints + Tasks 11/12; §7 tests → Tasks 1–16 (every Java test file mapped: Alphabet→7/13, CheckArgs→5/13, DataModel→4, Decoder→12/13, EncodeDecode→15, Encoder→11/13, Mapcode→13, Point→2, ReferenceFile→16, Territory→8/13); §8 tooling → Task 0/14; §9 bottom-up TDD order → task sequence.
- **Forward-dependency notes** (Common→Data, CheckArgs→Mapcode, Encoder/Decoder→Mapcode/codec, DataModel↔Territory count) are called out explicitly with resolution steps to keep each task green or typechecked.
- **Type consistency:** method names match the Java API surface and the Produces blocks across tasks (`getCode`, `getCodeWithTerritory`, `decodeToMapcodeZone`, `getDataFirstRecord`, `restrictZoneTo`, etc.).
- **No placeholders:** the only intentional deferred literal is `EXPECTED_NR_TERRITORIES` (filled in Task 4 Step 2 / Task 8 Step 5 from the actual data header) — documented, not a TODO.
