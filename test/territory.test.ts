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
import { Territory, AlphaCodeFormat } from "../src/territory.js";
import { Alphabet } from "../src/alphabet.js";
import { UnknownTerritoryError, IllegalArgumentError } from "../src/errors.js";
import { convertStringToPlainAscii } from "../src/alphabet-converter.js";

describe("TerritoryTest", () => {
  it("emptyTerritoryNumberTest", () => {
    expect(() => Territory.fromString("")).toThrow(UnknownTerritoryError);
  });

  it("checkConvert", () => {
    const s1 = "รฉะ ฑง.ดฯง";
    const s2 = convertStringToPlainAscii(s1);
    expect(s2).toBe("THA KF.LZF");
  });

  it("checkFullName", () => {
    expect(Territory.fromString("International")).toBe(Territory.AAA);
    expect(Territory.fromString("Worldwide")).toBe(Territory.AAA);
    expect(Territory.fromString("Earth")).toBe(Territory.AAA);
    expect(Territory.fromString("Netherlands")).toBe(Territory.NLD);
    expect(Territory.fromString("Xizang")).toBe(Territory.CN_XZ);
    expect(Territory.fromString("Tibet")).toBe(Territory.CN_XZ);
  });

  it("checkAlphabets", () => {
    expect(Territory.VAT.getAlphabets().length).toBe(1);
    expect(Territory.PRI.getAlphabets().length).toBe(1);
    expect(Territory.AAA.getAlphabets().length).toBe(1);
    expect(Territory.CN_XZ.getAlphabets().length).toBe(3);
    expect(Territory.IN_LD.getAlphabets().length).toBe(3);
    expect(Territory.VAT.getAlphabets()[0]).toBe(Alphabet.ROMAN);
    expect(Territory.PRI.getAlphabets()[0]).toBe(Alphabet.ROMAN);
    expect(Territory.CPT.getAlphabets()[0]).toBe(Alphabet.ROMAN);
    expect(Territory.CN_XZ.getAlphabets()[0]).toBe(Alphabet.TIBETAN);
    expect(Territory.CN_XZ.getAlphabets()[1]).toBe(Alphabet.CHINESE);
    expect(Territory.CN_XZ.getAlphabets()[2]).toBe(Alphabet.ROMAN);
    expect(Territory.IN_LD.getAlphabets()[0]).toBe(Alphabet.MALAYALAM);
    expect(Territory.IN_LD.getAlphabets()[1]).toBe(Alphabet.ROMAN);
    expect(Territory.IN_LD.getAlphabets()[2]).toBe(Alphabet.DEVANAGARI);
  });

  it("checkDash", () => {
    expect(Territory.fromString("IND-MN")).toBe(Territory.IN_MN);
    expect(Territory.fromString("IND_MN")).toBe(Territory.IN_MN);
    expect(Territory.fromString("USA-MN")).toBe(Territory.US_MN);
    expect(Territory.fromString("USA_MN")).toBe(Territory.US_MN);

    expect(Territory.fromString("Congo-Kinshasa")).toBe(Territory.COD);
    expect(Territory.fromString("United States of America-IN")).toBe(Territory.US_IN);
    expect(Territory.fromString("United States of America IN")).toBe(Territory.US_IN);
  });

  it("disambiguateMNTest1", () => {
    const territory0 = Territory.fromString("IND-MN");
    const territory1 = Territory.fromString("IN-MN");
    const territory2 = Territory.fromString("MN", Territory.IND);
    const territory3 = Territory.fromString("MN", Territory.USA);
    expect(territory1).toBe(territory0);
    expect(territory2).toBe(territory1);
    expect(territory3).not.toBe(territory2);
  });

  it("disambiguateMNTest2", () => {
    expect(() => Territory.fromString("MN", Territory.RUS)).toThrow(UnknownTerritoryError);
  });

  it("testTerritoryFromString", () => {
    // Accept ISO-style codes.
    expect(Territory.fromString("NLD")).toBe(Territory.NLD);
    expect(Territory.fromString("ARG")).toBe(Territory.ARG);
    expect(Territory.fromString("US-AS")).toBe(Territory.ASM);
    expect(Territory.fromString("USA-AS")).toBe(Territory.ASM);
    expect(Territory.fromString("RU")).toBe(Territory.RUS);
    expect(Territory.fromString("CN")).toBe(Territory.CHN);
    expect(Territory.fromString("AU")).toBe(Territory.AUS);
    expect(Territory.fromString("IN")).toBe(Territory.US_IN);
    expect(Territory.fromString("US-IN")).toBe(Territory.US_IN);
    expect(Territory.fromString("USA-IN")).toBe(Territory.US_IN);
    expect(Territory.fromString("RUS-IN")).toBe(Territory.RU_IN);
    expect(Territory.fromString("BR")).toBe(Territory.IN_BR);
    expect(Territory.fromString("AS")).toBe(Territory.IN_AS);

    // Accept long and short.
    expect(Territory.fromString("USA")).toBe(Territory.USA);
    expect(Territory.fromString("US")).toBe(Territory.USA);

    for (const territory of Territory.values()) {
      expect(Territory.fromString(territory.toString())).toBe(territory);
    }
  });

  it("testTerritoryFromStringIncorrectDash1", () => {
    expect(() => Territory.fromString("CHE-GR")).toThrow(UnknownTerritoryError);
  });

  it("testTerritoryFromStringIncorrectDash2", () => {
    expect(() => Territory.fromString("USA-NLD")).toThrow(UnknownTerritoryError);
  });

  it("testTerritoryFromStringNumeric", () => {
    expect(() => Territory.fromString("0")).toThrow(UnknownTerritoryError);
  });

  it("checkAlphabet", () => {
    expect(Territory.fromString("NLD")).toBe(Territory.NLD);
    expect(Territory.fromString("ΝΛΔ")).toBe(Territory.NLD);
    expect(Territory.fromString("ЗЛД")).toBe(Territory.NLD);

    expect(Territory.NLD.toAlphaCode(AlphaCodeFormat.INTERNATIONAL)).toBe("NLD");
    expect(Territory.NLD.toAlphaCode(AlphaCodeFormat.INTERNATIONAL, Alphabet.ROMAN)).toBe("NLD");
    expect(Territory.NLD.toAlphaCode(AlphaCodeFormat.INTERNATIONAL, Alphabet.CYRILLIC)).toBe("ЗЛД");
    expect(Territory.NLD.toAlphaCode(AlphaCodeFormat.INTERNATIONAL, Alphabet.GREEK)).toBe("ΝΛΔ");
    expect(Territory.GRC.toAlphaCode(AlphaCodeFormat.INTERNATIONAL, Alphabet.GREEK)).toBe("ΓΨΞ");
  });

  it("testFromStringError1", () => {
    expect(() => Territory.fromString("")).toThrow(UnknownTerritoryError);
  });

  it("testFromStringError2", () => {
    expect(() => Territory.fromString("1A")).toThrow(UnknownTerritoryError);
  });

  it("testFromStringError3", () => {
    expect(() => Territory.fromString("999")).toThrow(UnknownTerritoryError);
  });

  it("testFromNumberOK", () => {
    expect(Territory.fromNumber(0)).toBe(Territory.VAT);
  });

  it("testFromNumberError1", () => {
    expect(() => Territory.fromNumber(-1)).toThrow(UnknownTerritoryError);
  });

  it("testFromNumberError2", () => {
    expect(() => Territory.fromNumber(99999)).toThrow(UnknownTerritoryError);
  });

  it("testFromStringCountryISO2Error1", () => {
    expect(() => Territory.fromCountryISO2("US-IN")).toThrow(IllegalArgumentError);
  });

  it("testFromStringCountryISO2Error2", () => {
    expect(() => Territory.fromCountryISO2("USA")).toThrow(IllegalArgumentError);
  });

  it("testFromStringCountryISO2Error3", () => {
    expect(() => Territory.fromCountryISO2("")).toThrow(IllegalArgumentError);
  });

  it("testFromStringCountryISO2OK", () => {
    expect(Territory.fromCountryISO2("NL").toString()).toBe("NLD");
    expect(Territory.fromCountryISO2("br").toString()).toBe("BRA");
    expect(Territory.fromCountryISO2("Us").toString()).toBe("USA");
  });

  it("testFromStringCountryISO3Error1", () => {
    expect(() => Territory.fromCountryISO3("US-IN")).toThrow(IllegalArgumentError);
  });

  it("testFromStringCountryISO3Error2", () => {
    expect(() => Territory.fromCountryISO3("US")).toThrow(IllegalArgumentError);
  });

  it("testFromStringCountryISO3Error3", () => {
    expect(() => Territory.fromCountryISO3("")).toThrow(IllegalArgumentError);
  });

  it("testFromStringCountryISO3Error4", () => {
    expect(() => Territory.fromCountryISO3("AAA")).toThrow(IllegalArgumentError);
  });

  it("testFromStringCountryISO3OK", () => {
    expect(Territory.fromCountryISO3("NLD").toString()).toBe("NLD");
    expect(Territory.fromCountryISO3("bra").toString()).toBe("BRA");
    expect(Territory.fromCountryISO3("Usa").toString()).toBe("USA");
  });

  it("testFromStringCountryISOOK", () => {
    expect(Territory.fromCountryISO2("NL").toString()).toBe("NLD");
    expect(Territory.fromCountryISO2("br").toString()).toBe("BRA");
    expect(Territory.fromCountryISO2("Us").toString()).toBe("USA");
    expect(Territory.fromCountryISO("NLD").toString()).toBe("NLD");
    expect(Territory.fromCountryISO("bra").toString()).toBe("BRA");
    expect(Territory.fromCountryISO("Usa").toString()).toBe("USA");
  });

  it("testGetCountryISO3FromISO2", () => {
    expect(Territory.getCountryISO3FromISO2("NL")).toBe("NLD");
    expect(Territory.getCountryISO3FromISO2("br")).toBe("BRA");
    expect(Territory.getCountryISO3FromISO2("Us")).toBe("USA");
  });

  it("testGetCountryISO3FromISO2Error", () => {
    expect(() => Territory.getCountryISO3FromISO2("NLD")).toThrow(IllegalArgumentError);
  });

  it("testGetCountryISO2FromISO3", () => {
    expect(Territory.getCountryISO2FromISO3("NLD")).toBe("NL");
    expect(Territory.getCountryISO2FromISO3("bra")).toBe("BR");
    expect(Territory.getCountryISO2FromISO3("Usa")).toBe("US");
  });

  it("testGetCountryISO2FromISO3Error", () => {
    expect(() => Territory.getCountryISO2FromISO3("NL")).toThrow(IllegalArgumentError);
  });

  it("testGetCountryISO2Codes", () => {
    const countryISO2Codes = Territory.allCountryISO2Codes();
    expect(countryISO2Codes.size).toBe(250);
    expect(countryISO2Codes.values().next().value!.length).toBe(2);
  });

  it("testGetCountryISO3Codes", () => {
    const countryISO3Codes = Territory.allCountryISO3Codes();
    expect(countryISO3Codes.size).toBe(250);
    expect(countryISO3Codes.values().next().value!.length).toBe(3);
  });
});
