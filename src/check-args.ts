import { IllegalArgumentError } from "./errors.js";
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
