import { IllegalArgumentError } from "./errors.js";
import { Mapcode } from "./mapcode.js";
import { Point } from "./point.js";

export function checkNonnull(param: string, obj: unknown): void {
  if (obj === null || obj === undefined) {
    throw new IllegalArgumentError(`Parameter ${param} should not be null`);
  }
}

export function checkDefined(param: string, point: Point): void {
  checkNonnull(param, point);
  if (!point.isDefined()) {
    throw new IllegalArgumentError(`Parameter ${param} must be defined`);
  }
}

export function checkMapcodeCode(param: string, code: string | null | undefined): void {
  checkNonnull(param, code);

  // check-args <-> mapcode form an ESM import cycle (Mapcode's constructor and containsTerritory call
  // checkMapcodeCode, which needs Mapcode.getPrecisionFormat). This is safe: the static import binding
  // below is resolved lazily/live, and getPrecisionFormat is only invoked at runtime, never at module
  // evaluation time.
  // Throws an exception if the format is incorrect.
  Mapcode.getPrecisionFormat(code as string);
}
