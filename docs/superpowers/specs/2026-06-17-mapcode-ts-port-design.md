# Design: mapcode-ts — TypeScript port of mapcode-java

**Date:** 2026-06-17
**Status:** Approved (pending spec review)
**Source:** `com.mapcode:mapcode` 2.4.19 (https://github.com/mapcode-foundation/mapcode-java)

## 1. Goal & scope

A faithful 1:1 port of the Java mapcode library to TypeScript. Same encode/decode
algorithm, same embedded data, same observable behavior, and the **same test
coverage** — all 10 Java test files (~181 test methods), including the full 55 MB of
reference vectors.

The public API keeps the **same concepts and names** as Java (`Territory.NLD`,
`Alphabet.GREEK`, `Mapcode`, `Point`, `Rectangle`) with two deliberate, TypeScript-idiomatic
deviations:

1. The codec is exposed as **top-level functions** (`encode`, `decode`, …) rather than a
   `MapcodeCodec` static class.
2. Error classes follow the TypeScript `*Error` naming convention rather than Java's
   `*Exception`.

### Foundational decisions (locked)

| Decision | Choice |
| --- | --- |
| Target runtime | **Isomorphic** (Node + browser); no `fs`/`path` dependency in the library |
| Test framework | **Vitest** |
| Reference vectors | **Commit all** (full 55 MB), port chunked-file reading |
| Module format | **Dual ESM + CJS** with type declarations (via tsup) |
| Codec API style | **Fully idiomatic top-level functions** (no `MapcodeCodec` wrapper) |
| Error naming | **TS convention** (`*Error`) |

## 2. Public API surface

### Codec functions (replaces `MapcodeCodec`)

```ts
encode(latDeg: number, lonDeg: number, restrictToTerritory?: Territory | null): Mapcode[]
encode(point: Point, restrictToTerritory?: Territory | null): Mapcode[]

encodeToShortest(latDeg: number, lonDeg: number, restrictToTerritory: Territory): Mapcode
encodeToShortest(point: Point, restrictToTerritory: Territory): Mapcode

encodeToInternational(latDeg: number, lonDeg: number): Mapcode
encodeToInternational(point: Point): Mapcode

encodeRestrictToCountryISO2(latDeg: number, lonDeg: number, countryISO2: string): Mapcode[]
encodeRestrictToCountryISO2(point: Point, countryISO2: string): Mapcode[]
encodeRestrictToCountryISO3(latDeg: number, lonDeg: number, countryISO3: string): Mapcode[]
encodeRestrictToCountryISO3(point: Point, countryISO3: string): Mapcode[]
encodeRestrictToCountryISO(latDeg: number, lonDeg: number, countryISO: string): Mapcode[]
encodeRestrictToCountryISO(point: Point, countryISO: string): Mapcode[]

decode(mapcode: string, defaultTerritoryContext?: Territory | null): Point
decodeToRectangle(mapcode: string, defaultTerritoryContext?: Territory | null): Rectangle

isNearMultipleBorders(point: Point, territory: Territory): boolean
```

Java overloads (`(lat, lon)` vs `(point)`) become **TypeScript function-overload
signatures** with a single implementation.

### Types / classes (names mirror Java)

- **`Mapcode`** — class. Constructor `(code, territory)`. Instance methods:
  `getCode(precision?, alphabet?)`, `getCodeWithTerritory(precision?, alphabet?)`,
  `getCodeWithTerritoryFullname(precision?, alphabet?)`, `getTerritory()`, `toString()`,
  `equals(other)`. Static helpers: `getPrecisionFormat(s)`, `isValidMapcodeFormat(s)`,
  `containsTerritory(s)`, `getSafeMaxOffsetInMeters(precision)`. Static regex string
  constants (`REGEX_MAPCODE`, `REGEX_TERRITORY`, `REGEX_CODE_PREFIX`,
  `REGEX_CODE_POSTFIX`, `REGEX_CODE_PRECISION`).
  - Overloaded `getCode`/`getCodeWith*` (`()`, `(precision)`, `(alphabet)`,
    `(precision, alphabet)`) → overload signatures over `(precision?: number, alphabet?: Alphabet)`.
- **`Territory`** — class with `static readonly` instances (`Territory.NLD`, `Territory.USA`,
  `Territory.AAA`, …, ~530+ constants). Instance methods: `getFullName()`, `getAliases()`,
  `getFullNameAliases()`, `getParentTerritory()`, `getAlphabets()`, `getNumber()`,
  `isSubdivision()`, `hasSubdivisions()`, `toString(alphabet?)`,
  `toAlphaCode(format, alphabet?)`. Statics: `fromString(s, parent?)`,
  `fromCountryISO2/ISO3/ISO(s)`, `fromNumber(n)`, `getCountryISO2FromISO3`,
  `getCountryISO3FromISO2`, `allCountryISO2Codes()`, `allCountryISO3Codes()`, `values()`,
  `PARENT_TERRITORIES`. Nested `AlphaCodeFormat` (`INTERNATIONAL`, `MINIMAL_UNAMBIGUOUS`,
  `MINIMAL`).
- **`Alphabet`** — class with `static readonly` instances (`Alphabet.ROMAN`,
  `Alphabet.GREEK`, … 28 constants). `getNumber()`, static `fromString(s)`, `values()`.
- **`Point`** — `fromDeg`, `fromMicroDeg`, `fromLatLonFractions` (internal),
  `fromUniformlyDistributedRandomPoints(random?)`, `getLatDeg/getLonDeg`,
  `getLatMicroDeg/getLonMicroDeg`, `distanceInMeters`, `degreesLatToMeters`,
  `degreesLonToMetersAtLat`, `metersToDegreesLonAtLat`, `isDefined()`, `toString()`,
  `equals()`, plus the static numeric constants. Construction stays via static factories.
- **`Rectangle`** — `getSouthWest()`, `getNorthEast()`, `getCenter()`, `isDefined()`,
  `toString()`, `equals()`.

Both `Territory` and `Alphabet` use `static readonly` singleton instances, so reference
equality (`===`) works exactly like Java enum identity. Each maintains a `values()` array
and a number→instance lookup map.

## 3. Errors (TypeScript `*Error` convention)

All extend `Error` and set `name` / prototype correctly for `instanceof`.

| TypeScript class | Extends | Java origin |
| --- | --- | --- |
| `IllegalArgumentError` | `Error` | `java.lang.IllegalArgumentException` |
| `IllegalStateError` | `Error` | `java.lang.IllegalStateException` |
| `UnknownMapcodeError` | `Error` | `UnknownMapcodeException` (checked) |
| `UnknownTerritoryError` | `IllegalArgumentError` | `UnknownTerritoryException` (carries optional `code: number`) |
| `UnknownAlphabetError` | `IllegalArgumentError` | `UnknownAlphabetException` |
| `UnknownPrecisionFormatError` | `IllegalArgumentError` | `UnknownPrecisionFormatException` |
| `UnknownDecodeError` | `IllegalStateError` | `UnknownDecodeException` |
| `IncorrectDataModelError` | `IllegalStateError` | `IncorrectDataModelException` |

The Java→TS mapping is documented in the README so consumers familiar with the Java API
can cross-reference, but TypeScript users see idiomatic `*Error` names.

## 4. Module layout (`src/`)

One file per Java class; internals are not re-exported from `index.ts`.

```
src/
  index.ts            # public barrel (codec fns, Mapcode, Territory, Alphabet, Point, Rectangle, errors)
  codec.ts            # encode / decode / … top-level functions (was MapcodeCodec)
  mapcode.ts          # Mapcode
  territory.ts        # Territory + AlphaCodeFormat
  alphabet.ts         # Alphabet
  point.ts            # Point
  rectangle.ts        # Rectangle
  encoder.ts          # Encoder (internal)
  decoder.ts          # Decoder (internal)
  data-model.ts       # DataModel (internal, singleton + byte-array constructor)
  data.ts             # Data flag accessors (internal)
  common.ts           # Common constants/helpers (internal)
  boundary.ts         # Boundary (internal)
  mapcode-zone.ts     # MapcodeZone (internal)
  check-args.ts       # argument validation helpers (internal)
  errors.ts           # error classes
  data/
    mminfo-data.ts    # GENERATED: base64 of mminfo.dat -> Uint8Array
scripts/
  generate-data.mts   # regenerates src/data/mminfo-data.ts from the committed mminfo.dat
data/
  mminfo.dat          # committed copy of the binary data (source of truth for the generator)
```

## 5. Binary data file (isomorphic loading)

- `mminfo.dat` (328 KB) is committed under `data/`.
- `scripts/generate-data.mts` reads it and emits `src/data/mminfo-data.ts`, which exports
  the bytes as a base64 string decoded to a `Uint8Array` at module load. This bundles
  cleanly for both Node and browsers with **no `fs`/`path` dependency**.
- `DataModel` parses the `Uint8Array` via `DataView` (little-endian) — matching Java's
  `readIntLoHi` / `readLongLoHi`. It is a singleton over the embedded data, **and** accepts
  an arbitrary byte array so `DataModelTest` can feed the malformed `mminfo_*.dat` fixtures.
- Header validation mirrors Java: magic bytes `MC`, version ≥ 220, and total-size check
  against `nrTerritories` / `nrTerritoryRecords`; failures throw `IncorrectDataModelError`.

## 6. Number semantics (core porting risk)

- **Bitwise ops**: JS `&`, `|`, `<<`, `>>`, `>>>` operate on 32-bit ints, matching Java
  `int`. Bit-packed flag extraction (`Data`, `DataModel`, `Common`) ports directly.
- **Integer division**: Java truncates toward zero. Use `Math.trunc(a / b)` everywhere Java
  does `int / int`.
- **Modulo**: Java `%` and JS `%` share truncated-toward-zero semantics — no change needed.
- **`char` arithmetic**: use `String.prototype.charCodeAt`.
- **Magnitudes**: micro-degrees (≤ 360_000_000) and fraction values stay well within `2^53`,
  so doubles are exact. The `decodeBase31` and `decodeExtension` accumulation loops will be
  audited specifically; where a product could exceed int32, use `Math.imul` / `| 0` to match
  Java overflow behavior.

## 7. Tests (Vitest, full fidelity)

- **Every Java test file ported 1:1** to `test/*.test.ts`:
  `alphabet.test.ts`, `check-args.test.ts`, `data-model.test.ts`, `decoder.test.ts`,
  `encode-decode.test.ts`, `encoder.test.ts`, `mapcode.test.ts`, `point.test.ts`,
  `reference-file.test.ts`, `territory.test.ts`.
- **Fixtures** (`mminfo_*.dat`, the `.txt.*` reference chunks) are committed under
  `test/resources/` and read via Node `fs` in tests. The tests are **Node-only** even though
  the library itself is isomorphic.
- Port the **`ChunkedFile`** reader (rolls over `.a/.b/.c…` on EOF) for the reference vectors.
- Java's `ExecutorService` parallelism → **sequential** (or lightly async-batched) JS:
  single-threaded but correct. Parallelism was only a test speedup and is dropped.
- A small **`JavaRandom`** class reproduces `java.util.Random`'s 48-bit LCG so the fixed-seed
  test (`1431977987367`) is deterministic. `Point.fromUniformlyDistributedRandomPoints`
  accepts a `Random`-like object (interface with the methods it needs) and defaults to a
  `Math.random`-backed implementation.
- Additional TS-specific tests may be added where helpful (e.g. base64 data decoding,
  isomorphic loading), **without removing** any ported Java test.

## 8. Tooling & packaging

- TypeScript **strict** mode.
- **tsup** → dual ESM + CJS bundles + `.d.ts`; `exports` map in `package.json`.
- **Vitest** for tests.
- Node 18+ engine; browser-compatible output.
- Proposed npm package name: **`mapcode`** (adjustable before publish).
- Apache-2.0 license, `NOTICE`, and a README carried/adapted from the Java project,
  including the Java→TS API mapping table.

## 9. Development approach

Strict **TDD per superpowers**, **bottom-up**:

1. Leaf modules first: **errors, `Point`, `Common`, `Data`, `Alphabet`**
2. **`DataModel`** + embedded data
3. **`Territory`**
4. **`Boundary` / `MapcodeZone`**
5. **`Encoder`**
6. **`Decoder`**
7. **codec functions**
8. **`Mapcode`**

Each Java test file is ported alongside its module, and the relevant tests are run after
every ported function (red → green → refactor). New tests may be added where useful, but all
ported Java tests are kept. The **reference-vector suite** (`reference-file.test.ts`) is the
final integration gate and must pass against the full committed vectors.

## 10. Out of scope

- `log4j.xml` (logging config) and the `show3d/` Processing visualization — not ported.
- The Maven/Java build infrastructure.
- No new mapcode features beyond what Java 2.4.19 provides.
