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
