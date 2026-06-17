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

export class IllegalArgumentError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "IllegalArgumentError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IllegalStateError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "IllegalStateError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownMapcodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownMapcodeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownTerritoryError extends IllegalArgumentError {
  private readonly code: number | null;
  constructor(messageOrCode: string | number) {
    if (typeof messageOrCode === "number") {
      super();
      this.code = messageOrCode;
    } else {
      super(messageOrCode);
      this.code = null;
    }
    this.name = "UnknownTerritoryError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
  getCode(): number | null {
    return this.code;
  }
}

export class UnknownAlphabetError extends IllegalArgumentError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownAlphabetError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownPrecisionFormatError extends IllegalArgumentError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownPrecisionFormatError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnknownDecodeError extends IllegalStateError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownDecodeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IncorrectDataModelError extends IllegalStateError {
  constructor(message: string) {
    super(message);
    this.name = "IncorrectDataModelError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
