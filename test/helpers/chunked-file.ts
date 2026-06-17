import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const RESOURCES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "resources");

/**
 * Signals that the end of a chunked file (all chunks) has been reached. Mirrors the
 * {@code java.io.EOFException} thrown by the Java {@code ReferenceFileTest.ChunkedFile}.
 */
export class EOFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EOFError";
  }
}

/**
 * Utility to read chunked reference files. Chunked files have an extension appended to
 * them like '.a', '.b', etc. This class reads lines from such files and rolls over to
 * the next chunk when the current one is exhausted.
 *
 * Faithful port of the {@code ChunkedFile} inner class in {@code ReferenceFileTest.java}.
 * Each chunk is read fully into memory with {@code fs.readFileSync} and split on '\n'
 * (chunks are line-oriented and at most ~5 MB).
 */
export class ChunkedFile {
  readonly baseFileName: string;
  fileName: string;
  private fileExt: number; // char code, starts at 'a'
  private lines: string[] | null;
  private lineIndex: number;

  constructor(baseFileName: string) {
    this.baseFileName = baseFileName;
    this.fileExt = "a".charCodeAt(0);
    this.fileName = baseFileName + "." + String.fromCharCode(this.fileExt);
    const fullPath = path.join(RESOURCES_DIR, this.fileName);
    if (!fs.existsSync(fullPath)) {
      throw new Error("ChunkedFile: first chunk not found: " + fullPath);
    }
    this.lines = this.readChunk(fullPath);
    this.lineIndex = 0;
  }

  private readChunk(fullPath: string): string[] {
    const content = fs.readFileSync(fullPath, "utf8");
    // Split on '\n'; a trailing newline produces a final empty element which is
    // harmless (treated as an empty line and skipped by readNonEmptyLine).
    return content.split("\n");
  }

  /**
   * Read the next non-empty line, rolling over to the next chunk on exhaustion.
   *
   * @throws EOFError when there are no more chunks and no more non-empty lines.
   */
  readNonEmptyLine(): string {
    // Equivalent of Java's readNonEmptyLine(): keep reading until a non-empty line
    // is found, advancing chunks when the current one is exhausted.
    for (;;) {
      while (this.lines !== null && this.lineIndex < this.lines.length) {
        let line = this.lines[this.lineIndex];
        this.lineIndex++;
        // Strip a possible trailing carriage return (CRLF tolerance).
        if (line.length > 0 && line.charCodeAt(line.length - 1) === 13) {
          line = line.substring(0, line.length - 1);
        }
        if (line.length > 0) {
          return line;
        }
      }
      // Current chunk exhausted: move to next chunk (throws EOFError if none).
      this.nextChunk();
    }
  }

  private nextChunk(): void {
    this.fileExt++;
    this.fileName = this.baseFileName + "." + String.fromCharCode(this.fileExt);
    const fullPath = path.join(RESOURCES_DIR, this.fileName);
    if (fs.existsSync(fullPath)) {
      this.lines = this.readChunk(fullPath);
      this.lineIndex = 0;
    } else {
      this.lines = null;
      throw new EOFError("End of chunked file reached (chunk not found): " + this.fileName);
    }
  }

  close(): void {
    this.lines = null;
    this.lineIndex = 0;
  }
}
