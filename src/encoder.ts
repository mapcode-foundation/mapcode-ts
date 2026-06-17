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

import { aeuPack } from "./alphabet-converter.js";
import { Boundary } from "./boundary.js";
import { Common } from "./common.js";
import { Data } from "./data.js";
import { DataModel } from "./data-model.js";
import { Mapcode } from "./mapcode.js";
import { Point } from "./point.js";
import { Territory } from "./territory.js";

// ----------------------------------------------------------------------------------------------
// Package private implementation class. For internal use within the Mapcode implementation only.
// ----------------------------------------------------------------------------------------------
//
// Faithful port of com.mapcode.Encoder. Java `int` division truncates toward zero -> Math.trunc.
// Java `char` arithmetic -> charCodeAt. Bitwise operators map directly to JS (int32) semantics.

const DATA_MODEL = DataModel.getInstance();

const createBoundaryForTerritoryRecord = Boundary.createBoundaryForTerritoryRecord.bind(Boundary);
const { X_SIDE, Y_SIDE, NC, xDivider, countCityCoordinatesForCountry, getFirstNamelessRecord } = Common;

const ENCODE_CHARS = Data.ENCODE_CHARS;

function encodeExtension(
  pointToEncode: Point,
  extrax4: number,
  extray: number,
  dividerx4: number,
  dividery: number,
  ydirection: number,
): string {
  let extraDigits = 8; // always generate 8 digits

  let factorx = Point.MAX_PRECISION_FACTOR * dividerx4;
  let factory = Point.MAX_PRECISION_FACTOR * dividery;
  let valx = Point.MAX_PRECISION_FACTOR * extrax4 + pointToEncode.getLonFraction();
  let valy = Point.MAX_PRECISION_FACTOR * extray + ydirection * pointToEncode.getLatFraction();

  let sb = "-";

  for (;;) {
    factorx /= 30;
    const gx = Math.trunc(valx / factorx);

    factory /= 30;
    const gy = Math.trunc(valy / factory);

    sb += ENCODE_CHARS[Math.trunc(gy / 5) * 5 + Math.trunc(gx / 6)];
    --extraDigits;
    if (extraDigits === 0) {
      break;
    }

    sb += ENCODE_CHARS[(gy % 5) * 6 + (gx % 6)];
    --extraDigits;
    if (extraDigits === 0) {
      break;
    }

    valx -= factorx * gx;
    valy -= factory * gy;
  }
  return sb;
}

function encodeGrid(territoryNumber: number, pointToEncode: Point): string {
  let codexm = Data.getCodex(territoryNumber);
  const orgcodex = codexm;
  if (codexm === 21) {
    codexm = 22;
  } else if (codexm === 14) {
    codexm = 23;
  }
  const prelen = Math.trunc(codexm / 10);
  const postlen = codexm % 10;
  let divx: number;
  let divy = DATA_MODEL.getSmartDiv(territoryNumber);
  if (divy === 1) {
    divx = X_SIDE[prelen];
    divy = Y_SIDE[prelen];
  } else {
    divx = Math.trunc(NC[prelen] / divy);
  }

  const minx = createBoundaryForTerritoryRecord(territoryNumber).getLonMicroDegMin();
  const miny = createBoundaryForTerritoryRecord(territoryNumber).getLatMicroDegMin();
  const maxx = createBoundaryForTerritoryRecord(territoryNumber).getLonMicroDegMax();
  const maxy = createBoundaryForTerritoryRecord(territoryNumber).getLatMicroDegMax();

  const ygridsize = Math.trunc((maxy - miny + divy - 1) / divy);
  let rely = pointToEncode.getLatMicroDeg() - miny;
  rely = Math.trunc(rely / ygridsize);

  const xgridsize = Math.trunc((maxx - minx + divx - 1) / divx);
  let x = pointToEncode.getLonMicroDeg();
  let relx = x - minx;
  if (relx < 0) {
    x += Point.MICRO_DEG_360;
    relx += Point.MICRO_DEG_360;
  } else if (relx >= Point.MICRO_DEG_360) {
    x -= Point.MICRO_DEG_360;
    relx -= Point.MICRO_DEG_360;
  }
  if (relx < 0) {
    return "";
  }
  relx = Math.trunc(relx / xgridsize);
  if (relx >= divx || rely >= divy) {
    return "";
  }

  let v: number;
  if (divx !== divy && prelen > 2) {
    v = encodeSixWide(relx, rely, divx, divy);
  } else {
    v = relx * divy + divy - 1 - rely;
  }

  let result = encodeBase31(v, prelen);

  if (prelen === 4 && divx === 961 && divy === 961) {
    result = String(result.charAt(0)) + result.charAt(2) + result.charAt(1) + result.charAt(3);
  }

  rely = miny + rely * ygridsize;
  relx = minx + relx * xgridsize;

  const dividery = Math.trunc((ygridsize + Y_SIDE[postlen] - 1) / Y_SIDE[postlen]);
  const dividerx = Math.trunc((xgridsize + X_SIDE[postlen] - 1) / X_SIDE[postlen]);

  result += ".";

  let difx = x - relx;
  let dify = pointToEncode.getLatMicroDeg() - rely;

  const extrax = difx % dividerx;
  const extray = dify % dividery;

  difx = Math.trunc(difx / dividerx);
  dify = Math.trunc(dify / dividery);

  dify = Y_SIDE[postlen] - 1 - dify;
  if (postlen === 3) {
    result += encodeTriple(difx, dify);
  } else {
    let postfix = encodeBase31(difx * Y_SIDE[postlen] + dify, postlen);
    if (postlen === 4) {
      postfix = String(postfix.charAt(0)) + postfix.charAt(2) + postfix.charAt(1) + postfix.charAt(3);
    }
    result += postfix;
  }

  if (orgcodex === 14) {
    result = result.charAt(0) + "." + result.charAt(1) + result.substring(3);
  }

  result += encodeExtension(pointToEncode, extrax << 2, extray, dividerx << 2, dividery, 1); // grid

  return Data.headerLetter(territoryNumber) + result;
}

function encodeAutoHeader(pointToEncode: Point, territoryRecord: number): string {
  let stringBuilder = "";
  const codexm = Data.getCodex(territoryRecord);
  let storageStart = 0;

  // search back to first pipe star
  let firstindex = territoryRecord;
  while (
    Data.getTerritoryRecordType(firstindex - 1) > Data.TERRITORY_RECORD_TYPE_PIPE &&
    Data.getCodex(firstindex - 1) === codexm
  ) {
    firstindex--;
  }

  let i = firstindex;
  for (;;) {
    const maxx = createBoundaryForTerritoryRecord(i).getLonMicroDegMax();
    const maxy = createBoundaryForTerritoryRecord(i).getLatMicroDegMax();
    const minx = createBoundaryForTerritoryRecord(i).getLonMicroDegMin();
    const miny = createBoundaryForTerritoryRecord(i).getLatMicroDegMin();

    let h = Math.trunc((maxy - miny + 89) / 90);
    const xdiv = xDivider(miny, maxy);
    let w = Math.trunc(((maxx - minx) * 4 + xdiv - 1) / xdiv);

    h = 176 * Math.trunc((h + 176 - 1) / 176);
    w = 168 * Math.trunc((w + 168 - 1) / 168);

    let product = Math.trunc(w / 168) * Math.trunc(h / 176) * 961 * 31;

    if (Data.getTerritoryRecordType(i) === Data.TERRITORY_RECORD_TYPE_PLUS) {
      // plus pipe
      const goodRounder = codexm >= 23 ? 961 * 961 * 31 : 961 * 961;
      product = Math.trunc((storageStart + product + goodRounder - 1) / goodRounder) * goodRounder - storageStart;
    }

    if (i === territoryRecord) {
      const dividerx = Math.trunc((maxx - minx + w - 1) / w);
      const vx = Math.trunc((pointToEncode.getLonMicroDeg() - minx) / dividerx);
      const extrax = (pointToEncode.getLonMicroDeg() - minx) % dividerx;

      const dividery = Math.trunc((maxy - miny + h - 1) / h);
      let vy = Math.trunc((maxy - pointToEncode.getLatMicroDeg()) / dividery);
      let extray = (maxy - pointToEncode.getLatMicroDeg()) % dividery;

      let value = Math.trunc(vx / 168) * Math.trunc(h / 176);
      if (extray === 0 && pointToEncode.getLatFraction() > 0) {
        vy--;
        extray += dividery;
      }
      value += Math.trunc(vy / 176);

      const codexlen = Math.trunc(codexm / 10) + (codexm % 10);
      stringBuilder += encodeBase31(Math.trunc(storageStart / (961 * 31)) + value, codexlen - 2);
      stringBuilder += ".";
      stringBuilder += encodeTriple(vx % 168, vy % 176);

      stringBuilder += encodeExtension(pointToEncode, extrax << 2, extray, dividerx << 2, dividery, -1); // AutoHeader
      return stringBuilder;
    }

    storageStart += product;
    i++;
  }
}

function encodeNameless(pointToEncode: Point, territoryRecord: number, firstTerritoryRecord: number): string {
  // mid-level encode/decode
  // returns "" in case of (argument) error
  const codexm = Data.getCodex(territoryRecord);
  const codexlen = Math.trunc(codexm / 10) + (codexm % 10);
  const firstNamelessRecord = getFirstNamelessRecord(codexm, territoryRecord, firstTerritoryRecord);
  const a = countCityCoordinatesForCountry(codexm, territoryRecord, firstTerritoryRecord);
  const p = Math.trunc(31 / a);
  const r = 31 % a;
  const nrX = territoryRecord - firstNamelessRecord;

  let storage_offset: number;

  if (codexm !== 21 && a <= 31) {
    storage_offset = (nrX * p + (nrX < r ? nrX : r)) * (961 * 961);
  } else if (codexm !== 21 && a < 62) {
    if (nrX < 62 - a) {
      storage_offset = nrX * 961 * 961;
    } else {
      storage_offset = (62 - a + Math.trunc((nrX - 62 + a) / 2)) * 961 * 961;
      if (((nrX + a) & 1) !== 0) {
        storage_offset += 16 * 961 * 31;
      }
    }
  } else {
    const basePower = codexm === 21 ? 961 * 961 : 961 * 961 * 31;
    let basePowerA = Math.trunc(basePower / a);
    if (a === 62) {
      basePowerA++;
    } else {
      basePowerA = 961 * Math.trunc(basePowerA / 961);
    }

    storage_offset = nrX * basePowerA;
  }

  let side = DATA_MODEL.getSmartDiv(territoryRecord);
  const orgSide = side;
  let xSide = side;

  const maxy = createBoundaryForTerritoryRecord(territoryRecord).getLatMicroDegMax();
  const minx = createBoundaryForTerritoryRecord(territoryRecord).getLonMicroDegMin();
  const miny = createBoundaryForTerritoryRecord(territoryRecord).getLatMicroDegMin();

  const dividerx4 = xDivider(miny, maxy);
  const xFracture = Math.trunc(pointToEncode.getLonFraction() / 810000);
  const dminx = pointToEncode.getLonMicroDeg() - minx;
  const dx = Math.trunc((4 * dminx + xFracture) / dividerx4);
  const extrax4 = 4 * dminx - dx * dividerx4; // like modulus, but with floating point value

  const dividery = 90;
  const dmaxy = maxy - pointToEncode.getLatMicroDeg();
  let dy = Math.trunc(dmaxy / dividery);
  let extray = dmaxy % dividery;

  if (extray === 0 && pointToEncode.getLatFraction() > 0) {
    dy--;
    extray += dividery;
  }

  let v = storage_offset;
  if (Data.isSpecialShape(territoryRecord)) {
    xSide *= side;
    side = 1 + Math.trunc((maxy - miny) / 90);
    xSide = Math.trunc(xSide / side);
    v += encodeSixWide(dx, side - 1 - dy, xSide, side);
  } else {
    v += dx * side + dy;
  }

  let result = encodeBase31(v, codexlen + 1);

  if (codexlen === 3) {
    result = result.substring(0, 2) + "." + result.substring(2);
  } else if (codexlen === 4) {
    if (codexm === 22 && a < 62 && orgSide === 961 && !Data.isSpecialShape(territoryRecord)) {
      result = result.substring(0, 2) + result.charAt(3) + result.charAt(2) + result.charAt(4);
    }
    if (codexm === 13) {
      result = result.substring(0, 2) + "." + result.substring(2);
    } else {
      result = result.substring(0, 3) + "." + result.substring(3);
    }
  }
  result += encodeExtension(pointToEncode, extrax4, extray, dividerx4, dividery, -1); // for encodeNameless

  return result;
}

function encodeBase31(argValue: number, argNrChars: number): string {
  let value = argValue;
  let nrChars = argNrChars;
  let result = "";
  while (nrChars > 0) {
    nrChars--;
    result = ENCODE_CHARS[value % 31] + result;
    value = Math.trunc(value / 31);
  }
  return result;
}

function encodeSixWide(x: number, y: number, width: number, height: number): number {
  let d: number;
  let col = Math.trunc(x / 6);
  const maxcol = Math.trunc((width - 4) / 6);
  if (col >= maxcol) {
    col = maxcol;
    d = width - maxcol * 6;
  } else {
    d = 6;
  }
  return height * 6 * col + (height - 1 - y) * d + x - col * 6;
}

function encodeTriple(difx: number, dify: number): string {
  if (dify < 4 * 34) {
    return (
      ENCODE_CHARS[Math.trunc(difx / 28) + 6 * Math.trunc(dify / 34)] +
      encodeBase31((difx % 28) * 34 + (dify % 34), 2)
    );
  } else {
    return ENCODE_CHARS[Math.trunc(difx / 24) + 24] + encodeBase31((difx % 24) * 40 + dify - 136, 2);
  }
}

function encodeInternal(
  argLatDeg: number,
  argLonDeg: number,
  territory: Territory | null,
  limitToOneResult: boolean,
  argStateOverride: Territory | null,
): Mapcode[] {
  const pointToEncode = Point.fromDeg(argLatDeg, argLonDeg);
  const results: Mapcode[] = [];
  let lastBaseSubTerritoryNumber = -1;

  // Determine whether to walk through all records, or just for one (given) territory.
  const firstTerritoryRecord = territory != null ? territory.getNumber() : 0;
  const lastTerritoryRecord = territory != null ? territory.getNumber() : Territory.AAA.getNumber();
  for (let territoryRecord = firstTerritoryRecord; territoryRecord <= lastTerritoryRecord; territoryRecord++) {
    // Check if the point to encode is covered by the last data record.
    const firstSubTerritoryRecord = DATA_MODEL.getDataLastRecord(territoryRecord);
    if (createBoundaryForTerritoryRecord(firstSubTerritoryRecord).containsPoint(pointToEncode)) {
      const lastSubTerritoryRecord = DATA_MODEL.getDataFirstRecord(territoryRecord);
      const currentEncodeTerritory = Territory.fromNumber(territoryRecord);

      for (
        let subTerritoryRecord = lastSubTerritoryRecord;
        subTerritoryRecord <= firstSubTerritoryRecord;
        subTerritoryRecord++
      ) {
        // Check if the point to encode is contained within the boundary.
        if (createBoundaryForTerritoryRecord(subTerritoryRecord).containsPoint(pointToEncode)) {
          // All fine, proceed with creating a mapcode.
          let mapcode = "";
          if (Data.isNameless(subTerritoryRecord)) {
            mapcode = encodeNameless(pointToEncode, subTerritoryRecord, lastSubTerritoryRecord);
          } else if (Data.getTerritoryRecordType(subTerritoryRecord) > Data.TERRITORY_RECORD_TYPE_PIPE) {
            mapcode = encodeAutoHeader(pointToEncode, subTerritoryRecord);
          } else if (subTerritoryRecord === firstSubTerritoryRecord && currentEncodeTerritory.getParentTerritory() != null) {
            const parentResults = encodeInternal(
              argLatDeg,
              argLonDeg,
              currentEncodeTerritory.getParentTerritory(),
              limitToOneResult,
              currentEncodeTerritory,
            );
            for (const r of parentResults) {
              results.push(r);
            }
            continue;
          } else if (!Data.isRestricted(subTerritoryRecord) || lastBaseSubTerritoryNumber === lastSubTerritoryRecord) {
            if (Data.getCodex(subTerritoryRecord) < 54) {
              mapcode = encodeGrid(subTerritoryRecord, pointToEncode);
            }
          } else {
            // Skip this record.
          }

          // Check if we created a mapcode.
          if (mapcode.length !== 0) {
            // assert mapcode.length() > 4;
            mapcode = aeuPack(mapcode, false);

            const encodeTerritory = argStateOverride != null ? argStateOverride : currentEncodeTerritory;

            // Create new result.
            const newResult = new Mapcode(mapcode, encodeTerritory);

            // The result should not be stored yet.
            if (results.some((r) => r.equals(newResult))) {
              // Duplicate results found (logged in Java; no-op here).
            } else {
              // Remove existing results (if there was a parent territory).
              if (limitToOneResult) {
                results.length = 0;
              }
              results.push(newResult);
            }

            lastBaseSubTerritoryNumber = lastSubTerritoryRecord;

            // Stop if we only need a single result anyway.
            if (limitToOneResult) {
              return results;
            }
          }
        }
      }
    }
  }
  return results;
}

export class Encoder {
  private constructor() {
    // Prevent instantiation.
  }

  static encode(
    latDeg: number,
    lonDeg: number,
    territory: Territory | null,
    limitToOneResult: boolean,
  ): Mapcode[] {
    return encodeInternal(latDeg, lonDeg, territory, limitToOneResult, null);
  }
}
