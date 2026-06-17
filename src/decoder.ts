// Faithful TypeScript port of com.mapcode.Decoder (Java).
//
// The shared unicode tables (DECODE_CHARS, ASCII2LANGUAGE, UNICODE2ASCII), the
// aeuUnpack parsing state machine and decodeUTF16 already live in
// alphabet-converter.ts (extracted in Task 8). They are imported here rather than
// duplicated. Only the decode ALGORITHM lives in this file.

import { Point } from "./point.js";
import { Territory } from "./territory.js";
import { Data } from "./data.js";
import { DataModel } from "./data-model.js";
import { Common } from "./common.js";
import { Boundary } from "./boundary.js";
import { MapcodeZone } from "./mapcode-zone.js";
import { UnknownMapcodeError } from "./errors.js";
import { DECODE_CHARS, ASCII2LANGUAGE, UNICODE2ASCII, aeuUnpack, decodeUTF16 } from "./alphabet-converter.js";

// Re-export the shared tables so the DecoderTest table tests can assert their shapes.
export { DECODE_CHARS, ASCII2LANGUAGE, UNICODE2ASCII };

const DATA_MODEL = DataModel.getInstance();

const createBoundaryForTerritoryRecord = Boundary.createBoundaryForTerritoryRecord;

// Java: int / int truncates toward zero.
function intDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

export class Decoder {
  private constructor() {
    // Prevent instantiation.
  }

  // ----------------------------------------------------------------------
  // Method called from public API.
  // ----------------------------------------------------------------------

  static decodeToMapcodeZone(argMapcode: string, argTerritory: Territory): MapcodeZone {
    let mapcode = argMapcode;
    let territory = argTerritory;

    let precisionPostfix = "";
    const positionOfDash = mapcode.indexOf("-");
    if (positionOfDash > 0) {
      precisionPostfix = decodeUTF16(mapcode.substring(positionOfDash + 1).trim());
      if (precisionPostfix.includes("Z")) {
        throw new UnknownMapcodeError(
          "Invalid character Z, mapcode=" + argMapcode + ", territory=" + argTerritory.toString(),
        );
      }

      // Cut the precision postfix from the mapcode.
      mapcode = mapcode.substring(0, positionOfDash);
    }

    // TODO: Explain what AEU unpack does.
    mapcode = aeuUnpack(mapcode).trim();
    if (mapcode.length === 0) {
      throw new UnknownMapcodeError(
        "Failed to AEU unpack, mapcode=" + argMapcode + ", territory=" + argTerritory.toString(),
      );
    }

    const codexLen = mapcode.length - 1;

    // *** long codes in states are handled by the country
    if (codexLen >= 9) {
      // International codes are 9 characters.
      territory = Territory.AAA;
    } else {
      const parentTerritory = territory.getParentTerritory();
      if (
        (codexLen >= 8 &&
          (parentTerritory === Territory.USA ||
            parentTerritory === Territory.CAN ||
            parentTerritory === Territory.AUS ||
            parentTerritory === Territory.BRA ||
            parentTerritory === Territory.CHN ||
            parentTerritory === Territory.RUS)) ||
        (codexLen >= 7 && (parentTerritory === Territory.IND || parentTerritory === Territory.MEX))
      ) {
        territory = parentTerritory as Territory;
      }
    }
    const territoryNumber = territory.getNumber();

    const fromTerritoryRecord = DATA_MODEL.getDataFirstRecord(territoryNumber);
    const uptoTerritoryRecord = DATA_MODEL.getDataLastRecord(territoryNumber);

    // Determine the codex pattern as 2-digits: length-of-left-part * 10 + length-of-right-part.
    const positionOfDot = mapcode.indexOf(".");
    const codex = positionOfDot * 10 + (codexLen - positionOfDot);

    let mapcodeZone = new MapcodeZone();
    for (let territoryRecord = fromTerritoryRecord; territoryRecord <= uptoTerritoryRecord; territoryRecord++) {
      const codexOfTerritory = Data.getCodex(territoryRecord);
      const boundaryOfTerritory = createBoundaryForTerritoryRecord(territoryRecord);
      if (Data.getTerritoryRecordType(territoryRecord) === Data.TERRITORY_RECORD_TYPE_NONE) {
        if (Data.isNameless(territoryRecord)) {
          // i = nameless
          if (
            (codexOfTerritory === 21 && codex === 22) ||
            (codexOfTerritory === 22 && codex === 32) ||
            (codexOfTerritory === 13 && codex === 23)
          ) {
            mapcodeZone = Decoder.decodeNameless(mapcode, territoryRecord, precisionPostfix);
            break;
          }
        } else {
          // i = grid without headerletter
          if (codexOfTerritory === codex || (codex === 22 && codexOfTerritory === 21)) {
            mapcodeZone = Decoder.decodeGrid(
              mapcode,
              boundaryOfTerritory.getLonMicroDegMin(),
              boundaryOfTerritory.getLatMicroDegMin(),
              boundaryOfTerritory.getLonMicroDegMax(),
              boundaryOfTerritory.getLatMicroDegMax(),
              territoryRecord,
              precisionPostfix,
            );

            // first of all, make sure the zone fits the country
            mapcodeZone = mapcodeZone.restrictZoneTo(createBoundaryForTerritoryRecord(uptoTerritoryRecord));

            if (Data.isRestricted(territoryRecord) && !mapcodeZone.isEmpty()) {
              let nrZoneOverlaps = 0;
              let j: number;
              const result = mapcodeZone.getCenter();
              // see if midpoint of mapcode zone is in any sub-area...
              for (j = territoryRecord - 1; j >= fromTerritoryRecord; j--) {
                if (!Data.isRestricted(j)) {
                  if (createBoundaryForTerritoryRecord(j).containsPoint(result)) {
                    nrZoneOverlaps++;
                    break;
                  }
                }
              }

              if (nrZoneOverlaps === 0) {
                // see if mapcode zone OVERLAPS any sub-area...
                let zfound = new MapcodeZone();
                for (j = fromTerritoryRecord; j < territoryRecord; j++) {
                  // try all smaller rectangles j
                  if (!Data.isRestricted(j)) {
                    const z = mapcodeZone.restrictZoneTo(createBoundaryForTerritoryRecord(j));
                    if (!z.isEmpty()) {
                      nrZoneOverlaps++;
                      if (nrZoneOverlaps === 1) {
                        // first fit! remember...
                        zfound = MapcodeZone.copy(z);
                      } else {
                        // nrZoneOverlaps > 1; more than one hit
                        break; // give up!
                      }
                    }
                  }
                }
                if (nrZoneOverlaps === 1) {
                  // intersected exactly ONE sub-area?
                  mapcodeZone = MapcodeZone.copy(zfound); // use the intersection found...
                }
              }

              if (nrZoneOverlaps === 0) {
                mapcodeZone = new MapcodeZone();
              }
            }
            break;
          }
        }
      } else if (Data.getTerritoryRecordType(territoryRecord) === Data.TERRITORY_RECORD_TYPE_PIPE) {
        // i = grid with headerletter
        if (
          codex === codexOfTerritory + 10 &&
          Data.headerLetter(territoryRecord).charAt(0) === mapcode.charAt(0)
        ) {
          mapcodeZone = Decoder.decodeGrid(
            mapcode.substring(1),
            boundaryOfTerritory.getLonMicroDegMin(),
            boundaryOfTerritory.getLatMicroDegMin(),
            boundaryOfTerritory.getLonMicroDegMax(),
            boundaryOfTerritory.getLatMicroDegMax(),
            territoryRecord,
            precisionPostfix,
          );
          break;
        }
      } else {
        // i = autoheader (PLUS or STAR)
        if ((codex === 23 && codexOfTerritory === 22) || (codex === 33 && codexOfTerritory === 23)) {
          mapcodeZone = Decoder.decodeAutoHeader(mapcode, territoryRecord, precisionPostfix);
          break;
        }
      }
    }

    mapcodeZone = mapcodeZone.restrictZoneTo(createBoundaryForTerritoryRecord(uptoTerritoryRecord));
    return mapcodeZone;
  }

  // ----------------------------------------------------------------------
  // Private methods.
  // ----------------------------------------------------------------------

  private static decodeGrid(
    str: string,
    minx: number,
    miny: number,
    maxx: number,
    maxy: number,
    m: number,
    extrapostfix: string,
  ): MapcodeZone {
    let result = str;
    let relx: number;
    let rely: number;
    const codexlen = result.length - 1; // length ex dot
    let prelen = result.indexOf("."); // dot position

    if (prelen === 1 && codexlen === 5) {
      prelen++;
      result = result.substring(0, 1) + result.charAt(2) + "." + result.substring(3);
    }
    const postlen = codexlen - prelen;

    let divx: number;
    let divy: number;
    divy = DATA_MODEL.getSmartDiv(m);
    if (divy === 1) {
      divx = Common.X_SIDE[prelen];
      divy = Common.Y_SIDE[prelen];
    } else {
      divx = intDiv(Common.NC[prelen], divy);
    }

    if (prelen === 4 && divx === 961 && divy === 961) {
      result = result.substring(0, 1) + result.charAt(2) + result.charAt(1) + result.substring(3);
    }

    let v = Decoder.decodeBase31(result);

    if (divx !== divy && prelen > 2) {
      // D==6
      const d = Decoder.decodeSixWide(v, divx, divy);
      relx = d.getLonMicroDeg();
      rely = d.getLatMicroDeg();
    } else {
      relx = intDiv(v, divy);
      rely = divy - 1 - (v % divy);
    }

    const ygridsize = intDiv(maxy - miny + divy - 1, divy);
    const xgridsize = intDiv(maxx - minx + divx - 1, divx);

    rely = miny + rely * ygridsize;
    relx = minx + relx * xgridsize;

    const yp = Common.Y_SIDE[postlen];
    const dividery = intDiv(ygridsize + yp - 1, yp);
    const xp = Common.X_SIDE[postlen];
    const dividerx = intDiv(xgridsize + xp - 1, xp);

    let rest = result.substring(prelen + 1);

    // decode relative (postfix vs rely, relx)
    let difx: number;
    let dify: number;

    if (postlen === 3) {
      const d = Decoder.decodeTriple(rest);
      difx = d.getLonMicroDeg();
      dify = d.getLatMicroDeg();
    } else {
      if (postlen === 4) {
        rest = String(rest.charAt(0)) + rest.charAt(2) + rest.charAt(1) + rest.charAt(3);
      }
      v = Decoder.decodeBase31(rest);
      difx = intDiv(v, yp);
      dify = v % yp;
    }

    dify = yp - 1 - dify;

    const cornery = rely + dify * dividery;
    const cornerx = relx + difx * dividerx;

    const pt = Point.fromMicroDeg(cornery, cornerx);
    if (!createBoundaryForTerritoryRecord(m).containsPoint(pt)) {
      return new MapcodeZone(); // already out of range
    }

    const decodeMaxx = relx + xgridsize < maxx ? relx + xgridsize : maxx;
    const decodeMaxy = rely + ygridsize < maxy ? rely + ygridsize : maxy;
    return Decoder.decodeExtension(cornery, cornerx, dividerx << 2, dividery, extrapostfix, 0, decodeMaxy, decodeMaxx); // grid
  }

  private static decodeNameless(str: string, firstrec: number, extrapostfix: string): MapcodeZone {
    let result = str;
    const codexm = Data.getCodex(firstrec);
    if (codexm === 22) {
      result = result.substring(0, 3) + result.substring(4);
    } else {
      result = result.substring(0, 2) + result.substring(3);
    }

    const a = Common.countCityCoordinatesForCountry(codexm, firstrec, firstrec);

    const p = intDiv(31, a);
    const r = 31 % a;
    let v = 0;
    let nrX: number;
    let swapletters = false;

    if (codexm !== 21 && a <= 31) {
      const offset = DECODE_CHARS[result.charCodeAt(0)];

      if (offset < r * (p + 1)) {
        nrX = intDiv(offset, p + 1);
      } else {
        swapletters = p === 1 && codexm === 22;
        nrX = r + intDiv(offset - r * (p + 1), p);
      }
    } else if (codexm !== 21 && a < 62) {
      nrX = DECODE_CHARS[result.charCodeAt(0)];
      if (nrX < 62 - a) {
        swapletters = codexm === 22;
      } else {
        nrX = nrX + nrX - 62 + a;
      }
    } else {
      // codex==21 || A>=62
      const basePower = codexm === 21 ? 961 * 961 : 961 * 961 * 31;
      let basePowerA = intDiv(basePower, a);
      if (a === 62) {
        basePowerA++;
      } else {
        basePowerA = 961 * intDiv(basePowerA, 961);
      }

      // decode and determine x
      v = Decoder.decodeBase31(result);
      nrX = intDiv(v, basePowerA);
      v %= basePowerA;
    }

    if (swapletters && !Data.isSpecialShape(firstrec + nrX)) {
      result = result.substring(0, 2) + result.charAt(3) + result.charAt(2) + result.charAt(4);
    }

    if (codexm !== 21 && a <= 31) {
      v = Decoder.decodeBase31(result);
      if (nrX > 0) {
        v -= (nrX * p + (nrX < r ? nrX : r)) * 961 * 961;
      }
    } else if (codexm !== 21 && a < 62) {
      v = Decoder.decodeBase31(result.substring(1));
      if (nrX >= 62 - a && v >= 16 * 961 * 31) {
        v -= 16 * 961 * 31;
        nrX++;
      }
    }

    if (nrX > a) {
      // past end!
      return new MapcodeZone();
    }

    const territoryRecord = firstrec + nrX;

    let side = DATA_MODEL.getSmartDiv(territoryRecord);
    let xSIDE = side;

    const boundary = createBoundaryForTerritoryRecord(territoryRecord);
    const maxx = boundary.getLonMicroDegMax();
    const maxy = boundary.getLatMicroDegMax();
    const minx = boundary.getLonMicroDegMin();
    const miny = boundary.getLatMicroDegMin();

    let dx: number;
    let dy: number;

    if (Data.isSpecialShape(territoryRecord)) {
      xSIDE *= side;
      side = 1 + intDiv(maxy - miny, 90);
      xSIDE = intDiv(xSIDE, side);

      const d = Decoder.decodeSixWide(v, xSIDE, side);
      dx = d.getLonMicroDeg();
      dy = side - 1 - d.getLatMicroDeg();
    } else {
      dy = v % side;
      dx = intDiv(v, side);
    }

    if (dx >= xSIDE) {
      // else out-of-range!
      return new MapcodeZone(); // return undefined (out of range!)
    }

    const dividerx4 = Common.xDivider(miny, maxy); // 4 times too large!
    const dividery = 90;

    const cornerx = minx + intDiv(dx * dividerx4, 4);
    const cornery = maxy - dy * dividery;
    return Decoder.decodeExtension(
      cornery,
      cornerx,
      dividerx4,
      -dividery,
      extrapostfix,
      (dx * dividerx4) % 4,
      miny,
      maxx,
    ); // nameless
  }

  private static decodeAutoHeader(input: string, m: number, extrapostfix: string): MapcodeZone {
    // returns empty zone in case of error
    let storageStart = 0;
    const codexm = Data.getCodex(m);

    let value = Decoder.decodeBase31(input); // decode top (before dot)
    value *= 961 * 31;
    const triple = Decoder.decodeTriple(input.substring(input.length - 3));
    // decode bottom 3 chars

    let i = m;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (
        Data.getTerritoryRecordType(i) < Data.TERRITORY_RECORD_TYPE_PLUS ||
        Data.getCodex(i) !== codexm
      ) {
        return new MapcodeZone(); // return undefined
      }

      const maxx = createBoundaryForTerritoryRecord(i).getLonMicroDegMax();
      const maxy = createBoundaryForTerritoryRecord(i).getLatMicroDegMax();
      const minx = createBoundaryForTerritoryRecord(i).getLonMicroDegMin();
      const miny = createBoundaryForTerritoryRecord(i).getLatMicroDegMin();

      let h = intDiv(maxy - miny + 89, 90);
      const xdiv = Common.xDivider(miny, maxy);
      let w = intDiv((maxx - minx) * 4 + xdiv - 1, xdiv);

      h = 176 * intDiv(h + 176 - 1, 176);
      w = 168 * intDiv(w + 168 - 1, 168);

      let product = intDiv(w, 168) * intDiv(h, 176) * 961 * 31;

      if (Data.getTerritoryRecordType(i) === Data.TERRITORY_RECORD_TYPE_PLUS) {
        const goodRounder = codexm >= 23 ? 961 * 961 * 31 : 961 * 961;
        product = intDiv(storageStart + product + goodRounder - 1, goodRounder) * goodRounder - storageStart;
      }

      if (value >= storageStart && value < storageStart + product) {
        // code belongs here?
        const dividerx = intDiv(maxx - minx + w - 1, w);
        const dividery = intDiv(maxy - miny + h - 1, h);

        value -= storageStart;
        value = intDiv(value, 961 * 31);

        let vx = intDiv(value, intDiv(h, 176));
        vx = vx * 168 + triple.getLonMicroDeg();
        const vy = (value % intDiv(h, 176)) * 176 + triple.getLatMicroDeg();

        const cornery = maxy - vy * dividery;
        const cornerx = minx + vx * dividerx;

        if (cornerx < minx || cornerx >= maxx || cornery < miny || cornery > maxy) {
          return new MapcodeZone(); // corner out of bounds
        }

        return Decoder.decodeExtension(cornery, cornerx, dividerx << 2, -dividery, extrapostfix, 0, miny, maxx); // autoheader
      }
      storageStart += product;
      i++;
    }
  }

  private static decodeTriple(str: string): Point {
    const c1 = DECODE_CHARS[str.charCodeAt(0)];
    const x = Decoder.decodeBase31(str.substring(1));
    if (c1 < 24) {
      return Point.fromMicroDeg(intDiv(c1, 6) * 34 + (x % 34), (c1 % 6) * 28 + intDiv(x, 34));
    }
    return Point.fromMicroDeg((x % 40) + 136, intDiv(x, 40) + 24 * (c1 - 24));
  }

  private static decodeSixWide(v: number, width: number, height: number): Point {
    let d: number;
    let col = intDiv(v, height * 6);
    const maxcol = intDiv(width - 4, 6);
    if (col >= maxcol) {
      col = maxcol;
      d = width - maxcol * 6;
    } else {
      d = 6;
    }
    const w = v - col * height * 6;
    return Point.fromMicroDeg(height - 1 - intDiv(w, d), col * 6 + (w % d));
  }

  // lowest level decode routine: decode up to dot or EOS; returns negative on error.
  private static decodeBase31(code: string): number {
    let value = 0;
    for (let k = 0; k < code.length; k++) {
      const c = code.charCodeAt(k);
      if (c === ".".charCodeAt(0)) {
        return value;
      }
      if (DECODE_CHARS[c] < 0) {
        return -1;
      }
      value = (value * 31 + DECODE_CHARS[c]) | 0;
    }
    return value;
  }

  private static decodeExtension(
    y: number,
    x: number,
    dividerx0: number,
    dividery0: number,
    extrapostfix: string,
    lonOffset4: number,
    extremeLatMicroDeg: number,
    maxLonMicroDeg: number,
  ): MapcodeZone {
    const mapcodeZone = new MapcodeZone();
    let dividerx4 = dividerx0;
    let dividery = dividery0;
    let processor = 1;
    let lon32 = 0;
    let lat32 = 0;
    let odd = false;
    let idx = 0;
    // decode up to 8 characters
    const len = extrapostfix.length > 8 ? 8 : extrapostfix.length;
    while (idx < len) {
      let c1 = extrapostfix.charCodeAt(idx);
      idx++;
      c1 = DECODE_CHARS[c1];
      if (c1 < 0 || c1 === 30) {
        return new MapcodeZone();
      }
      const y1 = intDiv(c1, 5);
      const x1 = c1 % 5;
      let y2: number;
      let x2: number;
      if (idx < len) {
        let c2 = extrapostfix.charCodeAt(idx);
        idx++;
        c2 = DECODE_CHARS[c2];
        if (c2 < 0 || c2 === 30) {
          return new MapcodeZone();
        }
        y2 = intDiv(c2, 6);
        x2 = c2 % 6;
      } else {
        odd = true;
        y2 = 0;
        x2 = 0;
      }

      processor *= 30;
      lon32 = lon32 * 30 + x1 * 6 + x2;
      lat32 = lat32 * 30 + y1 * 5 + y2;
    }

    while (processor < Point.MAX_PRECISION_FACTOR) {
      dividerx4 *= 30;
      dividery *= 30;
      processor *= 30;
    }

    const lon4 = x * 4 * Point.MAX_PRECISION_FACTOR + lon32 * dividerx4 + lonOffset4 * Point.MAX_PRECISION_FACTOR;
    const lat1 = y * Point.MAX_PRECISION_FACTOR + lat32 * dividery;

    // determine the range of coordinates that are encoded to this mapcode
    if (odd) {
      mapcodeZone.setFromFractions(lat1, lon4, 5 * dividery, 6 * dividerx4);
    } else {
      mapcodeZone.setFromFractions(lat1, lon4, dividery, dividerx4);
    }

    // FORCE_RECODE - restrict the coordinate range to the extremes that were provided
    if (mapcodeZone.getLonFractionMax() > maxLonMicroDeg * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR) {
      mapcodeZone.setLonFractionMax(maxLonMicroDeg * Point.LON_MICRODEG_TO_FRACTIONS_FACTOR);
    }
    if (dividery >= 0) {
      if (mapcodeZone.getLatFractionMax() > extremeLatMicroDeg * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR) {
        mapcodeZone.setLatFractionMax(extremeLatMicroDeg * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR);
      }
    } else {
      if (mapcodeZone.getLatFractionMin() < extremeLatMicroDeg * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR) {
        mapcodeZone.setLatFractionMin(extremeLatMicroDeg * Point.LAT_MICRODEG_TO_FRACTIONS_FACTOR);
      }
    }
    return mapcodeZone;
  }
}
