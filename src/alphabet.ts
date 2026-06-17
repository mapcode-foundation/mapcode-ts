import { checkNonnull } from "./check-args.js";
import { UnknownAlphabetError } from "./errors.js";

export class Alphabet {
  static readonly ROMAN = new Alphabet("ROMAN", 0);
  static readonly GREEK = new Alphabet("GREEK", 1);
  static readonly CYRILLIC = new Alphabet("CYRILLIC", 2);
  static readonly HEBREW = new Alphabet("HEBREW", 3);
  static readonly DEVANAGARI = new Alphabet("DEVANAGARI", 4);
  static readonly MALAYALAM = new Alphabet("MALAYALAM", 5);
  static readonly GEORGIAN = new Alphabet("GEORGIAN", 6);
  static readonly KATAKANA = new Alphabet("KATAKANA", 7);
  static readonly THAI = new Alphabet("THAI", 8);
  static readonly LAO = new Alphabet("LAO", 9);
  static readonly ARMENIAN = new Alphabet("ARMENIAN", 10);
  static readonly BENGALI = new Alphabet("BENGALI", 11);
  static readonly GURMUKHI = new Alphabet("GURMUKHI", 12);
  static readonly TIBETAN = new Alphabet("TIBETAN", 13);
  static readonly ARABIC = new Alphabet("ARABIC", 14);
  static readonly KOREAN = new Alphabet("KOREAN", 15);
  static readonly BURMESE = new Alphabet("BURMESE", 16);
  static readonly KHMER = new Alphabet("KHMER", 17);
  static readonly SINHALESE = new Alphabet("SINHALESE", 18);
  static readonly THAANA = new Alphabet("THAANA", 19);
  static readonly CHINESE = new Alphabet("CHINESE", 20);
  static readonly TIFINAGH = new Alphabet("TIFINAGH", 21);
  static readonly TAMIL = new Alphabet("TAMIL", 22);
  static readonly AMHARIC = new Alphabet("AMHARIC", 23);
  static readonly TELUGU = new Alphabet("TELUGU", 24);
  static readonly ODIA = new Alphabet("ODIA", 25);
  static readonly KANNADA = new Alphabet("KANNADA", 26);
  static readonly GUJARATI = new Alphabet("GUJARATI", 27);

  private static readonly BY_NAME = new Map<string, Alphabet>();
  private static readonly VALUES: Alphabet[] = [];

  private constructor(readonly name: string, private readonly number: number) {}

  static register(a: Alphabet): void {
    Alphabet.BY_NAME.set(a.name, a);
    Alphabet.VALUES[a.number] = a;
  }

  getNumber(): number { return this.number; }
  toString(): string { return this.name; }

  static values(): Alphabet[] { return Alphabet.VALUES.slice(); }

  static fromString(alphaCode: string): Alphabet {
    checkNonnull("alphaCode", alphaCode);
    const trimmed = alphaCode.trim().toUpperCase();
    const found = Alphabet.BY_NAME.get(trimmed);
    if (found === undefined) throw new UnknownAlphabetError(trimmed);
    return found;
  }
}

// Build lookup tables (static instances are created above before this runs).
for (const a of [
  Alphabet.ROMAN, Alphabet.GREEK, Alphabet.CYRILLIC, Alphabet.HEBREW, Alphabet.DEVANAGARI,
  Alphabet.MALAYALAM, Alphabet.GEORGIAN, Alphabet.KATAKANA, Alphabet.THAI, Alphabet.LAO,
  Alphabet.ARMENIAN, Alphabet.BENGALI, Alphabet.GURMUKHI, Alphabet.TIBETAN, Alphabet.ARABIC,
  Alphabet.KOREAN, Alphabet.BURMESE, Alphabet.KHMER, Alphabet.SINHALESE, Alphabet.THAANA,
  Alphabet.CHINESE, Alphabet.TIFINAGH, Alphabet.TAMIL, Alphabet.AMHARIC, Alphabet.TELUGU,
  Alphabet.ODIA, Alphabet.KANNADA, Alphabet.GUJARATI,
]) {
  Alphabet.register(a);
}
