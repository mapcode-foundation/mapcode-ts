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

import { Boundary } from "./boundary.js";
import { checkDefined, checkNonnull } from "./check-args.js";
import { Common } from "./common.js";
import { Data } from "./data.js";
import { DataModel } from "./data-model.js";
import { Decoder } from "./decoder.js";
import { Encoder } from "./encoder.js";
import { UnknownMapcodeError, UnknownTerritoryError } from "./errors.js";
import { Mapcode } from "./mapcode.js";
import { MapcodeZone } from "./mapcode-zone.js";
import { Point } from "./point.js";
import { Rectangle } from "./rectangle.js";
import { Territory } from "./territory.js";

// ----------------------------------------------------------------------------------------------
// Faithful port of com.mapcode.MapcodeCodec. The Java static methods become top-level functions,
// keeping their names and behavior. The (lat, lon) and (point) variants are expressed as
// TypeScript function overloads. Java `int` division truncates toward zero -> Math.trunc.
// ----------------------------------------------------------------------------------------------

const DATA_MODEL = DataModel.getInstance();

// ------------------------------------------------------------------------------------------
// Encoding latitude, longitude to mapcodes.
// ------------------------------------------------------------------------------------------

/**
 * Encode a lat/lon pair (or Point) to a list of mapcodes, optionally restricted to a territory.
 */
export function encode(latDeg: number, lonDeg: number, restrictToTerritory?: Territory | null): Mapcode[];
export function encode(point: Point, restrictToTerritory?: Territory | null): Mapcode[];
export function encode(
  arg0: number | Point,
  arg1?: number | Territory | null,
  arg2?: Territory | null,
): Mapcode[] {
  if (arg0 instanceof Point) {
    const point = arg0;
    const restrictToTerritory = (arg1 as Territory | null | undefined) ?? null;
    checkDefined("point", point);
    return encode(point.getLatDeg(), point.getLonDeg(), restrictToTerritory);
  }
  const latDeg = arg0;
  const lonDeg = arg1 as number;
  const restrictToTerritory = arg2 ?? null;
  const results = Encoder.encode(latDeg, lonDeg, restrictToTerritory, false);
  return results;
}

/**
 * Encode a lat/lon pair (or Point) to a list of mapcodes restricted to an ISO 3166 country code, 2 characters.
 */
export function encodeRestrictToCountryISO2(latDeg: number, lonDeg: number, countryISO2: string): Mapcode[];
export function encodeRestrictToCountryISO2(point: Point, countryISO2: string): Mapcode[];
export function encodeRestrictToCountryISO2(
  arg0: number | Point,
  arg1: number | string,
  arg2?: string,
): Mapcode[] {
  if (arg0 instanceof Point) {
    const point = arg0;
    const countryISO2 = arg1 as string;
    checkNonnull("point", point);
    return encodeRestrictToCountryISO2(point.getLatDeg(), point.getLonDeg(), countryISO2);
  }
  const latDeg = arg0;
  const lonDeg = arg1 as number;
  const countryISO2 = arg2 as string;
  checkNonnull("countryISO2", countryISO2);
  const countryISO3 = Territory.fromCountryISO2(countryISO2).toString();
  const prefix = countryISO2.toUpperCase() + "-";
  const mapcodes = encode(latDeg, lonDeg);
  const filtered: Mapcode[] = [];
  for (const mapcode of mapcodes) {
    if (mapcode.getTerritory().toString().startsWith(prefix)) {
      // If the mapcode starts with the ISO 2 code, it's OK.
      filtered.push(mapcode);
    } else if (mapcode.getTerritory().toString() === countryISO3) {
      // Otherwise, if it's the correct country ISO 3 code, it's also OK.
      filtered.push(mapcode);
    }
  }
  return filtered;
}

/**
 * Encode a lat/lon pair (or Point) to a list of mapcodes restricted to an ISO 3166 country code, 3 characters.
 */
export function encodeRestrictToCountryISO3(latDeg: number, lonDeg: number, countryISO3: string): Mapcode[];
export function encodeRestrictToCountryISO3(point: Point, countryISO3: string): Mapcode[];
export function encodeRestrictToCountryISO3(
  arg0: number | Point,
  arg1: number | string,
  arg2?: string,
): Mapcode[] {
  if (arg0 instanceof Point) {
    const point = arg0;
    const countryISO3 = arg1 as string;
    checkNonnull("point", point);
    return encodeRestrictToCountryISO3(point.getLatDeg(), point.getLonDeg(), countryISO3);
  }
  const latDeg = arg0;
  const lonDeg = arg1 as number;
  const countryISO3 = arg2 as string;
  checkNonnull("countryISO3", countryISO3);
  return encodeRestrictToCountryISO2(latDeg, lonDeg, Territory.getCountryISO2FromISO3(countryISO3));
}

/**
 * Encode a lat/lon pair (or Point) to a list of mapcodes restricted to an ISO 3166 country code, 2 or 3 characters.
 */
export function encodeRestrictToCountryISO(latDeg: number, lonDeg: number, countryISO: string): Mapcode[];
export function encodeRestrictToCountryISO(point: Point, countryISO: string): Mapcode[];
export function encodeRestrictToCountryISO(
  arg0: number | Point,
  arg1: number | string,
  arg2?: string,
): Mapcode[] {
  if (arg0 instanceof Point) {
    const point = arg0;
    const countryISO = arg1 as string;
    checkNonnull("point", point);
    return encodeRestrictToCountryISO(point.getLatDeg(), point.getLonDeg(), countryISO);
  }
  const latDeg = arg0;
  const lonDeg = arg1 as number;
  const countryISO = arg2 as string;
  checkNonnull("countryISO", countryISO);
  let mapcodes: Mapcode[];
  try {
    mapcodes = encodeRestrictToCountryISO2(latDeg, lonDeg, countryISO);
  } catch {
    mapcodes = encodeRestrictToCountryISO3(latDeg, lonDeg, countryISO);
  }
  return mapcodes;
}

/**
 * Encode a lat/lon pair (or Point) to its shortest mapcode with territory information.
 */
export function encodeToShortest(latDeg: number, lonDeg: number, restrictToTerritory: Territory): Mapcode;
export function encodeToShortest(point: Point, restrictToTerritory: Territory): Mapcode;
export function encodeToShortest(
  arg0: number | Point,
  arg1: number | Territory,
  arg2?: Territory,
): Mapcode {
  if (arg0 instanceof Point) {
    const point = arg0;
    const restrictToTerritory = arg1 as Territory;
    checkDefined("point", point);
    return encodeToShortest(point.getLatDeg(), point.getLonDeg(), restrictToTerritory);
  }
  const latDeg = arg0;
  const lonDeg = arg1 as number;
  const restrictToTerritory = arg2 as Territory;
  checkNonnull("restrictToTerritory", restrictToTerritory);

  // Call mapcode encoder.
  const results = Encoder.encode(latDeg, lonDeg, restrictToTerritory, /* Stop with one result: */ true);
  if (results.length === 0) {
    throw new UnknownMapcodeError(
      "No Mapcode for lat=" + latDeg + ", lon=" + lonDeg + ", territory=" + restrictToTerritory,
    );
  }
  return results[0];
}

/**
 * Encode a lat/lon pair (or Point) to its unambiguous, international mapcode.
 */
export function encodeToInternational(latDeg: number, lonDeg: number): Mapcode;
export function encodeToInternational(point: Point): Mapcode;
export function encodeToInternational(arg0: number | Point, arg1?: number): Mapcode {
  if (arg0 instanceof Point) {
    const point = arg0;
    checkDefined("point", point);
    return encodeToInternational(point.getLatDeg(), point.getLonDeg());
  }
  const latDeg = arg0;
  const lonDeg = arg1 as number;

  // Call mapcode encoder.
  const results = encode(latDeg, lonDeg, Territory.AAA);
  return results[results.length - 1];
}

// ------------------------------------------------------------------------------------------
// Decoding mapcodes back to latitude, longitude.
// ------------------------------------------------------------------------------------------

/**
 * Decode a mapcode to a Point. A reference territory may be supplied for disambiguation.
 */
export function decode(mapcode: string, defaultTerritoryContext?: Territory | null): Point {
  checkNonnull("mapcode", mapcode);

  const mapcodeZone = decodeToMapcodeZone(mapcode, defaultTerritoryContext ?? null);
  if (mapcodeZone.isEmpty()) {
    throw new UnknownMapcodeError(
      "Unknown mapcode, mapcode=" + mapcode + ", territoryContext=" + defaultTerritoryContext,
    );
  }
  return mapcodeZone.getCenter();
}

/**
 * Decode a mapcode to a Rectangle, which defines the valid zone for a mapcode. The boundaries of the
 * mapcode zone are inclusive for the South and West borders and exclusive for the North and East borders.
 */
export function decodeToRectangle(mapcode: string, defaultTerritoryContext?: Territory | null): Rectangle {
  checkNonnull("mapcode", mapcode);
  const mapcodeZone = decodeToMapcodeZone(mapcode, defaultTerritoryContext ?? null);
  if (mapcodeZone.isEmpty()) {
    throw new UnknownMapcodeError(
      "Unknown mapcode, mapcode=" + mapcode + ", territoryContext=" + defaultTerritoryContext,
    );
  }
  const southWest = Point.fromLatLonFractions(mapcodeZone.getLatFractionMin(), mapcodeZone.getLonFractionMin());
  const northEast = Point.fromLatLonFractions(mapcodeZone.getLatFractionMax(), mapcodeZone.getLonFractionMax());
  const rectangle = new Rectangle(southWest, northEast);
  return rectangle;
}

/**
 * Is coordinate near multiple territory borders?
 *
 * @return true iff the coordinate is near more than one territory border (and thus encode(decode(M)) may not produce M).
 */
export function isNearMultipleBorders(point: Point, territory: Territory): boolean {
  checkDefined("point", point);
  if (territory !== Territory.AAA) {
    const territoryNumber = territory.getNumber();
    const parentTerritory = territory.getParentTerritory();
    if (parentTerritory !== null) {
      // There is a parent! check its borders as well...
      if (isNearMultipleBorders(point, parentTerritory)) {
        return true;
      }
    }
    let nrFound = 0;
    const fromTerritoryRecord = DATA_MODEL.getDataFirstRecord(territoryNumber);
    const uptoTerritoryRecord = DATA_MODEL.getDataLastRecord(territoryNumber);
    for (let territoryRecord = uptoTerritoryRecord; territoryRecord >= fromTerritoryRecord; territoryRecord--) {
      if (!Data.isRestricted(territoryRecord)) {
        const boundary = Boundary.createBoundaryForTerritoryRecord(territoryRecord);
        const xdiv8 = Math.trunc(Common.xDivider(boundary.getLatMicroDegMin(), boundary.getLatMicroDegMax()) / 4);
        if (boundary.extendBoundary(60, xdiv8).containsPoint(point)) {
          if (!boundary.extendBoundary(-60, -xdiv8).containsPoint(point)) {
            nrFound++;
            if (nrFound > 1) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function decodeToMapcodeZone(mapcode: string, defaultTerritoryContext: Territory | null): MapcodeZone {
  checkNonnull("mapcode", mapcode);
  let mapcodeClean = Mapcode.convertStringToPlainAscii(mapcode.trim()).toUpperCase();

  // Determine territory from mapcode.
  let territory: Territory;
  const matcherTerritory = Mapcode.PATTERN_TERRITORY.exec(mapcodeClean);
  if (matcherTerritory !== null) {
    // Use the territory code from the string.
    const territoryName = mapcodeClean.substring(matcherTerritory.index, matcherTerritory.index + matcherTerritory[0].length).trim();
    try {
      territory = Territory.fromString(territoryName);
    } catch (ignored) {
      if (ignored instanceof UnknownTerritoryError) {
        throw new UnknownMapcodeError("Wrong territory code: " + territoryName);
      }
      throw ignored;
    }

    // Cut off the territory part.
    mapcodeClean = mapcodeClean.substring(matcherTerritory.index + matcherTerritory[0].length).trim();
  } else {
    // No territory code was supplied in the string, use specified territory context parameter.
    territory = defaultTerritoryContext !== null ? defaultTerritoryContext : Territory.AAA;
  }

  // Throws an exception if the format is incorrect.
  Mapcode.getPrecisionFormat(mapcodeClean);
  return Decoder.decodeToMapcodeZone(mapcodeClean, territory);
}
