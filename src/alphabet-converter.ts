// Alphabet/script conversion helpers, ported faithfully from the Java Decoder
// (decodeUTF16, encodeUTF16 and their abjad/aeu helpers) plus the Data/Encoder
// constants they reference. These tables and routines properly belong to the
// Decoder/Encoder modules (Task 12/13); Territory needs decodeUTF16/encodeUTF16
// for fromString/toAlphaCode/toString(alphabet), so the self-contained slice is
// ported here to avoid a dependency cycle and to keep one shared copy.

import { Alphabet } from "./alphabet.js";
import { IllegalArgumentError } from "./errors.js";

// Data.ENCODE_CHARS (Data.java).
const ENCODE_CHARS: readonly string[] = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "B", "C", "D", "F", "G", "H", "J", "K", "L", "M",
  "N", "P", "Q", "R", "S", "T", "V", "W", "X", "Y", "Z",
  "A", "E", "U",
];

// Decoder.DECODE_CHARS (256 entries).
export const DECODE_CHARS: readonly number[] = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, -1, -1, -1, -1,
  -1, -2, 10, 11, 12, -3, 13, 14, 15, 1, 16, 17, 18, 19, 20, 0,
  21, 22, 23, 24, 25, -4, 26, 27, 28, 29, 30, -1, -1, -1, -1, -1,
  -1, -2, 10, 11, 12, -3, 13, 14, 15, 1, 16, 17, 18, 19, 20, 0,
  21, 22, 23, 24, 25, -4, 26, 27, 28, 29, 30, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
];

const GREEK_CAPITAL_ALPHA = "Α";

// Decoder.ASCII2LANGUAGE: one 36-char string per alphabet (columns A-Z then 0-9).
export const ASCII2LANGUAGE: readonly string[] = [
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  "\u0391\u0392\u039e\u0394\u0388\u0395\u0393\u0397\u0399\u03a0\u039a\u039b\u039c\u039d\u039f\u03a1\u0398\u03a8\u03a3\u03a4\u0389\u03a6\u03a9\u03a7\u03a5\u03960123456789",
  "\u0410\u0412\u0421\u0414\u0415\u0416\u0413\u041d\u0418\u041f\u041a\u041b\u041c\u0417\u041e\u0420\u0424\u042f\u0426\u0422\u042d\u0427\u0428\u0425\u0423\u04110123456789",
  "\u05d0\u05d1\u05d2\u05d3\u05e3\u05d4\u05d6\u05d7\u05d5\u05d8\u05d9\u05da\u05db\u05dc\u05e1\u05dd\u05de\u05e0\u05e2\u05e4\u05e5\u05e6\u05e7\u05e8\u05e9\u05ea0123456789",
  "\u0905\u0915\u0917\u0918\u090f\u091a\u091c\u091f?\u0920\u0923\u0924\u0926\u0927?\u0928\u092a\u092d\u092e\u0930\u092b\u0932\u0935\u0938\u0939\u092c\u0966\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f",
  "\u0d12\u0d15\u0d16\u0d17\u0d0b\u0d1a\u0d1c\u0d1f\u0d07\u0d21\u0d24\u0d25\u0d26\u0d27\u0d20\u0d28\u0d2e\u0d30\u0d31\u0d32\u0d09\u0d34\u0d35\u0d36\u0d38\u0d39\u0d66\u0d67\u0d68\u0d69\u0d6a\u0d6b\u0d6c\u0d6d\u0d6e\u0d6f",
  "\u10a0\u10a1\u10a3\u10a6\u10a4\u10a9\u10ab\u10ac\u10b3\u10ae\u10b0\u10b1\u10b2\u10b4\u10ad\u10b5\u10b6\u10b7\u10b8\u10b9\u10a8\u10ba\u10bb\u10bd\u10be\u10bf0123456789",
  "\u30a2\u30ab\u30ad\u30af\u30aa\u30b1\u30b3\u30b5\u30a4\u30b9\u30c1\u30c8\u30ca\u30cc\u30a6\u30d2\u30d5\u30d8\u30db\u30e1\u30a8\u30e2\u30e8\u30e9\u30ed\u30f20123456789",
  "\u0e30\u0e01\u0e02\u0e04\u0e32\u0e07\u0e08\u0e09\u0e31\u0e0a\u0e11\u0e14\u0e16\u0e17\u0e0d\u0e18\u0e1a\u0e1c\u0e21\u0e23\u0e2c\u0e25\u0e27\u0e2d\u0e2e\u0e2f\u0e50\u0e51\u0e52\u0e53\u0e54\u0e55\u0e56\u0e57\u0e58\u0e59",
  "\u0eb0\u0e81\u0e82\u0e84\u0ec3\u0e87\u0e88\u0e8a\u0ec4\u0e8d\u0e94\u0e97\u0e99\u0e9a\u0ec6\u0e9c\u0e9e\u0ea1\u0ea2\u0ea3\u0ebd\u0ea7\u0eaa\u0eab\u0ead\u0eaf0123456789",
  "\u0556\u0532\u0533\u0534\u0535\u0538\u0539\u053a\u053b\u053d\u053f\u0540\u0541\u0543\u0555\u0547\u0548\u054a\u054d\u054e\u0545\u054f\u0550\u0551\u0552\u05530123456789",
  "\u099c\u0998\u0995\u0996\u09ae\u0997\u0999\u099a\u09ab\u099d\u09a0\u09a1\u09a2\u09a3\u099e\u09a4\u09a5\u09a6\u09a8\u09aa\u099f\u09ac\u09ad\u09af\u09b2\u09b9\u09e6\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef",
  "\u0a05\u0a15\u0a17\u0a18\u0a0f\u0a1a\u0a1c\u0a1f?\u0a20\u0a23\u0a24\u0a26\u0a27?\u0a28\u0a2a\u0a2d\u0a2e\u0a30\u0a2b\u0a32\u0a35\u0a38\u0a39\u0a21\u0a66\u0a67\u0a68\u0a69\u0a6a\u0a6b\u0a6c\u0a6d\u0a6e\u0a6f",
  "\u0f58\u0f40\u0f41\u0f42\u0f64\u0f44\u0f45\u0f46?\u0f47\u0f49\u0f55\u0f50\u0f4f?\u0f51\u0f53\u0f54\u0f56\u0f5e\u0f60\u0f5f\u0f61\u0f62\u0f63\u0f66\u0f20\u0f21\u0f22\u0f23\u0f24\u0f25\u0f26\u0f27\u0f28\u0f29",
  "\u0628\u062a\u062d\u062e\u062b\u062f\u0630\u0631\u0627\u0632\u0633\u0634\u0635\u0636\u0647\u0637\u0638\u0639\u063a\u0641\u0642\u062c\u0644\u0645\u0646\u06480123456789",
  "\u1112\u1100\u1102\u1103\u1166\u1105\u1107\u1109\u1175\u1110\u1111\u1161\u1162\u1163\u110b\u1164\u1165\u1167\u1169\u1172\u1174\u110c\u110e\u110f\u116d\u116e0123456789",
  "\u1005\u1000\u1001\u1002\u1013\u1003\u1004\u101a\u101b\u1007\u100c\u100d\u100e\u1010\u101d\u1011\u1012\u101e\u1014\u1015\u1016\u101f\u1017\u1018\u100f\u101c\u1040\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049",
  "\u1789\u1780\u1781\u1782\u1785\u1783\u1784\u1787\u179a\u1788\u178a\u178c\u178d\u178e\u179c\u1791\u1792\u1793\u1794\u1795\u179f\u1796\u1798\u179b\u17a0\u17a2\u17e0\u17e1\u17e2\u17e3\u17e4\u17e5\u17e6\u17e7\u17e8\u17e9",
  "\u0d85\u0d9a\u0d9c\u0d9f\u0d89\u0da2\u0da7\u0da9\u0dc2\u0dac\u0dad\u0daf\u0db1\u0db3\u0dc5\u0db4\u0db6\u0db8\u0db9\u0dba\u0d8b\u0dbb\u0dbd\u0dc0\u0dc3\u0dc40123456789",
  "\u0794\u0780\u0781\u0782\u0797\u0783\u0784\u0785\u07a4\u0786\u0787\u0788\u0789\u078a\u0796\u078b\u078c\u078d\u078e\u078f\u079c\u0790\u0791\u0792\u0793\u07b10123456789",
  "\u3123\u3105\u3108\u3106\u3114\u3107\u3109\u310a\u311e\u310b\u310c\u310d\u310e\u310f\u3120\u3115\u3116\u3110\u3111\u3112\u3113\u3129\u3117\u3128\u3118\u31190123456789",
  "\u2d49\u2d31\u2d33\u2d37\u2d53\u2d3c\u2d3d\u2d40\u2d4f\u2d43\u2d44\u2d45\u2d47\u2d4d\u2d54\u2d4e\u2d55\u2d56\u2d59\u2d5a\u2d62\u2d5b\u2d5c\u2d5f\u2d61\u2d630123456789",
  "\u0b99\u0b95\u0b9a\u0b9f\u0b86\u0ba4\u0ba8\u0baa\u0ba9\u0bae\u0baf\u0bb0\u0bb2\u0bb5\u0b9e\u0bb4\u0bb3\u0bb1\u0b85\u0b88\u0b93\u0b89\u0b8e\u0b8f\u0b90\u0b920123456789",
  "\u121b\u1260\u1264\u12f0\u121e\u134a\u1308\u1200\u12a0\u12e8\u12ac\u1208\u1293\u1350\u12d0\u1354\u1240\u1244\u122c\u1220\u12c8\u1226\u1270\u1276\u1338\u12dc\u1372\u1369\u136a\u136b\u136c\u136d\u136e\u136f\u1370\u1371",
  "\u0c1e\u0c15\u0c17\u0c19\u0c2b\u0c1a\u0c1c\u0c1f\u0c1b\u0c20\u0c21\u0c23\u0c24\u0c25\u0c16\u0c26\u0c27\u0c28\u0c2a\u0c2c\u0c2d\u0c2e\u0c30\u0c32\u0c33\u0c350123456789",
  "\u0b1d\u0b15\u0b16\u0b17\u0b23\u0b18\u0b1a\u0b1c\u0b2b\u0b1f\u0b21\u0b22\u0b24\u0b25\u0b20\u0b26\u0b27\u0b28\u0b2a\u0b2c\u0b39\u0b2e\u0b2f\u0b30\u0b33\u0b380123456789",
  "\u0c92\u0c95\u0c96\u0c97\u0c8e\u0c99\u0c9a\u0c9b\u0c85\u0c9c\u0ca0\u0ca1\u0ca3\u0ca4\u0c89\u0ca6\u0ca7\u0ca8\u0caa\u0cab\u0c87\u0cac\u0cad\u0cb0\u0cb2\u0cb50123456789",
  "\u0ab3\u0a97\u0a9c\u0aa1\u0a87\u0aa6\u0aac\u0a95\u0a8f\u0a9a\u0a9f\u0aa4\u0aaa\u0aa0\u0a8d\u0ab0\u0ab5\u0a9e\u0aae\u0aab\u0a89\u0ab7\u0aa8\u0a9d\u0aa2\u0aad0123456789",
];

// Decoder.UNICODE2ASCII: [min, max, convert] ranges (min/max are code points).
export const UNICODE2ASCII: ReadonlyArray<readonly [number, number, string]> = [
  [0x0041, 0x005a, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  [0x0388, 0x03a9, "EU???????ABGDFZHQIKLMNCOJP?STYVXRW"],
  [0x0410, 0x042f, "AZBGDEFNI?KLMHOJPCTYQXSVW????U?R"],
  [0x05d0, 0x05ea, "ABCDFIGHJKLMNPQ?ROSETUVWXYZ"],
  [0x0905, 0x0939, "A?????????E?????B?CD?F?G??HJZ?KL?MNP?QUZRS?T?V??W??XY"],
  [0x0d07, 0x0d39, "I?U?E??????A??BCD??F?G??HOJ??KLMNP?????Q?RST?VWX?YZ"],
  [0x10a0, 0x10bf, "AB?CE?D?UF?GHOJ?KLMINPQRSTVW?XYZ"],
  [0x30a2, 0x30f2, "A?I?O?U?EB?C?D?F?G?H???J???????K??????L?M?N?????P??Q??R??S?????TV?????WX???Y????Z"],
  [0x0e01, 0x0e32, "BC?D??FGHJ??O???K??L?MNP?Q?R????S?T?V?W????UXYZAIE"],
  [0x0e81, 0x0ec6, "BC?D??FG?H??J??????K??L?MN?P?Q??RST???V??WX?Y?ZA????????????U?????EI?O"],
  [0x0532, 0x0556, "BCDE??FGHI?J?KLM?N?U?PQ?R??STVWXYZ?OA"],
  [0x0995, 0x09b9, "CDFBGH?AJOUKLMNPQR?S?TIVWEX??Y??????Z"],
  [0x0a05, 0x0a39, "A?????????E?????B?CD?F?G??HJZ?KL?MNP?QU?RS?T?V??W??XY"],
  [0x0f40, 0x0f66, "BCD?FGHJ?K?????NMP?QRLS?A?????TVUWXYE?Z"],
  [0x0627, 0x0648, "IA?BEVCDFGHJKLMNPQRS??????TU?WXYOZ"],
  [0x0966, 0x096f, "0123456789"],
  [0x0d66, 0x0d6f, "0123456789"],
  [0x0e50, 0x0e59, "0123456789"],
  [0x09e6, 0x09ef, "0123456789"],
  [0x0a66, 0x0a6f, "0123456789"],
  [0x0f20, 0x0f29, "0123456789"],
  [0x1040, 0x1049, "0123456789"],
  [0x17e0, 0x17e9, "0123456789"],
  [0x0be6, 0x0bef, "0123456789"],
  [0x1369, 0x1372, "1234567890"],
  [0x1100, 0x1175, "B?CD?F?G?H?OV?WXJKA??????????????????????????????????????????????????????????????????????????????LMNPQER?S???YZ???T?UI"],
  [0x1000, 0x101f, "BCDFGA?J????KLMYNPQESTUWX?HIZORV"],
  [0x1780, 0x17a2, "BCDFGE?HJAK?LMN??PQRSTV?W?IXO??UY?Z"],
  [0x0d85, 0x0dc5, "A???E?U??????????????B?C??D??F????G?H??JK?L?M?NP?Q?RSTV?W??X?IYZO"],
  [0x0780, 0x07b1, "BCDFGHJKLMNPQRSTVWXYA?OE????U???????I????????????Z"],
  [0x3105, 0x3129, "BDFCGHJKLMNRSTUEPQWYZ????I?O??A????XV"],
  [0x2d31, 0x2d63, "B?C???D????FG??H??JKL?M?A???NPI???EOQR??STVW??X?YUZ"],
  [0x0b85, 0x0bb5, "SE?TV????WXY?ZU?B???AC???OD????F???GIH???JKLRMQPN"],
  [0x1200, 0x1354, "H???????L??????????????????A??E?T?????V?????S???????????????????Q???R???????????????????????????B???C???????????W?????X????????????????????????????M????????????I???????????K???????????????????????????U???????O???????????Z???????????J???????D???????????????????????G???????????????????????????????????????????????Y?????????????????F?????N???P"],
  [0x0c15, 0x0c35, "BOC?DFIG?AHJK?LMNPQR?SETUV?W?XY?Z"],
  [0x0b15, 0x0b39, "BCDF?G?HA?JOKLEMNPQR?SIT?VWX??Y????ZU"],
  [0x0c85, 0x0cb5, "I?U?O????E???A??BCD?FGHJ???KL?MN?PQR?STVW??X?Y??Z"],
  [0x0a87, 0x0ab7, "E?U???O?I?????H?B??J?CXRKNDY?L?F?W?MTGZS?P??A?Q?V"],
  [0x03ad, 0x03c9, "EU??ABGDFZHQIKLMNCOJP?STYVXRW"],
  [0x10d0, 0x10ef, "AB?CE?D?UF?GHOJ?KLMINPQRSTVW?XYZ"],
  [0x0562, 0x0586, "BCDE??FGHI?J?KLM?N?U?PQ?R??STVWXYZ?OA"],
];

function decodeChar(ch: string): number {
  const c = ch.charCodeAt(0);
  return c < DECODE_CHARS.length ? DECODE_CHARS[c] : -1;
}

// Decoder.aeuUnpack: unpack a vowel-encoded mapcode into all-digit form.
// Returns "" on error. Assumes the input is already uppercase.
export function aeuUnpack(argStr: string): string {
  let str = decodeUTF16(argStr);
  let voweled = false;
  const lastpos = str.length - 1;
  let dotpos = str.indexOf(".");
  if (dotpos < 2 || lastpos < dotpos + 2) {
    return "";
  }

  if (str.charAt(0) === "A") {
    let v1 = decodeChar(str.charAt(lastpos));
    if (v1 < 0) v1 = 31;
    let v2 = decodeChar(str.charAt(lastpos - 1));
    if (v2 < 0) v2 = 31;
    const s = String(1000 + v1 + 32 * v2);
    str = s.charAt(1) + str.substring(1, lastpos - 1) + s.charAt(2) + s.charAt(3);
    voweled = true;
  } else if (str.charAt(0) === "U") {
    voweled = true;
    str = str.substring(1);
    dotpos--;
  } else {
    let v = str.charCodeAt(lastpos - 1);
    if (v === "A".charCodeAt(0)) {
      v = 0;
    } else if (v === "E".charCodeAt(0)) {
      v = 34;
    } else if (v === "U".charCodeAt(0)) {
      v = 68;
    } else {
      v = -1;
    }
    if (v >= 0) {
      const e = str.charAt(lastpos);
      if (e === "A") {
        v += 31;
      } else if (e === "E") {
        v += 32;
      } else if (e === "U") {
        v += 33;
      } else {
        const ve = decodeChar(str.charAt(lastpos));
        if (ve < 0) return "";
        v += ve;
      }
      if (v >= 100) return "";
      voweled = true;
      str = str.substring(0, lastpos - 1) + ENCODE_CHARS[Math.trunc(v / 10)] + ENCODE_CHARS[v % 10];
    }
  }

  if (dotpos < 2 || dotpos > 5) {
    return "";
  }

  for (let v = 0; v <= lastpos; v++) {
    if (v !== dotpos) {
      const i = str.charCodeAt(v);
      const d = i < DECODE_CHARS.length ? DECODE_CHARS[i] : -1;
      if (d < 0) {
        return "";
      } else if (voweled && d > 9) {
        return "";
      }
    }
  }

  return str;
}

// Encoder.aeuPack: add vowels to prevent all-digit mapcodes.
function aeuPack(argStr: string, argShort: boolean): string {
  let str = argStr;
  let dotpos = -9;
  let rlen = str.length;
  let rest = "";
  for (let d = 0; d < rlen; d++) {
    const c = str.charAt(d);
    if (c < "0" || c > "9") {
      if (c === "." && dotpos < 0) {
        dotpos = d;
      } else if (c === "-") {
        rest = str.substring(d);
        str = str.substring(0, d);
        rlen = d;
      } else {
        return str;
      }
    }
  }

  if (rlen - 2 > dotpos) {
    if (argShort) {
      const v =
        (str.charCodeAt(0) - 48) * 100 +
        (str.charCodeAt(rlen - 2) - 48) * 10 +
        (str.charCodeAt(rlen - 1) - 48);
      return "A" + str.substring(1, rlen - 2) + ENCODE_CHARS[Math.trunc(v / 32)] + ENCODE_CHARS[v % 32] + rest;
    } else {
      const v = (str.charCodeAt(rlen - 2) - 48) * 10 + str.charCodeAt(rlen - 1) - 48;
      str = str.substring(0, rlen - 2) + ENCODE_CHARS[31 + Math.trunc(v / 34)] + ENCODE_CHARS[v % 34];
    }
  }
  return str + rest;
}

function isAbjadScript(argStr: string): boolean {
  for (let i = 0; i < argStr.length; i++) {
    const c = argStr.charCodeAt(i);
    if (c >= 0x0628 && c <= 0x0649) return true; // Arabic
    if (c >= 0x05d0 && c <= 0x05ea) return true; // Hebrew
    if (c >= 0x388 && c <= 0x3c9) return true; // Greek upper and lower
    if ((c >= 0x1100 && c <= 0x1174) || (c >= 0xad6c && c <= 0xd314)) return true; // Korean
  }
  return false;
}

function convertFromAbjad(mapcode: string): string {
  let p = mapcode.lastIndexOf(" ");
  if (p < 0) {
    p = 0;
  } else {
    p++;
  }
  const prefix = mapcode.substring(0, p);
  const remainder = mapcode.substring(p);
  let postfix: string;
  const h = remainder.indexOf("-");
  let s: string;
  if (h > 0) {
    postfix = remainder.substring(h);
    s = aeuUnpack(remainder.substring(0, h));
  } else {
    postfix = "";
    s = aeuUnpack(remainder);
  }

  const len = s.length;
  const dot = s.indexOf(".");
  if (dot < 2 || dot > 5) {
    return mapcode;
  }
  const form = 10 * dot + (len - dot - 1);

  let newstr = "";
  if (form === 23) {
    const c = decodeChar(s.charAt(3)) * 8 + (decodeChar(s.charAt(4)) - 18);
    if (c >= 0 && c < 31) {
      newstr = s.substring(0, 2) + "." + ENCODE_CHARS[c] + s.charAt(5);
    }
  } else if (form === 24) {
    const c = decodeChar(s.charAt(3)) * 8 + (decodeChar(s.charAt(4)) - 18);
    if (c >= 32 && c < 63) {
      newstr = s.substring(0, 2) + ENCODE_CHARS[c - 32] + "." + s.charAt(5) + s.charAt(6);
    } else if (c >= 0 && c < 31) {
      newstr = s.substring(0, 2) + "." + ENCODE_CHARS[c % 31] + s.charAt(5) + s.charAt(6);
    }
  } else if (form === 34) {
    const c = decodeChar(s.charAt(2)) * 10 + (decodeChar(s.charAt(5)) - 7);
    if (c >= 0 && c < 31) {
      newstr = s.substring(0, 2) + "." + ENCODE_CHARS[c] + s.charAt(4) + s.charAt(6) + s.charAt(7);
    } else if (c >= 31 && c < 62) {
      newstr = s.substring(0, 2) + ENCODE_CHARS[c - 31] + "." + s.charAt(4) + s.charAt(6) + s.charAt(7);
    } else if (c >= 62 && c < 93) {
      newstr = s.substring(0, 2) + ENCODE_CHARS[c - 62] + s.charAt(4) + "." + s.charAt(6) + s.charAt(7);
    }
  } else if (form === 35) {
    const c = decodeChar(s.charAt(2)) * 8 + (decodeChar(s.charAt(6)) - 18);
    if (c >= 32 && c < 63) {
      newstr = s.substring(0, 2) + ENCODE_CHARS[c - 32] + s.charAt(4) + "." + s.charAt(5) + s.charAt(7) + s.charAt(8);
    } else if (c >= 0 && c < 31) {
      newstr = s.substring(0, 2) + ENCODE_CHARS[c] + "." + s.charAt(4) + s.charAt(5) + s.charAt(7) + s.charAt(8);
    }
  } else if (form === 45) {
    const c = decodeChar(s.charAt(2)) * 100 + decodeChar(s.charAt(5)) * 10 + (decodeChar(s.charAt(8)) - 39);
    if (c >= 0 && c < 961) {
      newstr =
        s.substring(0, 2) + ENCODE_CHARS[Math.trunc(c / 31)] + s.charAt(3) + "." + s.charAt(6) + s.charAt(7) +
        s.charAt(9) + ENCODE_CHARS[c % 31];
    }
  } else if (form === 55) {
    const c = decodeChar(s.charAt(2)) * 100 + decodeChar(s.charAt(6)) * 10 + (decodeChar(s.charAt(9)) - 39);
    if (c >= 0 && c < 961) {
      newstr =
        s.substring(0, 2) + ENCODE_CHARS[Math.trunc(c / 31)] + s.charAt(3) + s.charAt(4) + "." + s.charAt(7) +
        s.charAt(8) + s.charAt(10) + ENCODE_CHARS[c % 31];
    }
  }

  if (newstr.length === 0) {
    return mapcode;
  }
  return prefix + aeuPack(newstr, false) + postfix;
}

function convertToAbjad(mapcode: string): string {
  let str: string;
  let rest: string;
  const h = mapcode.indexOf("-");
  if (h > 0) {
    rest = mapcode.substring(h);
    str = aeuUnpack(mapcode.substring(0, h));
  } else {
    rest = "";
    str = aeuUnpack(mapcode);
  }

  const len = str.length;
  const dot = str.indexOf(".");
  if (dot < 2 || dot > 5) {
    return mapcode;
  }
  const form = 10 * dot + (len - dot - 1);

  let inarow = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charAt(i);
    if (ch !== ".") {
      inarow++;
      if (ch >= "0" && ch <= "9") {
        inarow = 0;
      } else if (inarow > 2) {
        break;
      }
    }
  }

  if (
    inarow < 3 &&
    (form === 22 || form === 32 || form === 33 || form === 42 || form === 43 || form === 44 || form === 54)
  ) {
    return mapcode;
  }

  let c = decodeChar(str.charAt(2));
  if (c < 0) {
    c = decodeChar(str.charAt(3));
  }
  if (c < 0) {
    return mapcode;
  }

  let c1: string;
  let c2: string;
  let c3: string;
  if (form >= 44) {
    c = c * 31 + decodeChar(str.charAt(len - 1)) + 39;
    if (c < 39 || c > 999) {
      return mapcode;
    }
    c1 = ENCODE_CHARS[Math.trunc(c / 100)];
    c2 = ENCODE_CHARS[Math.trunc((c % 100) / 10)];
    c3 = ENCODE_CHARS[c % 10];
  } else if (len === 7) {
    if (form === 24) {
      c += 7;
    } else if (form === 33) {
      c += 38;
    } else if (form === 42) {
      c += 69;
    }
    c1 = ENCODE_CHARS[Math.trunc(c / 10)];
    c2 = ENCODE_CHARS[c % 10];
    c3 = "?";
  } else {
    c1 = ENCODE_CHARS[2 + Math.trunc(c / 8)];
    c2 = ENCODE_CHARS[2 + (c % 8)];
    c3 = "?";
  }

  if (form === 22) {
    str = str.substring(0, 2) + "." + c1 + c2 + str.charAt(4);
  } else if (form === 23) {
    str = str.substring(0, 2) + "." + c1 + c2 + str.charAt(4) + str.charAt(5);
  } else if (form === 32) {
    str = str.substring(0, 2) + "." + String.fromCharCode(c1.charCodeAt(0) + 4) + c2 + str.charAt(4) + str.charAt(5);
  } else if (form === 24) {
    str = str.substring(0, 2) + c1 + "." + str.charAt(4) + c2 + str.charAt(5) + str.charAt(6);
  } else if (form === 33) {
    str = str.substring(0, 2) + c1 + "." + str.charAt(4) + c2 + str.charAt(5) + str.charAt(6);
  } else if (form === 42) {
    str = str.substring(0, 2) + c1 + "." + str.charAt(3) + c2 + str.charAt(5) + str.charAt(6);
  } else if (form === 43) {
    str =
      str.substring(0, 2) + String.fromCharCode(c1.charCodeAt(0) + 4) + "." + str.charAt(3) + str.charAt(5) + c2 +
      str.charAt(6) + str.charAt(7);
  } else if (form === 34) {
    str = str.substring(0, 2) + c1 + "." + str.charAt(4) + str.charAt(5) + c2 + str.charAt(6) + str.charAt(7);
  } else if (form === 44) {
    str = str.substring(0, 2) + c1 + str.charAt(3) + "." + c2 + str.charAt(5) + str.charAt(6) + c3 + str.charAt(7);
  } else if (form === 54) {
    str =
      str.substring(0, 2) + c1 + str.charAt(3) + str.charAt(4) + "." + c2 + str.charAt(6) + str.charAt(7) + c3 +
      str.charAt(8);
  } else {
    return mapcode;
  }
  return aeuPack(str + rest, false);
}

// Decoder.decodeUTF16: convert a Unicode mapcode string to ASCII Roman.
export function decodeUTF16(mapcode: string): string {
  let result: string;
  let asciiBuf = "";
  for (let idx = 0; idx < mapcode.length; idx++) {
    const ch = mapcode.charCodeAt(idx);
    if (ch === ".".charCodeAt(0)) {
      asciiBuf += ".";
    } else if (ch >= 1 && ch <= "z".charCodeAt(0)) {
      asciiBuf += mapcode.charAt(idx);
    } else {
      let found = false;
      for (const [min, max, convert] of UNICODE2ASCII) {
        if (ch >= min && ch <= max) {
          asciiBuf += convert.charAt(ch - min);
          found = true;
          break;
        }
      }
      if (!found) {
        asciiBuf += "?";
        break;
      }
    }
  }
  result = asciiBuf;

  if (mapcode.startsWith(GREEK_CAPITAL_ALPHA)) {
    const unpacked = aeuUnpack(result);
    if (unpacked.length === 0) {
      throw new IllegalArgumentError("decodeUTF16: cannot decode " + mapcode);
    }
    result = aeuPack(unpacked, false);
  }

  if (isAbjadScript(mapcode)) {
    return convertFromAbjad(result);
  }
  return result;
}

// Decoder.encodeUTF16: convert a Roman ASCII mapcode string into another alphabet.
export function encodeUTF16(mapcodeInput: string, alphabetCode: number): string {
  let mapcode: string;
  if (
    alphabetCode === Alphabet.GREEK.getNumber() ||
    alphabetCode === Alphabet.HEBREW.getNumber() ||
    alphabetCode === Alphabet.KOREAN.getNumber() ||
    alphabetCode === Alphabet.ARABIC.getNumber()
  ) {
    mapcode = convertToAbjad(mapcodeInput);
  } else {
    mapcode = mapcodeInput;
  }

  let mapcodeToEncode: string;
  if (alphabetCode === Alphabet.GREEK.getNumber() && (mapcode.indexOf("E") !== -1 || mapcode.indexOf("U") !== -1)) {
    const unpacked = aeuUnpack(mapcode);
    if (unpacked.length === 0) {
      throw new IllegalArgumentError(
        "encodeToAlphabetCode: cannot encode '" + mapcode + "' to alphabet " + alphabetCode,
      );
    }
    mapcodeToEncode = aeuPack(unpacked, true);
  } else {
    mapcodeToEncode = mapcode;
  }

  let sb = "";
  for (let i = 0; i < mapcodeToEncode.length; i++) {
    const ch = mapcodeToEncode.charAt(i).toUpperCase();
    const code = ch.charCodeAt(0);
    if (code > "Z".charCodeAt(0)) {
      sb += "?";
    } else if (code < "A".charCodeAt(0)) {
      sb += ch;
    } else {
      sb += ASCII2LANGUAGE[alphabetCode].charAt(code - "A".charCodeAt(0));
    }
  }
  return sb;
}

// Mapcode.convertStringToPlainAscii.
export function convertStringToPlainAscii(s: string): string {
  return decodeUTF16(s.toUpperCase());
}

// Mapcode.convertStringToAlphabet.
export function convertStringToAlphabet(s: string, alphabet: Alphabet | null): string {
  return alphabet !== null ? encodeUTF16(s.toUpperCase(), alphabet.getNumber()) : s.toUpperCase();
}
