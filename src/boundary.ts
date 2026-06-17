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
