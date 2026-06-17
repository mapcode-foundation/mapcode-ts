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

import { Alphabet } from "./alphabet.js";
import { checkMapcodeCode } from "./check-args.js";
import { convertStringToAlphabet, convertStringToPlainAscii } from "./alphabet-converter.js";
import { IllegalArgumentError, UnknownPrecisionFormatError } from "./errors.js";
import { Territory } from "./territory.js";

/**
 * This class defines a single mapcode encoding result, including the alphanumeric code and the
 * territory definition. Faithful port of com.mapcode.Mapcode.
 */
export class Mapcode {
  private readonly territory: Territory;
  private readonly codePrecision8: string; // Internally, codes are always stored at precision 8.

  /**
   * Create a mapcode object.
   *
   * @throws IllegalArgumentError Thrown if syntax not valid or if the mapcode string contains
   *                              territory information.
   */
  constructor(code: string, territory: Territory) {
    checkMapcodeCode("code", code);
    const ascii = Mapcode.convertStringToPlainAscii(code);
    if (Mapcode.containsTerritory(ascii)) {
      throw new IllegalArgumentError("Must not contain territory: " + code);
    }

    // Build codeUppercase with exactly eight precision digits.
    let codeUppercase = ascii.toUpperCase();
    const hyphenPos = codeUppercase.indexOf("-");
    if (hyphenPos < 0) {
      codeUppercase = codeUppercase + "-K3000000";
    } else {
      const extensionLength = codeUppercase.length - 1 - hyphenPos;
      if (extensionLength < 8) {
        if (extensionLength % 2 === 1) {
          // Odd extension.
          codeUppercase = codeUppercase + "HH000000".substring(0, 8 - extensionLength);
        } else {
          // Even extension.
          codeUppercase = codeUppercase + "K3000000".substring(0, 8 - extensionLength);
        }
      } else if (extensionLength > 8) {
        // Cut to 8 characters.
        codeUppercase = codeUppercase.substring(0, hyphenPos + 9);
      }
    }

    this.codePrecision8 = codeUppercase;
    this.territory = territory;
  }

  /**
   * Get the mapcode code (without territory information) with a specified precision.
   *
   * Overloads: getCode(), getCode(alphabet), getCode(precision), getCode(precision, alphabet).
   *
   * @throws IllegalArgumentError Thrown if precision is out of range (must be in [0, 8]).
   */
  getCode(): string;
  getCode(alphabet: Alphabet | null): string;
  getCode(precision: number, alphabet?: Alphabet | null): string;
  getCode(precisionOrAlphabet?: number | Alphabet | null, alphabet?: Alphabet | null): string {
    const { precision, alpha } = Mapcode.resolveArgs(precisionOrAlphabet, alphabet);
    Mapcode.checkPrecision(precision);
    if (precision === 0) {
      return convertStringToAlphabet(this.codePrecision8.substring(0, this.codePrecision8.length - 9), alpha);
    }
    return convertStringToAlphabet(
      this.codePrecision8.substring(0, this.codePrecision8.length - 8 + precision),
      alpha,
    );
  }

  /**
   * Return the full international mapcode, including the full name of the territory and the mapcode code itself.
   *
   * @throws IllegalArgumentError Thrown if precision is out of range (must be in [0, 8]).
   */
  getCodeWithTerritoryFullname(): string;
  getCodeWithTerritoryFullname(alphabet: Alphabet | null): string;
  getCodeWithTerritoryFullname(precision: number, alphabet?: Alphabet | null): string;
  getCodeWithTerritoryFullname(
    precisionOrAlphabet?: number | Alphabet | null,
    alphabet?: Alphabet | null,
  ): string {
    const { precision, alpha } = Mapcode.resolveArgs(precisionOrAlphabet, alphabet);
    return this.territory.getFullName() + " " + this.getCode(precision, alpha);
  }

  /**
   * Return the international mapcode as a shorter version using the ISO territory codes where possible.
   *
   * @throws IllegalArgumentError Thrown if precision is out of range (must be in [0, 8]).
   */
  getCodeWithTerritory(): string;
  getCodeWithTerritory(alphabet: Alphabet | null): string;
  getCodeWithTerritory(precision: number, alphabet?: Alphabet | null): string;
  getCodeWithTerritory(precisionOrAlphabet?: number | Alphabet | null, alphabet?: Alphabet | null): string {
    const { precision, alpha } = Mapcode.resolveArgs(precisionOrAlphabet, alphabet);
    return this.territory.toString() + " " + this.getCode(precision, alpha);
  }

  /**
   * Get the territory information.
   */
  getTerritory(): Territory {
    return this.territory;
  }

  /**
   * Normalize the overloaded (precision?, alphabet?) arguments into a {precision, alpha} pair,
   * matching the Java method-overload resolution.
   */
  private static resolveArgs(
    precisionOrAlphabet: number | Alphabet | null | undefined,
    alphabet: Alphabet | null | undefined,
  ): { precision: number; alpha: Alphabet | null } {
    if (precisionOrAlphabet instanceof Alphabet) {
      return { precision: 0, alpha: precisionOrAlphabet };
    }
    if (precisionOrAlphabet === null || precisionOrAlphabet === undefined) {
      return { precision: 0, alpha: alphabet ?? null };
    }
    return { precision: precisionOrAlphabet, alpha: alphabet ?? null };
  }

  private static checkPrecision(precision: number): void {
    if (!Number.isInteger(precision) || precision < 0 || precision > 8) {
      throw new IllegalArgumentError("precision must be an integer in [0, 8]");
    }
  }

  /**
   * These patterns and matchers are used internally in this module to match mapcodes.
   *
   * Java regex notes for the port:
   * - \p{L}\p{N} require the Unicode ('u') flag in JS.
   * - Possessive quantifiers ('++', '{2,3}+') are not supported in JS; dropped (no behavioral
   *   difference for these patterns under full-string matching).
   * - Character-class intersection '[\p{L}\p{N}&&[^zZ]]' / set-difference '[[\p{L}\p{N}]--[zZ]]'
   *   (both require 'v' flag) replaced with negative-lookahead '(?:(?![zZ])[\p{L}\p{N}])' for
   *   'u'-flag compatibility (ES2018, isomorphic/ES2020 target).
   */
  static readonly REGEX_TERRITORY = "[\\p{L}\\p{N}]{2,3}([\\-_][\\p{L}\\p{N}]{2,3})?";
  static readonly REGEX_CODE_PREFIX = "[\\p{L}\\p{N}]{2,5}";
  static readonly REGEX_CODE_POSTFIX = "[\\p{L}\\p{N}]{2,4}";
  static readonly REGEX_CODE_PRECISION = "[\\-](?:(?![zZ])[\\p{L}\\p{N}]){1,8}";

  static readonly REGEX_MAPCODE =
    "(" +
    Mapcode.REGEX_TERRITORY +
    "[ ]+)?" +
    Mapcode.REGEX_CODE_PREFIX +
    "[.]" +
    Mapcode.REGEX_CODE_POSTFIX +
    "(" +
    Mapcode.REGEX_CODE_PRECISION +
    ")?";

  static readonly PATTERN_MAPCODE = new RegExp("^" + Mapcode.REGEX_MAPCODE + "$", "u");
  static readonly PATTERN_TERRITORY = new RegExp("^" + Mapcode.REGEX_TERRITORY + " ", "u");
  static readonly PATTERN_PRECISION = new RegExp(Mapcode.REGEX_CODE_PRECISION + "$", "u");

  /**
   * Return the mapcode precision format, given a mapcode string. Throws if the format is invalid.
   *
   * Note: only checks the syntactic validity of the mapcode, not whether it is a real position.
   *
   * @throws UnknownPrecisionFormatError If precision format is incorrect.
   */
  static getPrecisionFormat(mapcode: string): number {
    // First, decode to ASCII.
    const decodedMapcode = Mapcode.convertStringToPlainAscii(mapcode).toUpperCase();

    // Syntax needs to be OK.
    if (!Mapcode.PATTERN_MAPCODE.test(decodedMapcode)) {
      throw new UnknownPrecisionFormatError(
        decodedMapcode +
          " is not a correctly formatted mapcode code; " +
          "the regular expression for the mapcode code syntax is: " +
          Mapcode.REGEX_MAPCODE,
      );
    }

    // Precision part should be OK.
    const matcherPrecision = Mapcode.PATTERN_PRECISION.exec(decodedMapcode);
    if (matcherPrecision === null) {
      return 0;
    }
    const length = matcherPrecision[0].length - 1;
    // assert (1 <= length) && (length <= 8)
    return length;
  }

  /**
   * Shortcut to check if a mapcode string is formatted properly.
   */
  static isValidMapcodeFormat(mapcode: string | null | undefined): boolean {
    if (mapcode === null || mapcode === undefined) {
      return false;
    }
    try {
      // Throws an exception if the format is incorrect.
      Mapcode.getPrecisionFormat(mapcode.trim().toUpperCase());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns whether the mapcode contains territory information or not.
   *
   * @throws IllegalArgumentError If mapcode has incorrect syntax.
   */
  static containsTerritory(mapcode: string): boolean {
    checkMapcodeCode("mapcode", mapcode);
    return Mapcode.PATTERN_TERRITORY.test(mapcode.trim().toUpperCase());
  }

  /**
   * Safe maximum offset (meters) between a decoded mapcode and its original location, per precision.
   */
  private static readonly PRECISION_0_MAX_OFFSET_METERS: readonly number[] = [
    7.49, // PRECISION_0: 7.49 meters or less       +/- 7.5 m
    1.39, // PRECISION_1: 1.39 meters or less       +/- 1.4 m
    0.251, // PRECISION_2: 25.1 cm or less           +/- 25 cm
    0.0462, // PRECISION_3: 4.62 cm or less           +/- 5 cm
    0.00837, // PRECISION_4: 8.37 mm or less           +/- 1 cm
    0.00154, // PRECISION_5: 1.54 mm or less           +/- 2 mm
    0.000279, // PRECISION_6: 279 micrometer or less    +/- 1/3 mm
    0.0000514, // PRECISION_7: 51.4 micrometer or less   +/- 1/20 mm
    0.0000093, // PRECISION_8: 9.3 micrometer or less    +/- 1/100 mm
  ];

  /**
   * Get a safe maximum for the distance between a decoded mapcode and its original location.
   */
  static getSafeMaxOffsetInMeters(precision: number): number {
    Mapcode.checkPrecision(precision);
    return Mapcode.PRECISION_0_MAX_OFFSET_METERS[precision];
  }

  /**
   * Convert a string which potentially contains Unicode characters to an ASCII variant.
   */
  static convertStringToPlainAscii(s: string): string {
    return convertStringToPlainAscii(s);
  }

  /**
   * Convert a string into the same string using a different (or the same) alphabet.
   *
   * @throws IllegalArgumentError Thrown if string has incorrect syntax or cannot be encoded.
   */
  static convertStringToAlphabet(s: string, alphabet: Alphabet | null): string {
    return convertStringToAlphabet(s, alphabet);
  }

  /**
   * The mapcode code including its territory, with normal precision (precision 0). Plain ASCII.
   */
  toString(): string {
    return this.getCodeWithTerritory();
  }

  equals(obj: unknown): boolean {
    if (this === obj) {
      return true;
    }
    if (!(obj instanceof Mapcode)) {
      return false;
    }
    return this.territory === obj.territory && this.codePrecision8 === obj.codePrecision8;
  }
}
