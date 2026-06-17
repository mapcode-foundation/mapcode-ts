import { describe, it, expect } from "vitest";
import { DECODE_CHARS, ASCII2LANGUAGE, UNICODE2ASCII } from "../src/alphabet-converter.js";
import * as MapcodeCodec from "../src/codec.js";
import { DataModel } from "../src/data-model.js";
import { Boundary } from "../src/boundary.js";
import { Point } from "../src/point.js";
import { Territory } from "../src/territory.js";
import { IllegalArgumentError, UnknownMapcodeError } from "../src/errors.js";

// Ported from DecoderTest.java: the three lookup-table tests, plus the full decode-path suite.

describe("Decoder tables", () => {
  it("tableDecodeChars", () => {
    expect(DECODE_CHARS.length).toBe(256);
  });

  it("tableAscii2Language", () => {
    // ASCII2LANGUAGE.length == UNICODE2ASCII.length - 10 (digit rows) - 3 (lowercase rows).
    expect(ASCII2LANGUAGE.length).toBe(UNICODE2ASCII.length - 10 - 3);
    for (let i = 0; i < ASCII2LANGUAGE.length; i++) {
      expect(ASCII2LANGUAGE[i].length, `At row ${i}`).toBe(36);
    }
  });

  it("tableUnicodeToAscii", () => {
    for (const [min, max, convert] of UNICODE2ASCII) {
      expect(convert.length, `Error at: u${min.toString(16)}`).toBe(max - min + 1);
    }
  });
});

// 1:1 port of com.mapcode.DecoderTest decode-path methods.
describe("DecoderTest", () => {
  it("decodeToRectangle", () => {
    let center = MapcodeCodec.decode("49.4V", Territory.NLD);
    let rectangle = MapcodeCodec.decodeToRectangle("49.4V", Territory.NLD);
    let southWest = Point.fromDeg(52.37646900000124, 4.9084705);
    let northEast = Point.fromDeg(52.37655900000124, 4.908616250000001);
    expect(center.equals(rectangle.getCenter())).toBe(true);
    expect(southWest.equals(rectangle.getSouthWest())).toBe(true);
    expect(northEast.equals(rectangle.getNorthEast())).toBe(true);

    center = MapcodeCodec.decode("VHXGB.1J9J");
    rectangle = MapcodeCodec.decodeToRectangle("VHXGB.1J9J");
    southWest = Point.fromDeg(52.376483, 4.908505);
    northEast = Point.fromDeg(52.376525, 4.908566);
    expect(center.equals(rectangle.getCenter())).toBe(true);
    expect(southWest.equals(rectangle.getSouthWest())).toBe(true);
    expect(northEast.equals(rectangle.getNorthEast())).toBe(true);

    center = MapcodeCodec.decode("VHXGB.ZPHH");
    rectangle = MapcodeCodec.decodeToRectangle("VHXGB.ZPHH");
    southWest = Point.fromDeg(52.370015, 4.96371);
    northEast = Point.fromDeg(52.370057, 4.963758);
    expect(center.equals(rectangle.getCenter())).toBe(true);
    expect(southWest.equals(rectangle.getSouthWest())).toBe(true);
    expect(northEast.equals(rectangle.getNorthEast())).toBe(true);

    center = MapcodeCodec.decode("VHWK3.Z0HF");
    rectangle = MapcodeCodec.decodeToRectangle("VHWK3.Z0HF");
    southWest = Point.fromDeg(52.317869, 4.675245);
    northEast = Point.fromDeg(52.317881, 4.675293);
    expect(center.equals(rectangle.getCenter())).toBe(true);
    expect(southWest.equals(rectangle.getSouthWest())).toBe(true);
    expect(northEast.equals(rectangle.getNorthEast())).toBe(true);
  });

  it("decodeMapcodeWithTerritory", () => {
    const point = MapcodeCodec.decode("49.4V", Territory.NLD);
    expect(point.getLatMicroDeg()).toBe(52376514);
    expect(point.getLonMicroDeg()).toBe(4908543);
  });

  it("decodeUpperLowercaseMapcode", () => {
    const point1 = MapcodeCodec.decode("XXXXX.1234");
    expect(point1.getLatMicroDeg()).toBe(59596312);
    expect(point1.getLonMicroDeg()).toBe(155931892);

    const point2 = MapcodeCodec.decode("Xxxxx.1234");
    expect(point2.getLatMicroDeg()).toBe(59596312);
    expect(point2.getLonMicroDeg()).toBe(155931892);

    const point3 = MapcodeCodec.decode("xxxxx.1234");
    expect(point3.getLatMicroDeg()).toBe(59596312);
    expect(point3.getLonMicroDeg()).toBe(155931892);
  });

  it("decodeFullMapcode", () => {
    const point1 = MapcodeCodec.decode("NLD 49.4V");
    expect(point1.getLatMicroDeg()).toBe(52376514);
    expect(point1.getLonMicroDeg()).toBe(4908543);

    const point2 = MapcodeCodec.decode("US-ID LQJT.N94S");
    expect(point2.getLatMicroDeg()).toBe(45011346);
    expect(point2.getLonMicroDeg()).toBe(-113232731);

    const point3 = MapcodeCodec.decode("US_ID LQJT.N94S");
    expect(point3.getLatMicroDeg()).toBe(45011346);
    expect(point3.getLonMicroDeg()).toBe(-113232731);
  });

  it("decodeInternationalMapcodeWithTerritory", () => {
    const point = MapcodeCodec.decode("VHXGB.1J9J", Territory.AAA);
    expect(point.getLatMicroDeg()).toBe(52376504);
    expect(point.getLonMicroDeg()).toBe(4908535);
  });

  it("decodeFullInternationalMapcode", () => {
    const point = MapcodeCodec.decode("VHXGB.1J9J");
    expect(point.getLatMicroDeg()).toBe(52376504);
    expect(point.getLonMicroDeg()).toBe(4908535);
  });

  it("highPrecisionMapcodeWithTerritory", () => {
    const point = MapcodeCodec.decode("49.4V-K2", Territory.NLD);
    expect(point.getLatMicroDeg()).toBe(52376512);
    expect(point.getLonMicroDeg()).toBe(4908540);
  });

  it("highPrecisionFullMapcode", () => {
    let point = MapcodeCodec.decode("NLD 49.4V-K2");
    expect(point.getLatMicroDeg()).toBe(52376512);
    expect(point.getLonMicroDeg()).toBe(4908540);
    point = MapcodeCodec.decode("NLD P42.NB1-0");
    expect(point.getLatMicroDeg()).toBe(51999954);
    expect(point.getLonMicroDeg()).toBe(4999900);
    point = MapcodeCodec.decode("NLD P42.NB1-123");
    expect(point.getLatMicroDeg()).toBe(51999948);
    expect(point.getLonMicroDeg()).toBe(4999924);
    point = MapcodeCodec.decode("NLD P42.NB1-MVRGBD0S");
    expect(point.getLatMicroDeg()).toBe(51999999);
    expect(point.getLonMicroDeg()).toBe(5000000);
  });

  it("highPrecisionUnicodeAthensAcropolis1", () => {
    const point = MapcodeCodec.decode("ΗΠ.Θ2-Φ2", Territory.GRC);
    expect(point.getLatMicroDeg()).toBe(37971843);
    expect(point.getLonMicroDeg()).toBe(23726223);
  });

  it("highPrecisionUnicodeAthensAcropolis2", () => {
    const point = MapcodeCodec.decode("GRC ΗΠ.Θ2-Φ2");
    expect(point.getLatMicroDeg()).toBe(37971843);
    expect(point.getLonMicroDeg()).toBe(23726223);
  });

  it("unicodeMapcodeAthensAcropolis1", () => {
    const point = MapcodeCodec.decode("ΗΠ.Θ2", Territory.GRC);
    expect(point.getLatMicroDeg()).toBe(37971812);
    expect(point.getLonMicroDeg()).toBe(23726247);
  });

  it("unicodeMapcodeAthensAcropolis2", () => {
    const point = MapcodeCodec.decode("GRC ΗΠ.Θ2");
    expect(point.getLatMicroDeg()).toBe(37971812);
    expect(point.getLonMicroDeg()).toBe(23726247);
  });

  it("unicodeMapcodeAthensAcropolis3", () => {
    const point = MapcodeCodec.decode("ΓΨΞ ΗΠ.Θ2");
    expect(point.getLatMicroDeg()).toBe(37971812);
    expect(point.getLonMicroDeg()).toBe(23726247);
  });

  it("unicodeMapcodeTokyoTower1", () => {
    const point = MapcodeCodec.decode("チナ.8チ", Territory.JPN);
    expect(point.getLatMicroDeg()).toBe(35658660);
    expect(point.getLonMicroDeg()).toBe(139745394);
  });

  it("unicodeMapcodeTokyoTower2", () => {
    const point = MapcodeCodec.decode("JPN チナ.8チ");
    expect(point.getLatMicroDeg()).toBe(35658660);
    expect(point.getLonMicroDeg()).toBe(139745394);
  });

  it("mapCodeWithZeroGroitzsch", () => {
    const point = MapcodeCodec.decode("HMVM.3Q0", Territory.DEU);
    expect(point.getLatMicroDeg()).toBe(51154852);
    expect(point.getLonMicroDeg()).toBe(12278574);
  });

  it("validTerritory", () => {
    const point0 = MapcodeCodec.decode("NLD 49.4V", null);
    expect(point0.getLatMicroDeg()).toBe(52376514);
    expect(point0.getLonMicroDeg()).toBe(4908543);

    const point1 = MapcodeCodec.decode("NLD 49.4V", Territory.NLD);
    expect(point1.getLatMicroDeg()).toBe(52376514);
    expect(point1.getLonMicroDeg()).toBe(4908543);

    const point2 = MapcodeCodec.decode("NLD 49.4V", Territory.USA);
    expect(point2.getLatMicroDeg()).toBe(52376514);
    expect(point2.getLonMicroDeg()).toBe(4908543);

    const point3 = MapcodeCodec.decode("NLD 49.4V");
    expect(point3.getLatMicroDeg()).toBe(52376514);
    expect(point3.getLonMicroDeg()).toBe(4908543);
  });

  it("invalidNoDot", () => {
    expect(() => MapcodeCodec.decode("494V", Territory.NLD)).toThrow(IllegalArgumentError);
  });

  it("invalidDotLocation1", () => {
    expect(() => MapcodeCodec.decode("4.94V", Territory.NLD)).toThrow(IllegalArgumentError);
  });

  it("invalidDotLocation2", () => {
    expect(() => MapcodeCodec.decode("494.V", Territory.NLD)).toThrow(IllegalArgumentError);
  });

  it("invalidDotLocation3", () => {
    expect(() => MapcodeCodec.decode("494V49.4V", Territory.NLD)).toThrow(IllegalArgumentError);
  });

  it("invalidMapcode1", () => {
    expect(() => MapcodeCodec.decode("494.V49V", Territory.NLD)).toThrow(UnknownMapcodeError);
  });

  it("invalidMapcode2", () => {
    expect(() => MapcodeCodec.decode("NLD L333.333", Territory.NLD)).toThrow(UnknownMapcodeError);
  });

  it("invalidMapcode3", () => {
    expect(() => MapcodeCodec.decode("NLD SHH.HHH", Territory.NLD)).toThrow(UnknownMapcodeError);
  });

  it("invalidMapcode4", () => {
    expect(() => MapcodeCodec.decode("NLD V11N.NZZ", Territory.NLD)).toThrow(UnknownMapcodeError);
  });

  it("invalidHighPrecisionCharacter", () => {
    expect(() => MapcodeCodec.decode("49.4V-Z", Territory.NLD)).toThrow(IllegalArgumentError);
  });

  it("invalidHighPrecisionCharacter2", () => {
    expect(() => MapcodeCodec.decode("49.4V-HZ", Territory.NLD)).toThrow(IllegalArgumentError);
  });

  it("invalidHighPrecisionCharacter3", () => {
    expect(() => MapcodeCodec.decode("ΗΠ.Θ2-Б", Territory.GRC)).toThrow(IllegalArgumentError);
  });

  it("invalidHighPrecisionCharacter4", () => {
    expect(() => MapcodeCodec.decode("ΗΠ.Θ2-ББ", Territory.GRC)).toThrow(IllegalArgumentError);
  });

  it("illegalArgument1", () => {
    expect(() => MapcodeCodec.decode(null as unknown as string, Territory.NLD)).toThrow(IllegalArgumentError);
  });

  it("illegalArgument2", () => {
    expect(() => MapcodeCodec.decode("494.V49V", null)).toThrow(UnknownMapcodeError);
  });

  it("illegalArgument3", () => {
    expect(() => MapcodeCodec.decode(null as unknown as string)).toThrow(IllegalArgumentError);
  });

  // Ported from DecoderTest.java#getInternationalGrid: iterates all boundary records for the
  // AAA (international) territory and logs them. No assertions exist in Java; ported as a
  // smoke test that exercises the same code path and verifies at least one record is returned.
  it("getInternationalGrid", () => {
    const dataModel = DataModel.getInstance();
    const aaaTerritory = Territory.AAA;
    const firstRecord = dataModel.getDataFirstRecord(aaaTerritory.getNumber());
    const lastRecord = dataModel.getDataLastRecord(aaaTerritory.getNumber());
    let count = 0;
    for (let r = firstRecord; r <= lastRecord; r++) {
      const boundary = Boundary.createBoundaryForTerritoryRecord(r);
      const southWest = Point.fromMicroDeg(boundary.getLatMicroDegMin(), boundary.getLonMicroDegMin());
      const northEast = Point.fromMicroDeg(boundary.getLatMicroDegMax(), boundary.getLonMicroDegMax());
      // In Java this method logs: "boundary=" + boundary + " southWest=" + southWest + " northEast=" + northEast
      // We simply exercise the code path.
      expect(boundary).toBeDefined();
      expect(southWest).toBeDefined();
      expect(northEast).toBeDefined();
      count++;
    }
    expect(count).toBeGreaterThan(0);
  });
});
