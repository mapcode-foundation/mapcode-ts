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

import { IncorrectDataModelError } from "./errors.js";
import { MMINFO_DATA } from "./data/mminfo-data.js";

// Equals Territory.values().length. Verified against bytes 6-7 of data/mminfo.dat. See Task 4 Step 2.
const EXPECTED_NR_TERRITORIES: number = 533;

const HEADER_VERSION_LO = 2, HEADER_VERSION_HI = 3;
const HEADER_NR_TERRITORIES_RECS_LO = 4, HEADER_NR_TERRITORIES_RECS_HI = 5;
const HEADER_NR_TERRITORIES_LO = 6, HEADER_NR_TERRITORIES_HI = 7;
const HEADER_SIZE = HEADER_NR_TERRITORIES_HI + 1;
const BYTES_PER_INT = 2, BYTES_PER_LONG = 4;
const POS_DATA_LON_MICRO_DEG_MIN = 0, POS_DATA_LAT_MICRO_DEG_MIN = 1;
const POS_DATA_LON_MICRO_DEG_MAX = 2, POS_DATA_LAT_MICRO_DEG_MAX = 3;
const POS_DATA_DATA_FLAGS = 4, DATA_FIELDS_PER_REC = 5;
const MASK_DATA_DATA_FLAGS = 0xffff, SHIFT_POS_DATA_SMART_DIV = 16;
const DATA_VERSION_MIN = 220;

function readIntLoHi(lo: number, hi: number): number {
  return (lo & 0xff) + ((hi & 0xff) << 8);
}
function readLongLoHi(lo: number, mid1: number, mid2: number, hi: number): number {
  return (lo & 0xff) + ((mid1 & 0xff) << 8) + ((mid2 & 0xff) << 16) + ((hi & 0xff) << 24);
}

export class DataModel {
  private readonly nrTerritories: number;
  private readonly nrTerritoryRecords: number;
  private readonly index: number[];
  private readonly data: number[];
  private static instance: DataModel | null = null;

  constructor(bytes: Uint8Array) {
    const total = bytes.length;
    if (total < 12) throw new IncorrectDataModelError("Data file corrupt");
    if (bytes[0] !== 0x4d /*M*/ || bytes[1] !== 0x43 /*C*/)
      throw new IncorrectDataModelError("Data file does not start with correct header");
    const dataVersion = readIntLoHi(bytes[HEADER_VERSION_LO], bytes[HEADER_VERSION_HI]);
    if (dataVersion < DATA_VERSION_MIN)
      throw new IncorrectDataModelError(`Data file version ${dataVersion} too low`);
    this.nrTerritoryRecords = readIntLoHi(bytes[HEADER_NR_TERRITORIES_RECS_LO], bytes[HEADER_NR_TERRITORIES_RECS_HI]);
    this.nrTerritories = readIntLoHi(bytes[HEADER_NR_TERRITORIES_LO], bytes[HEADER_NR_TERRITORIES_HI]);
    if (EXPECTED_NR_TERRITORIES !== 0 && this.nrTerritories !== EXPECTED_NR_TERRITORIES)
      throw new IncorrectDataModelError("Data file corrupt");
    const expectedSize = HEADER_SIZE + (this.nrTerritories + 1) * BYTES_PER_INT +
      this.nrTerritoryRecords * (DATA_FIELDS_PER_REC * BYTES_PER_LONG);
    if (expectedSize !== total) throw new IncorrectDataModelError("Data file corrupt");

    this.index = new Array(this.nrTerritories + 1);
    let i = HEADER_SIZE;
    for (let k = 0; k <= this.nrTerritories; k++) { this.index[k] = readIntLoHi(bytes[i], bytes[i + 1]); i += 2; }
    this.data = new Array(this.nrTerritoryRecords * DATA_FIELDS_PER_REC);
    for (let k = 0; k < this.nrTerritoryRecords * DATA_FIELDS_PER_REC; k++) {
      this.data[k] = readLongLoHi(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]); i += 4;
    }
  }

  static getInstance(): DataModel {
    if (DataModel.instance === null) DataModel.instance = new DataModel(MMINFO_DATA);
    return DataModel.instance;
  }

  getNrTerritories(): number { return this.nrTerritories; }
  getNrTerritoryRecords(): number { return this.nrTerritoryRecords; }
  getLonMicroDegMin(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LON_MICRO_DEG_MIN]; }
  getLatMicroDegMin(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LAT_MICRO_DEG_MIN]; }
  getLonMicroDegMax(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LON_MICRO_DEG_MAX]; }
  getLatMicroDegMax(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_LAT_MICRO_DEG_MAX]; }
  getDataFlags(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_DATA_FLAGS] & MASK_DATA_DATA_FLAGS; }
  getSmartDiv(r: number): number { return this.data[r * DATA_FIELDS_PER_REC + POS_DATA_DATA_FLAGS] >> SHIFT_POS_DATA_SMART_DIV; }
  getDataFirstRecord(territoryNumber: number): number { return this.index[territoryNumber]; }
  getDataLastRecord(territoryNumber: number): number { return this.index[territoryNumber + 1] - 1; }
}
