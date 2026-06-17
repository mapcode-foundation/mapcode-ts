import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const datPath = join(here, "..", "data", "mminfo.dat");
const outPath = join(here, "..", "src", "data", "mminfo-data.ts");

const bytes = readFileSync(datPath);
const b64 = bytes.toString("base64");

const content = `// AUTO-GENERATED from data/mminfo.dat by scripts/generate-data.mts. Do not edit.
const BASE64 =
  "${b64}";

function decode(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const MMINFO_DATA: Uint8Array = decode(BASE64);
`;

writeFileSync(outPath, content);
console.log(`Wrote ${outPath} (${bytes.length} bytes -> ${b64.length} base64 chars)`);
