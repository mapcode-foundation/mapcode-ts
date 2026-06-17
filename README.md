# mapcode — TypeScript / JavaScript Library

Encode a latitude/longitude pair to one or more mapcodes and decode a mapcode string back
to a geographic point. The library is isomorphic: it works in Node.js (ESM and CommonJS) and in the browser
with no external dependencies.

Mapcodes are short, memorable location codes maintained by the
[Stichting Mapcode Foundation](https://www.mapcode.com/).

This is a faithful TypeScript port of the [mapcode-java](https://github.com/mapcode-foundation/mapcode-java) library
(version 2.4.19).

Licensed under the [Apache License, Version 2.0](LICENSE).
Copyright (C) 2014-2024, Stichting Mapcode Foundation. 

---

## Installation

```sh
npm install mapcode
```

---

## Quick start

All entry points are top-level named exports — there is no `MapcodeCodec` class (unlike the Java library).

```typescript
import {
  encode, encodeToShortest, encodeToInternational,
  decode, decodeToRectangle,
  Territory, Alphabet,
} from "mapcode";
```

### Encode a lat/lon to all mapcodes

```typescript
const mapcodes = encode(52.376514, 4.908542);
// Returns an array of Mapcode objects, shortest first within each territory.
for (const m of mapcodes) {
  console.log(m.getCodeWithTerritory()); // e.g. "NLD 49.4V", ..., "AAA VHXGB.1J9J"
}
```

### Restrict encoding to a specific territory

```typescript
const mapcodes = encode(52.376514, 4.908542, Territory.NLD);
// [ "NLD 49.4V", "NLD G9.VWG", "NLD DL6.H9L", "NLD P25Z.N3Z" ]
```

### Get only the shortest mapcode for a territory

```typescript
const m = encodeToShortest(52.376514, 4.908542, Territory.NLD);
console.log(m.getCode());              // "49.4V"
console.log(m.getCodeWithTerritory()); // "NLD 49.4V"
console.log(m.getTerritory().name);    // "NLD"
```

### Get only the international (world-wide) mapcode

```typescript
const m = encodeToInternational(52.376514, 4.908542);
console.log(m.getCode()); // "VHXGB.1J9J"
```

### Decode a mapcode to a Point

```typescript
// Territory prefix in the string, or pass as second argument:
const pt1 = decode("NLD 49.4V");
const pt2 = decode("49.4V", Territory.NLD);

console.log(pt1.getLatDeg()); // 52.376514
console.log(pt1.getLonDeg()); // 4.908543  (may differ slightly from input — decode is lossless to ~1 μ°)

// International mapcode (no territory needed):
const pt3 = decode("VHXGB.1J9J");
```

### Decode to a bounding rectangle

```typescript
const rect = decodeToRectangle("49.4V", Territory.NLD);
console.log(rect.getSouthWest()); // Point { lat: 52.376469°, lon: 4.908471° }
console.log(rect.getNorthEast()); // Point { lat: 52.376559°, lon: 4.908617° }
console.log(rect.getCenter());    // same as decode("49.4V", Territory.NLD)
```

### Using Territory and Alphabet

```typescript
// Territories are static class instances (not a plain enum):
const t = Territory.fromString("NLD");
console.log(t === Territory.NLD); // true
console.log(t.getFullName());     // "Netherlands"

// Request a mapcode rendered in a specific alphabet:
const m = encodeToShortest(37.9715, 23.7263, Territory.GRC);
console.log(m.getCode());                         // Roman: "ΗΠ.Θ2" (decoded from Unicode input)
console.log(m.getCode(Alphabet.GREEK));           // Greek script
```

---

## Java → TypeScript API mapping

| Java (mapcode-java)                         | TypeScript (this library)              |
|---------------------------------------------|----------------------------------------|
| `MapcodeCodec.encode(...)`                  | `encode(...)` (top-level function)     |
| `MapcodeCodec.encodeToShortest(...)`        | `encodeToShortest(...)`                |
| `MapcodeCodec.encodeToInternational(...)`   | `encodeToInternational(...)`           |
| `MapcodeCodec.encodeRestrictToCountryISO2(…)` | `encodeRestrictToCountryISO2(…)`     |
| `MapcodeCodec.encodeRestrictToCountryISO3(…)` | `encodeRestrictToCountryISO3(…)`     |
| `MapcodeCodec.encodeRestrictToCountryISO(…)`  | `encodeRestrictToCountryISO(…)`      |
| `MapcodeCodec.decode(...)`                  | `decode(...)`                          |
| `MapcodeCodec.decodeToRectangle(...)`       | `decodeToRectangle(...)`               |
| `MapcodeCodec.isNearMultipleBorders(...)`   | `isNearMultipleBorders(...)`           |
| `IllegalArgumentException`                  | `IllegalArgumentError`                 |
| `IllegalStateException`                     | `IllegalStateError`                    |
| `UnknownMapcodeException`                   | `UnknownMapcodeError`                  |
| `UnknownTerritoryException`                 | `UnknownTerritoryError`                |
| `UnknownAlphabetException`                  | `UnknownAlphabetError`                 |
| `UnknownPrecisionFormatException`           | `UnknownPrecisionFormatError`          |
| `UnknownDecodeException`                    | `UnknownDecodeError`                   |
| `IncorrectDataModelException`               | `IncorrectDataModelError`              |

Classes that keep their names: `Mapcode`, `Territory`, `AlphaCodeFormat`, `Alphabet`, `Point`, `Rectangle`.

Enums are implemented as classes with static instances (`Territory.NLD`, `Alphabet.GREEK`).
Use `Territory.fromString("NLD")` and `Alphabet.fromString("GREEK")` to look up by name.

---

## Data regeneration

The binary territory data shipped in `src/data/mminfo-data.ts` is generated from `data/mminfo.dat`:

```sh
npm run gen:data
```

Re-run this whenever `data/mminfo.dat` is updated.

---

## Development

```sh
npm test          # run the full test suite (vitest)
npm run build     # compile to dist/ (ESM + CJS + .d.ts via tsup)
npm run typecheck # type-check without emitting
```
