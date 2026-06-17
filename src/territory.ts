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

import { Alphabet } from "./alphabet.js";
import { UnknownTerritoryError, IllegalArgumentError } from "./errors.js";
import { checkNonnull } from "./check-args.js";
import { convertStringToPlainAscii, convertStringToAlphabet } from "./alphabet-converter.js";
import { ISO3_TO_ISO2 } from "./iso-country-codes.js";

/**
 * Enumeration that specifies the format for mapcodes.
 */
export const AlphaCodeFormat = {
  INTERNATIONAL: 0,
  MINIMAL_UNAMBIGUOUS: 1,
  MINIMAL: 2,
} as const;
export type AlphaCodeFormat = (typeof AlphaCodeFormat)[keyof typeof AlphaCodeFormat];

/**
 * This class defines the available territory codes as used by mapcode.
 * Faithful port of the Java {@code com.mapcode.Territory} enum.
 */
export class Territory {
  // ----------------------------------------------------------------------------------------------
  // Territory constants (declaration order preserved; ordinal == index in ALL).
  // ----------------------------------------------------------------------------------------------
  static readonly USA = new Territory(410, "USA", null, null, ["US"], ["United States of America", "America"]);
  static readonly IND = new Territory(407, "India", [Alphabet.DEVANAGARI, Alphabet.BENGALI, Alphabet.ROMAN], null, ["IN"], null);
  static readonly CAN = new Territory(495, "Canada", null, null, ["CA"], null);
  static readonly AUS = new Territory(408, "Australia", null, null, ["AU"], null);
  static readonly MEX = new Territory(411, "Mexico", null, null, ["MX"], null);
  static readonly BRA = new Territory(409, "Brazil", null, null, ["BR"], null);
  static readonly RUS = new Territory(496, "Russia", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, ["RU"], null);
  static readonly CHN = new Territory(528, "China", [Alphabet.CHINESE, Alphabet.ROMAN], null, ["CN"], null);
  static readonly ATA = new Territory(531, "Antarctica", null, null, null, null);
  static readonly VAT = new Territory(0, "Vatican City", null, null, null, ["Holy See"]);
  static readonly MCO = new Territory(1, "Monaco", null, null, null, null);
  static readonly GIB = new Territory(2, "Gibraltar", null, null, null, null);
  static readonly TKL = new Territory(3, "Tokelau", null, null, null, null);
  static readonly CCK = new Territory(4, "Cocos Islands", [Alphabet.ROMAN, Alphabet.ARABIC], null, ["AU-CC", "AUS-CC"], ["Keeling Islands"]);
  static readonly BLM = new Territory(5, "Saint-Barthelemy", null, null, null, null);
  static readonly NRU = new Territory(6, "Nauru", null, null, null, null);
  static readonly TUV = new Territory(7, "Tuvalu", null, null, null, null);
  static readonly MAC = new Territory(8, "Macau", [Alphabet.CHINESE, Alphabet.ROMAN], null, ["CN-92", "CHN-92", "CN-MC", "CHN-MC", "CN-MO", "CHN-MO"], ["Aomen"]);
  static readonly SXM = new Territory(9, "Sint Maarten", null, null, null, null);
  static readonly MAF = new Territory(10, "Saint-Martin", null, null, null, null);
  static readonly NFK = new Territory(11, "Norfolk and Philip Island", null, null, ["AU-NF", "AUS-NF"], ["Philip Island"]);
  static readonly PCN = new Territory(12, "Pitcairn Islands", null, null, null, null);
  static readonly BVT = new Territory(13, "Bouvet Island", null, null, null, null);
  static readonly BMU = new Territory(14, "Bermuda", null, null, null, null);
  static readonly IOT = new Territory(15, "British Indian Ocean Territory", null, null, ["DGA"], null);
  static readonly SMR = new Territory(16, "San Marino", null, null, null, null);
  static readonly GGY = new Territory(17, "Guernsey", null, null, null, null);
  static readonly AIA = new Territory(18, "Anguilla", null, null, null, null);
  static readonly MSR = new Territory(19, "Montserrat", null, null, null, null);
  static readonly JEY = new Territory(20, "Jersey", null, null, null, null);
  static readonly CXR = new Territory(21, "Christmas Island", [Alphabet.CHINESE, Alphabet.ARABIC, Alphabet.ROMAN], null, ["AU-CX", "AUS-CX"], null);
  static readonly WLF = new Territory(22, "Wallis and Futuna", null, null, null, ["Futuna"]);
  static readonly VGB = new Territory(23, "British Virgin Islands", null, null, null, ["Virgin Islands, British"]);
  static readonly LIE = new Territory(24, "Liechtenstein", null, null, null, null);
  static readonly ABW = new Territory(25, "Aruba", null, null, null, null);
  static readonly MHL = new Territory(26, "Marshall Islands", null, null, ["WAK"], null);
  static readonly ASM = new Territory(27, "American Samoa", null, null, ["US-AS", "USA-AS"], ["Samoa, American"]);
  static readonly COK = new Territory(28, "Cook islands", null, null, null, null);
  static readonly SPM = new Territory(29, "Saint Pierre and Miquelon", null, null, null, ["Miquelon"]);
  static readonly NIU = new Territory(30, "Niue", null, null, null, null);
  static readonly KNA = new Territory(31, "Saint Kitts and Nevis", null, null, null, ["Nevis"]);
  static readonly CYM = new Territory(32, "Cayman islands", null, null, null, null);
  static readonly BES = new Territory(33, "Bonaire, St Eustasuis and Saba", null, null, null, ["Saba", "St Eustasius"]);
  static readonly MDV = new Territory(34, "Maldives", [Alphabet.THAANA, Alphabet.ROMAN], null, null, null);
  static readonly SHN = new Territory(35, "Saint Helena, Ascension and Tristan da Cunha", null, null, ["TAA", "ASC"], ["Ascension", "Tristan da Cunha"]);
  static readonly MLT = new Territory(36, "Malta", null, null, null, null);
  static readonly GRD = new Territory(37, "Grenada", null, null, null, null);
  static readonly VIR = new Territory(38, "US Virgin Islands", null, null, ["US-VI", "USA-VI"], ["Virgin Islands, US"]);
  static readonly MYT = new Territory(39, "Mayotte", [Alphabet.ROMAN, Alphabet.ARABIC], null, null, null);
  static readonly SJM = new Territory(40, "Svalbard and Jan Mayen", [Alphabet.ROMAN, Alphabet.CYRILLIC], null, null, ["Jan Mayen", "Spitsbergen"]);
  static readonly VCT = new Territory(41, "Saint Vincent and the Grenadines", null, null, null, ["Grenadines"]);
  static readonly HMD = new Territory(42, "Heard Island and McDonald Islands", null, null, ["AU-HM", "AUS-HM"], ["McDonald Islands"]);
  static readonly BRB = new Territory(43, "Barbados", null, null, null, null);
  static readonly ATG = new Territory(44, "Antigua and Barbuda", null, null, null, ["Barbuda"]);
  static readonly CUW = new Territory(45, "Curacao", null, null, null, null);
  static readonly SYC = new Territory(46, "Seychelles", null, null, null, null);
  static readonly PLW = new Territory(47, "Palau", null, null, null, null);
  static readonly MNP = new Territory(48, "Northern Mariana Islands", null, null, ["US-MP", "USA-MP"], null);
  static readonly AND = new Territory(49, "Andorra", null, null, null, null);
  static readonly GUM = new Territory(50, "Guam", null, null, ["US-GU", "USA-GU"], null);
  static readonly IMN = new Territory(51, "Isle of Man", null, null, null, null);
  static readonly LCA = new Territory(52, "Saint Lucia", null, null, null, null);
  static readonly FSM = new Territory(53, "Micronesia", null, null, null, ["Federated States of Micronesia"]);
  static readonly SGP = new Territory(54, "Singapore", [Alphabet.CHINESE, Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly TON = new Territory(55, "Tonga", null, null, null, null);
  static readonly DMA = new Territory(56, "Dominica", null, null, null, null);
  static readonly BHR = new Territory(57, "Bahrain", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly KIR = new Territory(58, "Kiribati", null, null, null, null);
  static readonly TCA = new Territory(59, "Turks and Caicos Islands", null, null, null, ["Caicos Islands"]);
  static readonly STP = new Territory(60, "Sao Tome and Principe", null, null, null, ["Principe"]);
  static readonly HKG = new Territory(61, "Hong Kong", [Alphabet.CHINESE, Alphabet.ROMAN], null, ["CN-91", "CHN-91", "CN-HK", "CHN-HK"], ["Xianggang"]);
  static readonly MTQ = new Territory(62, "Martinique", null, null, null, null);
  static readonly FRO = new Territory(63, "Faroe Islands", null, null, null, null);
  static readonly GLP = new Territory(64, "Guadeloupe", null, null, null, null);
  static readonly COM = new Territory(65, "Comoros", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly MUS = new Territory(66, "Mauritius", null, null, null, null);
  static readonly REU = new Territory(67, "Reunion", null, null, null, null);
  static readonly LUX = new Territory(68, "Luxembourg", null, null, null, null);
  static readonly WSM = new Territory(69, "Samoa", null, null, null, null);
  static readonly SGS = new Territory(70, "South Georgia and the South Sandwich Islands", null, null, null, ["South Sandwich Islands"]);
  static readonly PYF = new Territory(71, "French Polynesia", null, null, null, null);
  static readonly CPV = new Territory(72, "Cape Verde", null, null, null, null);
  static readonly TTO = new Territory(73, "Trinidad and Tobago", null, null, null, ["Tobago"]);
  static readonly BRN = new Territory(74, "Brunei", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly ATF = new Territory(75, "French Southern and Antarctic Lands", null, null, null, null);
  static readonly PRI = new Territory(76, "Puerto Rico", null, null, ["US-PR", "USA-PR"], null);
  static readonly CYP = new Territory(77, "Cyprus", [Alphabet.GREEK, Alphabet.ROMAN], null, null, null);
  static readonly LBN = new Territory(78, "Lebanon", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly JAM = new Territory(79, "Jamaica", null, null, null, null);
  static readonly GMB = new Territory(80, "Gambia", null, null, null, null);
  static readonly QAT = new Territory(81, "Qatar", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly FLK = new Territory(82, "Falkland Islands", null, null, null, null);
  static readonly VUT = new Territory(83, "Vanuatu", null, null, null, null);
  static readonly MNE = new Territory(84, "Montenegro", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly BHS = new Territory(85, "Bahamas", null, null, null, null);
  static readonly TLS = new Territory(86, "East Timor", [Alphabet.ROMAN, Alphabet.ARABIC], null, null, null);
  static readonly SWZ = new Territory(87, "Swaziland", null, null, null, null);
  static readonly KWT = new Territory(88, "Kuwait", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly FJI = new Territory(89, "Fiji Islands", [Alphabet.ROMAN, Alphabet.DEVANAGARI], null, null, null);
  static readonly NCL = new Territory(90, "New Caledonia", null, null, null, null);
  static readonly SVN = new Territory(91, "Slovenia", null, null, null, null);
  static readonly ISR = new Territory(92, "Israel", [Alphabet.HEBREW, Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly PSE = new Territory(93, "Palestinian territory", [Alphabet.HEBREW, Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly SLV = new Territory(94, "El Salvador", null, null, null, null);
  static readonly BLZ = new Territory(95, "Belize", null, null, null, null);
  static readonly DJI = new Territory(96, "Djibouti", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly MKD = new Territory(97, "Macedonia", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly RWA = new Territory(98, "Rwanda", null, null, null, null);
  static readonly HTI = new Territory(99, "Haiti", null, null, null, null);
  static readonly BDI = new Territory(100, "Burundi", null, null, null, null);
  static readonly GNQ = new Territory(101, "Equatorial Guinea", null, null, null, null);
  static readonly ALB = new Territory(102, "Albania", null, null, null, null);
  static readonly SLB = new Territory(103, "Solomon Islands", null, null, null, null);
  static readonly ARM = new Territory(104, "Armenia", [Alphabet.ARMENIAN, Alphabet.ROMAN], null, null, null);
  static readonly LSO = new Territory(105, "Lesotho", null, null, null, null);
  static readonly BEL = new Territory(106, "Belgium", null, null, null, null);
  static readonly MDA = new Territory(107, "Moldova", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly GNB = new Territory(108, "Guinea-Bissau", null, null, null, null);
  static readonly TWN = new Territory(109, "Taiwan", [Alphabet.CHINESE, Alphabet.ROMAN], null, ["CN-71", "CHN-71", "CN-TW", "CHN-TW"], null);
  static readonly BTN = new Territory(110, "Bhutan", [Alphabet.TIBETAN, Alphabet.ROMAN], null, null, null);
  static readonly CHE = new Territory(111, "Switzerland", null, null, null, null);
  static readonly NLD = new Territory(112, "Netherlands", null, null, null, null);
  static readonly DNK = new Territory(113, "Denmark", null, null, null, null);
  static readonly EST = new Territory(114, "Estonia", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly DOM = new Territory(115, "Dominican Republic", null, null, null, null);
  static readonly SVK = new Territory(116, "Slovakia", null, null, null, null);
  static readonly CRI = new Territory(117, "Costa Rica", null, null, null, null);
  static readonly BIH = new Territory(118, "Bosnia and Herzegovina", [Alphabet.ROMAN, Alphabet.CYRILLIC], null, null, null);
  static readonly HRV = new Territory(119, "Croatia", [Alphabet.ROMAN, Alphabet.CYRILLIC], null, null, null);
  static readonly TGO = new Territory(120, "Togo", null, null, null, null);
  static readonly LVA = new Territory(121, "Latvia", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly LTU = new Territory(122, "Lithuania", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly LKA = new Territory(123, "Sri Lanka", [Alphabet.SINHALESE, Alphabet.TAMIL, Alphabet.ROMAN], null, null, null);
  static readonly GEO = new Territory(124, "Georgia", [Alphabet.GEORGIAN, Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly IRL = new Territory(125, "Ireland", null, null, null, null);
  static readonly SLE = new Territory(126, "Sierra Leone", null, null, null, null);
  static readonly PAN = new Territory(127, "Panama", null, null, null, null);
  static readonly CZE = new Territory(128, "Czech Republic", null, null, null, null);
  static readonly GUF = new Territory(129, "French Guiana", null, null, null, null);
  static readonly ARE = new Territory(130, "United Arab Emirates", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly AUT = new Territory(131, "Austria", null, null, null, null);
  static readonly AZE = new Territory(132, "Azerbaijan", [Alphabet.ROMAN, Alphabet.CYRILLIC, Alphabet.ARABIC], null, null, null);
  static readonly SRB = new Territory(133, "Serbia", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly JOR = new Territory(134, "Jordan", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly PRT = new Territory(135, "Portugal", null, null, null, null);
  static readonly HUN = new Territory(136, "Hungary", null, null, null, null);
  static readonly KOR = new Territory(137, "South Korea", [Alphabet.KOREAN, Alphabet.ROMAN], null, null, null);
  static readonly ISL = new Territory(138, "Iceland", null, null, null, null);
  static readonly GTM = new Territory(139, "Guatemala", null, null, null, null);
  static readonly CUB = new Territory(140, "Cuba", null, null, null, null);
  static readonly BGR = new Territory(141, "Bulgaria", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly LBR = new Territory(142, "Liberia", null, null, null, null);
  static readonly HND = new Territory(143, "Honduras", null, null, null, null);
  static readonly BEN = new Territory(144, "Benin", null, null, null, null);
  static readonly ERI = new Territory(145, "Eritrea", [Alphabet.AMHARIC, Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly MWI = new Territory(146, "Malawi", null, null, null, null);
  static readonly PRK = new Territory(147, "North Korea", [Alphabet.KOREAN, Alphabet.ROMAN], null, null, null);
  static readonly NIC = new Territory(148, "Nicaragua", null, null, null, null);
  static readonly GRC = new Territory(149, "Greece", [Alphabet.GREEK, Alphabet.ROMAN], null, null, null);
  static readonly TJK = new Territory(150, "Tajikistan", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly BGD = new Territory(151, "Bangladesh", [Alphabet.BENGALI, Alphabet.ROMAN], null, null, null);
  static readonly NPL = new Territory(152, "Nepal", [Alphabet.DEVANAGARI, Alphabet.ROMAN], null, null, null);
  static readonly TUN = new Territory(153, "Tunisia", [Alphabet.ARABIC, Alphabet.ROMAN, Alphabet.TIFINAGH], null, null, null);
  static readonly SUR = new Territory(154, "Suriname", null, null, null, null);
  static readonly URY = new Territory(155, "Uruguay", null, null, null, null);
  static readonly KHM = new Territory(156, "Cambodia", [Alphabet.KHMER, Alphabet.ROMAN], null, null, null);
  static readonly SYR = new Territory(157, "Syria", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly SEN = new Territory(158, "Senegal", null, null, null, null);
  static readonly KGZ = new Territory(159, "Kyrgyzstan", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly BLR = new Territory(160, "Belarus", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly GUY = new Territory(161, "Guyana", null, null, null, null);
  static readonly LAO = new Territory(162, "Laos", [Alphabet.LAO, Alphabet.ROMAN], null, null, null);
  static readonly ROU = new Territory(163, "Romania", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly GHA = new Territory(164, "Ghana", null, null, null, null);
  static readonly UGA = new Territory(165, "Uganda", null, null, null, null);
  static readonly GBR = new Territory(166, "United Kingdom", null, null, null, ["Scotland", "Great Britain", "Northern Ireland", "Ireland, Northern"]);
  static readonly GIN = new Territory(167, "Guinea", null, null, null, null);
  static readonly ECU = new Territory(168, "Ecuador", null, null, null, null);
  static readonly ESH = new Territory(169, "Western Sahara", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, ["Sahrawi"]);
  static readonly GAB = new Territory(170, "Gabon", null, null, null, null);
  static readonly NZL = new Territory(171, "New Zealand", null, null, null, null);
  static readonly BFA = new Territory(172, "Burkina Faso", null, null, null, null);
  static readonly PHL = new Territory(173, "Philippines", null, null, null, null);
  static readonly ITA = new Territory(174, "Italy", null, null, null, null);
  static readonly OMN = new Territory(175, "Oman", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly POL = new Territory(176, "Poland", null, null, null, null);
  static readonly CIV = new Territory(177, "Ivory Coast", null, null, null, null);
  static readonly NOR = new Territory(178, "Norway", null, null, null, null);
  static readonly MYS = new Territory(179, "Malaysia", [Alphabet.ROMAN, Alphabet.ARABIC, Alphabet.CHINESE], null, null, null);
  static readonly VNM = new Territory(180, "Vietnam", null, null, null, null);
  static readonly FIN = new Territory(181, "Finland", null, null, null, null);
  static readonly COG = new Territory(182, "Congo-Brazzaville", null, null, null, null);
  static readonly DEU = new Territory(183, "Germany", null, null, null, null);
  static readonly JPN = new Territory(184, "Japan", [Alphabet.KATAKANA, Alphabet.ROMAN], null, null, null);
  static readonly ZWE = new Territory(185, "Zimbabwe", null, null, null, null);
  static readonly PRY = new Territory(186, "Paraguay", null, null, null, null);
  static readonly IRQ = new Territory(187, "Iraq", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly MAR = new Territory(188, "Morocco", [Alphabet.ARABIC, Alphabet.ROMAN, Alphabet.TIFINAGH], null, null, null);
  static readonly UZB = new Territory(189, "Uzbekistan", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly SWE = new Territory(190, "Sweden", null, null, null, null);
  static readonly PNG = new Territory(191, "Papua New Guinea", null, null, null, null);
  static readonly CMR = new Territory(192, "Cameroon", null, null, null, null);
  static readonly TKM = new Territory(193, "Turkmenistan", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly ESP = new Territory(194, "Spain", null, null, null, null);
  static readonly THA = new Territory(195, "Thailand", [Alphabet.THAI, Alphabet.ROMAN], null, null, null);
  static readonly YEM = new Territory(196, "Yemen", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly FRA = new Territory(197, "France", null, null, null, null);
  static readonly ALA = new Territory(198, "Aaland Islands", null, null, null, null);
  static readonly KEN = new Territory(199, "Kenya", null, null, null, null);
  static readonly BWA = new Territory(200, "Botswana", null, null, null, null);
  static readonly MDG = new Territory(201, "Madagascar", null, null, null, null);
  static readonly UKR = new Territory(202, "Ukraine", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly SSD = new Territory(203, "South Sudan", [Alphabet.ROMAN, Alphabet.ARABIC], null, null, null);
  static readonly CAF = new Territory(204, "Central African Republic", null, null, null, null);
  static readonly SOM = new Territory(205, "Somalia", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly AFG = new Territory(206, "Afghanistan", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly MMR = new Territory(207, "Myanmar", [Alphabet.BURMESE, Alphabet.ROMAN], null, null, ["Burma"]);
  static readonly ZMB = new Territory(208, "Zambia", null, null, null, null);
  static readonly CHL = new Territory(209, "Chile", null, null, null, null);
  static readonly TUR = new Territory(210, "Turkey", null, null, null, null);
  static readonly PAK = new Territory(211, "Pakistan", [Alphabet.GURMUKHI, Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly MOZ = new Territory(212, "Mozambique", null, null, null, null);
  static readonly NAM = new Territory(213, "Namibia", null, null, null, null);
  static readonly VEN = new Territory(214, "Venezuela", null, null, null, null);
  static readonly NGA = new Territory(215, "Nigeria", [Alphabet.ROMAN, Alphabet.ARABIC], null, null, null);
  static readonly TZA = new Territory(216, "Tanzania", null, null, null, null);
  static readonly EGY = new Territory(217, "Egypt", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly MRT = new Territory(218, "Mauritania", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly BOL = new Territory(219, "Bolivia", null, null, null, null);
  static readonly ETH = new Territory(220, "Ethiopia", [Alphabet.ROMAN, Alphabet.AMHARIC, Alphabet.ARABIC], null, null, null);
  static readonly COL = new Territory(221, "Colombia", null, null, null, null);
  static readonly ZAF = new Territory(222, "South Africa", null, null, null, null);
  static readonly MLI = new Territory(223, "Mali", null, null, null, null);
  static readonly AGO = new Territory(224, "Angola", null, null, null, null);
  static readonly NER = new Territory(225, "Niger", null, null, null, null);
  static readonly TCD = new Territory(226, "Chad", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly PER = new Territory(227, "Peru", null, null, null, null);
  static readonly MNG = new Territory(228, "Mongolia", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly IRN = new Territory(229, "Iran", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly LBY = new Territory(230, "Libya", [Alphabet.ARABIC, Alphabet.ROMAN, Alphabet.TIFINAGH], null, null, null);
  static readonly SDN = new Territory(231, "Sudan", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly IDN = new Territory(232, "Indonesia", null, null, null, null);
  static readonly MX_DIF = new Territory(233, "Federal District", null, Territory.MEX, ["MX-DF", "MX-CMX"], null);
  static readonly MX_TLA = new Territory(234, "Tlaxcala", null, Territory.MEX, ["MX-TL"], null);
  static readonly MX_MOR = new Territory(235, "Morelos", null, Territory.MEX, ["MX-MO"], null);
  static readonly MX_AGU = new Territory(236, "Aguascalientes", null, Territory.MEX, ["MX-AG"], null);
  static readonly MX_CL = new Territory(237, "Colima", null, Territory.MEX, ["MX-COL"], null);
  static readonly MX_QUE = new Territory(238, "Queretaro", null, Territory.MEX, ["MX-QE"], null);
  static readonly MX_HID = new Territory(239, "Hidalgo", null, Territory.MEX, ["MX-HG"], null);
  static readonly MX_MX = new Territory(240, "Mexico State", null, Territory.MEX, ["MX-ME", "MX-MEX"], null);
  static readonly MX_TAB = new Territory(241, "Tabasco", null, Territory.MEX, ["MX-TB"], null);
  static readonly MX_NAY = new Territory(242, "Nayarit", null, Territory.MEX, ["MX-NA"], null);
  static readonly MX_GUA = new Territory(243, "Guanajuato", null, Territory.MEX, ["MX-GT"], null);
  static readonly MX_PUE = new Territory(244, "Puebla", null, Territory.MEX, ["MX-PB"], null);
  static readonly MX_YUC = new Territory(245, "Yucatan", null, Territory.MEX, ["MX-YU"], null);
  static readonly MX_ROO = new Territory(246, "Quintana Roo", null, Territory.MEX, ["MX-QR"], null);
  static readonly MX_SIN = new Territory(247, "Sinaloa", null, Territory.MEX, ["MX-SI"], null);
  static readonly MX_CAM = new Territory(248, "Campeche", null, Territory.MEX, ["MX-CM"], null);
  static readonly MX_MIC = new Territory(249, "Michoacan", null, Territory.MEX, ["MX-MI"], null);
  static readonly MX_SLP = new Territory(250, "San Luis Potosi", null, Territory.MEX, ["MX-SL"], null);
  static readonly MX_GRO = new Territory(251, "Guerrero", null, Territory.MEX, ["MX-GR"], null);
  static readonly MX_NLE = new Territory(252, "Nuevo Leon", null, Territory.MEX, ["MX-NL"], null);
  static readonly MX_BCN = new Territory(253, "Baja California", null, Territory.MEX, ["MX-BC"], null);
  static readonly MX_VER = new Territory(254, "Veracruz", null, Territory.MEX, ["MX-VE"], null);
  static readonly MX_CHP = new Territory(255, "Chiapas", null, Territory.MEX, ["MX-CS"], null);
  static readonly MX_BCS = new Territory(256, "Baja California Sur", null, Territory.MEX, ["MX-BS"], null);
  static readonly MX_ZAC = new Territory(257, "Zacatecas", null, Territory.MEX, ["MX-ZA"], null);
  static readonly MX_JAL = new Territory(258, "Jalisco", null, Territory.MEX, ["MX-JA"], null);
  static readonly MX_TAM = new Territory(259, "Tamaulipas", null, Territory.MEX, ["MX-TM"], null);
  static readonly MX_OAX = new Territory(260, "Oaxaca", null, Territory.MEX, ["MX-OA"], null);
  static readonly MX_DUR = new Territory(261, "Durango", null, Territory.MEX, ["MX-DG"], null);
  static readonly MX_COA = new Territory(262, "Coahuila", null, Territory.MEX, ["MX-CO"], null);
  static readonly MX_SON = new Territory(263, "Sonora", null, Territory.MEX, ["MX-SO"], null);
  static readonly MX_CHH = new Territory(264, "Chihuahua", null, Territory.MEX, ["MX-CH"], null);
  static readonly GRL = new Territory(265, "Greenland", null, null, null, null);
  static readonly SAU = new Territory(266, "Saudi Arabia", [Alphabet.ARABIC, Alphabet.ROMAN], null, null, null);
  static readonly COD = new Territory(267, "Congo-Kinshasa", null, null, null, null);
  static readonly DZA = new Territory(268, "Algeria", [Alphabet.ARABIC, Alphabet.ROMAN, Alphabet.TIFINAGH], null, null, null);
  static readonly KAZ = new Territory(269, "Kazakhstan", [Alphabet.CYRILLIC, Alphabet.ROMAN], null, null, null);
  static readonly ARG = new Territory(270, "Argentina", null, null, null, null);
  static readonly IN_DD = new Territory(271, "Daman and Diu", [Alphabet.DEVANAGARI, Alphabet.GUJARATI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_DN = new Territory(272, "Dadra and Nagar Haveli", [Alphabet.DEVANAGARI, Alphabet.GUJARATI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_CH = new Territory(273, "Chandigarh", [Alphabet.DEVANAGARI, Alphabet.ROMAN, Alphabet.GURMUKHI], Territory.IND, null, null);
  static readonly IN_AN = new Territory(274, "Andaman and Nicobar", [Alphabet.DEVANAGARI, Alphabet.ROMAN, Alphabet.BENGALI], Territory.IND, null, null);
  static readonly IN_LD = new Territory(275, "Lakshadweep", [Alphabet.MALAYALAM, Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_DL = new Territory(276, "Delhi", [Alphabet.DEVANAGARI, Alphabet.GURMUKHI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_ML = new Territory(277, "Meghalaya", [Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_NL = new Territory(278, "Nagaland", [Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_MN = new Territory(279, "Manipur", [Alphabet.BENGALI, Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_TR = new Territory(280, "Tripura", [Alphabet.BENGALI, Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_MZ = new Territory(281, "Mizoram", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_SK = new Territory(282, "Sikkim", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_PB = new Territory(283, "Punjab", [Alphabet.GURMUKHI, Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_HR = new Territory(284, "Haryana", [Alphabet.DEVANAGARI, Alphabet.GURMUKHI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_AR = new Territory(285, "Arunachal Pradesh", [Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_AS = new Territory(286, "Assam", [Alphabet.BENGALI, Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_BR = new Territory(287, "Bihar", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_UT = new Territory(288, "Uttarakhand", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, ["IN-UK"], null);
  static readonly IN_GA = new Territory(289, "Goa", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_KL = new Territory(290, "Kerala", [Alphabet.MALAYALAM, Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_TN = new Territory(291, "Tamil Nadu", [Alphabet.TAMIL, Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_HP = new Territory(292, "Himachal Pradesh", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_JK = new Territory(293, "Jammu and Kashmir", [Alphabet.DEVANAGARI, Alphabet.GURMUKHI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_CT = new Territory(294, "Chhattisgarh", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, ["IN-CG"], null);
  static readonly IN_JH = new Territory(295, "Jharkhand", [Alphabet.DEVANAGARI, Alphabet.BENGALI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_KA = new Territory(296, "Karnataka", [Alphabet.KANNADA, Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_RJ = new Territory(297, "Rajasthan", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_OR = new Territory(298, "Odisha", [Alphabet.ODIA, Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, ["IN-OD"], ["Orissa"]);
  static readonly IN_GJ = new Territory(299, "Gujarat", [Alphabet.GUJARATI, Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_WB = new Territory(300, "West Bengal", [Alphabet.BENGALI, Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_MP = new Territory(301, "Madhya Pradesh", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_TG = new Territory(302, "Telangana", [Alphabet.TELUGU, Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_AP = new Territory(303, "Andhra Pradesh", [Alphabet.TELUGU, Alphabet.ROMAN, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly IN_MH = new Territory(304, "Maharashtra", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_UP = new Territory(305, "Uttar Pradesh", [Alphabet.DEVANAGARI, Alphabet.ROMAN], Territory.IND, null, null);
  static readonly IN_PY = new Territory(306, "Puducherry", [Alphabet.MALAYALAM, Alphabet.TELUGU, Alphabet.DEVANAGARI], Territory.IND, null, null);
  static readonly AU_NSW = new Territory(307, "New South Wales", null, Territory.AUS, null, null);
  static readonly AU_ACT = new Territory(308, "Australian Capital Territory", null, Territory.AUS, null, null);
  static readonly AU_JBT = new Territory(309, "Jervis Bay Territory", null, Territory.AUS, null, null);
  static readonly AU_NT = new Territory(310, "Northern Territory", null, Territory.AUS, null, null);
  static readonly AU_SA = new Territory(311, "South Australia", null, Territory.AUS, null, null);
  static readonly AU_TAS = new Territory(312, "Tasmania", null, Territory.AUS, null, null);
  static readonly AU_VIC = new Territory(313, "Victoria", null, Territory.AUS, null, null);
  static readonly AU_WA = new Territory(314, "Western Australia", null, Territory.AUS, null, null);
  static readonly AU_QLD = new Territory(315, "Queensland", null, Territory.AUS, null, null);
  static readonly BR_DF = new Territory(316, "Distrito Federal", null, Territory.BRA, null, null);
  static readonly BR_SE = new Territory(317, "Sergipe", null, Territory.BRA, null, null);
  static readonly BR_AL = new Territory(318, "Alagoas", null, Territory.BRA, null, null);
  static readonly BR_RJ = new Territory(319, "Rio de Janeiro", null, Territory.BRA, null, null);
  static readonly BR_ES = new Territory(320, "Espirito Santo", null, Territory.BRA, null, null);
  static readonly BR_RN = new Territory(321, "Rio Grande do Norte", null, Territory.BRA, null, null);
  static readonly BR_PB = new Territory(322, "Paraiba", null, Territory.BRA, null, null);
  static readonly BR_SC = new Territory(323, "Santa Catarina", null, Territory.BRA, null, null);
  static readonly BR_PE = new Territory(324, "Pernambuco", null, Territory.BRA, null, null);
  static readonly BR_AP = new Territory(325, "Amapa", null, Territory.BRA, null, null);
  static readonly BR_CE = new Territory(326, "Ceara", null, Territory.BRA, null, null);
  static readonly BR_AC = new Territory(327, "Acre", null, Territory.BRA, null, null);
  static readonly BR_PR = new Territory(328, "Parana", null, Territory.BRA, null, null);
  static readonly BR_RR = new Territory(329, "Roraima", null, Territory.BRA, null, null);
  static readonly BR_RO = new Territory(330, "Rondonia", null, Territory.BRA, null, null);
  static readonly BR_SP = new Territory(331, "Sao Paulo", null, Territory.BRA, null, null);
  static readonly BR_PI = new Territory(332, "Piaui", null, Territory.BRA, null, null);
  static readonly BR_TO = new Territory(333, "Tocantins", null, Territory.BRA, null, null);
  static readonly BR_RS = new Territory(334, "Rio Grande do Sul", null, Territory.BRA, null, null);
  static readonly BR_MA = new Territory(335, "Maranhao", null, Territory.BRA, null, null);
  static readonly BR_GO = new Territory(336, "Goias", null, Territory.BRA, null, null);
  static readonly BR_MS = new Territory(337, "Mato Grosso do Sul", null, Territory.BRA, null, null);
  static readonly BR_BA = new Territory(338, "Bahia", null, Territory.BRA, null, null);
  static readonly BR_MG = new Territory(339, "Minas Gerais", null, Territory.BRA, null, null);
  static readonly BR_MT = new Territory(340, "Mato Grosso", null, Territory.BRA, null, null);
  static readonly BR_PA = new Territory(341, "Para", null, Territory.BRA, null, null);
  static readonly BR_AM = new Territory(342, "Amazonas", null, Territory.BRA, null, null);
  static readonly US_DC = new Territory(343, "District of Columbia", null, Territory.USA, null, null);
  static readonly US_RI = new Territory(344, "Rhode Island", null, Territory.USA, null, null);
  static readonly US_DE = new Territory(345, "Delaware", null, Territory.USA, null, null);
  static readonly US_CT = new Territory(346, "Connecticut", null, Territory.USA, null, null);
  static readonly US_NJ = new Territory(347, "New Jersey", null, Territory.USA, null, null);
  static readonly US_NH = new Territory(348, "New Hampshire", null, Territory.USA, null, null);
  static readonly US_VT = new Territory(349, "Vermont", null, Territory.USA, null, null);
  static readonly US_MA = new Territory(350, "Massachusetts", null, Territory.USA, null, null);
  static readonly US_HI = new Territory(351, "Hawaii", null, Territory.USA, ["US-MID"], null);
  static readonly US_MD = new Territory(352, "Maryland", null, Territory.USA, null, null);
  static readonly US_WV = new Territory(353, "West Virginia", null, Territory.USA, null, null);
  static readonly US_SC = new Territory(354, "South Carolina", null, Territory.USA, null, null);
  static readonly US_ME = new Territory(355, "Maine", null, Territory.USA, null, null);
  static readonly US_IN = new Territory(356, "Indiana", null, Territory.USA, null, null);
  static readonly US_KY = new Territory(357, "Kentucky", null, Territory.USA, null, null);
  static readonly US_TN = new Territory(358, "Tennessee", null, Territory.USA, null, null);
  static readonly US_VA = new Territory(359, "Virginia", null, Territory.USA, null, null);
  static readonly US_OH = new Territory(360, "Ohio", null, Territory.USA, null, null);
  static readonly US_PA = new Territory(361, "Pennsylvania", null, Territory.USA, null, null);
  static readonly US_MS = new Territory(362, "Mississippi", null, Territory.USA, null, null);
  static readonly US_LA = new Territory(363, "Louisiana", null, Territory.USA, null, null);
  static readonly US_AL = new Territory(364, "Alabama", null, Territory.USA, null, null);
  static readonly US_AR = new Territory(365, "Arkansas", null, Territory.USA, null, null);
  static readonly US_NC = new Territory(366, "North Carolina", null, Territory.USA, null, null);
  static readonly US_NY = new Territory(367, "New York", null, Territory.USA, null, null);
  static readonly US_IA = new Territory(368, "Iowa", null, Territory.USA, null, null);
  static readonly US_IL = new Territory(369, "Illinois", null, Territory.USA, null, null);
  static readonly US_GA = new Territory(370, "Georgia", null, Territory.USA, null, null);
  static readonly US_WI = new Territory(371, "Wisconsin", null, Territory.USA, null, null);
  static readonly US_FL = new Territory(372, "Florida", null, Territory.USA, null, null);
  static readonly US_MO = new Territory(373, "Missouri", null, Territory.USA, null, null);
  static readonly US_OK = new Territory(374, "Oklahoma", null, Territory.USA, null, null);
  static readonly US_ND = new Territory(375, "North Dakota", null, Territory.USA, null, null);
  static readonly US_WA = new Territory(376, "Washington", null, Territory.USA, null, null);
  static readonly US_SD = new Territory(377, "South Dakota", null, Territory.USA, null, null);
  static readonly US_NE = new Territory(378, "Nebraska", null, Territory.USA, null, null);
  static readonly US_KS = new Territory(379, "Kansas", null, Territory.USA, null, null);
  static readonly US_ID = new Territory(380, "Idaho", null, Territory.USA, null, null);
  static readonly US_UT = new Territory(381, "Utah", null, Territory.USA, null, null);
  static readonly US_MN = new Territory(382, "Minnesota", null, Territory.USA, null, null);
  static readonly US_MI = new Territory(383, "Michigan", null, Territory.USA, null, null);
  static readonly US_WY = new Territory(384, "Wyoming", null, Territory.USA, null, null);
  static readonly US_OR = new Territory(385, "Oregon", null, Territory.USA, null, null);
  static readonly US_CO = new Territory(386, "Colorado", null, Territory.USA, null, null);
  static readonly US_NV = new Territory(387, "Nevada", null, Territory.USA, null, null);
  static readonly US_AZ = new Territory(388, "Arizona", null, Territory.USA, null, null);
  static readonly US_NM = new Territory(389, "New Mexico", null, Territory.USA, null, null);
  static readonly US_MT = new Territory(390, "Montana", null, Territory.USA, null, null);
  static readonly US_CA = new Territory(391, "California", null, Territory.USA, null, null);
  static readonly US_TX = new Territory(392, "Texas", null, Territory.USA, null, null);
  static readonly US_AK = new Territory(393, "Alaska", null, Territory.USA, null, null);
  static readonly CA_BC = new Territory(394, "British Columbia", null, Territory.CAN, null, null);
  static readonly CA_AB = new Territory(395, "Alberta", null, Territory.CAN, null, null);
  static readonly CA_ON = new Territory(396, "Ontario", null, Territory.CAN, null, null);
  static readonly CA_QC = new Territory(397, "Quebec", null, Territory.CAN, null, null);
  static readonly CA_SK = new Territory(398, "Saskatchewan", null, Territory.CAN, null, null);
  static readonly CA_MB = new Territory(399, "Manitoba", null, Territory.CAN, null, null);
  static readonly CA_NL = new Territory(400, "Newfoundland", null, Territory.CAN, null, null);
  static readonly CA_NB = new Territory(401, "New Brunswick", null, Territory.CAN, null, null);
  static readonly CA_NS = new Territory(402, "Nova Scotia", null, Territory.CAN, null, null);
  static readonly CA_PE = new Territory(403, "Prince Edward Island", null, Territory.CAN, null, null);
  static readonly CA_YT = new Territory(404, "Yukon", null, Territory.CAN, null, null);
  static readonly CA_NT = new Territory(405, "Northwest Territories", null, Territory.CAN, null, null);
  static readonly CA_NU = new Territory(406, "Nunavut", null, Territory.CAN, null, null);
  static readonly RU_MOW = new Territory(412, "Moscow", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_SPE = new Territory(413, "Saint Petersburg", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KGD = new Territory(414, "Kaliningrad Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_IN = new Territory(415, "Ingushetia Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_AD = new Territory(416, "Adygea Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_SE = new Territory(417, "North Ossetia-Alania Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KB = new Territory(418, "Kabardino-Balkar Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KC = new Territory(419, "Karachay-Cherkess Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_CE = new Territory(420, "Chechen Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_CU = new Territory(421, "Chuvash Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_IVA = new Territory(422, "Ivanovo Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_LIP = new Territory(423, "Lipetsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_ORL = new Territory(424, "Oryol Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_TUL = new Territory(425, "Tula Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_BE = new Territory(426, "Belgorod Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, ["RU-BEL"], null);
  static readonly RU_VLA = new Territory(427, "Vladimir Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KRS = new Territory(428, "Kursk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KLU = new Territory(429, "Kaluga Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_TT = new Territory(430, "Tambov Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, ["RU-TAM"], null);
  static readonly RU_BRY = new Territory(431, "Bryansk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_YAR = new Territory(432, "Yaroslavl Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_RYA = new Territory(433, "Ryazan Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_AST = new Territory(434, "Astrakhan Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_MOS = new Territory(435, "Moscow Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_SMO = new Territory(436, "Smolensk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_DA = new Territory(437, "Dagestan Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_VOR = new Territory(438, "Voronezh Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_NGR = new Territory(439, "Novgorod Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_PSK = new Territory(440, "Pskov Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KOS = new Territory(441, "Kostroma Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_STA = new Territory(442, "Stavropol Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KDA = new Territory(443, "Krasnodar Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KL = new Territory(444, "Kalmykia Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_TVE = new Territory(445, "Tver Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_LEN = new Territory(446, "Leningrad Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_ROS = new Territory(447, "Rostov Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_VGG = new Territory(448, "Volgograd Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_VLG = new Territory(449, "Vologda Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_MUR = new Territory(450, "Murmansk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KR = new Territory(451, "Karelia Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_NEN = new Territory(452, "Nenets Autonomous Okrug", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KO = new Territory(453, "Komi Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_ARK = new Territory(454, "Arkhangelsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_MO = new Territory(455, "Mordovia Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_NIZ = new Territory(456, "Nizhny Novgorod Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_PNZ = new Territory(457, "Penza Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KI = new Territory(458, "Kirov Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, ["RU-KIR"], null);
  static readonly RU_ME = new Territory(459, "Mari El Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_ORE = new Territory(460, "Orenburg Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_ULY = new Territory(461, "Ulyanovsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_PM = new Territory(462, "Perm Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, ["RU-PER"], null);
  static readonly RU_BA = new Territory(463, "Bashkortostan Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_UD = new Territory(464, "Udmurt Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_TA = new Territory(465, "Tatarstan Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_SAM = new Territory(466, "Samara Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_SAR = new Territory(467, "Saratov Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_YAN = new Territory(468, "Yamalo-Nenets", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KM = new Territory(469, "Khanty-Mansi", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, ["RU-KHM"], null);
  static readonly RU_SVE = new Territory(470, "Sverdlovsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_TYU = new Territory(471, "Tyumen Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KGN = new Territory(472, "Kurgan Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_CH = new Territory(473, "Chelyabinsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, ["RU-CHE"], null);
  static readonly RU_BU = new Territory(474, "Buryatia Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_ZAB = new Territory(475, "Zabaykalsky Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_IRK = new Territory(476, "Irkutsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_NVS = new Territory(477, "Novosibirsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_TOM = new Territory(478, "Tomsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_OMS = new Territory(479, "Omsk Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KK = new Territory(480, "Khakassia Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KEM = new Territory(481, "Kemerovo Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_AL = new Territory(482, "Altai Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_ALT = new Territory(483, "Altai Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_TY = new Territory(484, "Tuva Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KYA = new Territory(485, "Krasnoyarsk Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_MAG = new Territory(486, "Magadan Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_CHU = new Territory(487, "Chukotka Okrug", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KAM = new Territory(488, "Kamchatka Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_SAK = new Territory(489, "Sakhalin Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_PO = new Territory(490, "Primorsky Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, ["RU-PRI"], null);
  static readonly RU_YEV = new Territory(491, "Jewish Autonomous Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_KHA = new Territory(492, "Khabarovsk Krai", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_AMU = new Territory(493, "Amur Oblast", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, null);
  static readonly RU_SA = new Territory(494, "Sakha Republic", [Alphabet.CYRILLIC, Alphabet.ROMAN], Territory.RUS, null, ["Yakutia Republic"]);
  static readonly CN_SH = new Territory(497, "Shanghai", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-31"], null);
  static readonly CN_TJ = new Territory(498, "Tianjin", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-12"], null);
  static readonly CN_BJ = new Territory(499, "Beijing", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-11"], null);
  static readonly CN_HI = new Territory(500, "Hainan", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-46"], null);
  static readonly CN_NX = new Territory(501, "Ningxia Hui", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-64"], null);
  static readonly CN_CQ = new Territory(502, "Chongqing", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-50"], null);
  static readonly CN_ZJ = new Territory(503, "Zhejiang", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-33"], null);
  static readonly CN_JS = new Territory(504, "Jiangsu", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-32"], null);
  static readonly CN_FJ = new Territory(505, "Fujian", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-35"], null);
  static readonly CN_AH = new Territory(506, "Anhui", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-34"], null);
  static readonly CN_LN = new Territory(507, "Liaoning", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-21"], null);
  static readonly CN_SD = new Territory(508, "Shandong", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-37"], null);
  static readonly CN_SX = new Territory(509, "Shanxi", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-14"], null);
  static readonly CN_JX = new Territory(510, "Jiangxi", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-36"], null);
  static readonly CN_HA = new Territory(511, "Henan", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-41"], null);
  static readonly CN_GZ = new Territory(512, "Guizhou", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-52"], null);
  static readonly CN_GD = new Territory(513, "Guangdong", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-44"], null);
  static readonly CN_HB = new Territory(514, "Hubei", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-42"], null);
  static readonly CN_JL = new Territory(515, "Jilin", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-22"], null);
  static readonly CN_HE = new Territory(516, "Hebei", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-13"], null);
  static readonly CN_SN = new Territory(517, "Shaanxi", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-61"], null);
  static readonly CN_NM = new Territory(518, "Nei Mongol", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-15"], ["Inner Mongolia"]);
  static readonly CN_HL = new Territory(519, "Heilongjiang", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-23"], null);
  static readonly CN_HN = new Territory(520, "Hunan", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-43"], null);
  static readonly CN_GX = new Territory(521, "Guangxi Zhuang", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-45"], null);
  static readonly CN_SC = new Territory(522, "Sichuan", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-51"], null);
  static readonly CN_YN = new Territory(523, "Yunnan", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-53"], null);
  static readonly CN_XZ = new Territory(524, "Xizang", [Alphabet.TIBETAN, Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-54"], ["Tibet"]);
  static readonly CN_GS = new Territory(525, "Gansu", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-62"], null);
  static readonly CN_QH = new Territory(526, "Qinghai", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-63"], null);
  static readonly CN_XJ = new Territory(527, "Xinjiang Uyghur", [Alphabet.CHINESE, Alphabet.ROMAN], Territory.CHN, ["CN-65"], null);
  static readonly UMI = new Territory(529, "United States Minor Outlying Islands", null, null, ["US-UM", "USA-UM", "JTN"], null);
  static readonly CPT = new Territory(530, "Clipperton Island", null, null, null, null);
  static readonly AAA = new Territory(532, "International", null, null, null, ["Worldwide", "Earth"]);

  private static readonly ALL: Territory[] = [
    Territory.USA, Territory.IND, Territory.CAN, Territory.AUS, Territory.MEX, Territory.BRA, Territory.RUS,
    Territory.CHN, Territory.ATA, Territory.VAT, Territory.MCO, Territory.GIB, Territory.TKL, Territory.CCK,
    Territory.BLM, Territory.NRU, Territory.TUV, Territory.MAC, Territory.SXM, Territory.MAF, Territory.NFK,
    Territory.PCN, Territory.BVT, Territory.BMU, Territory.IOT, Territory.SMR, Territory.GGY, Territory.AIA,
    Territory.MSR, Territory.JEY, Territory.CXR, Territory.WLF, Territory.VGB, Territory.LIE, Territory.ABW,
    Territory.MHL, Territory.ASM, Territory.COK, Territory.SPM, Territory.NIU, Territory.KNA, Territory.CYM,
    Territory.BES, Territory.MDV, Territory.SHN, Territory.MLT, Territory.GRD, Territory.VIR, Territory.MYT,
    Territory.SJM, Territory.VCT, Territory.HMD, Territory.BRB, Territory.ATG, Territory.CUW, Territory.SYC,
    Territory.PLW, Territory.MNP, Territory.AND, Territory.GUM, Territory.IMN, Territory.LCA, Territory.FSM,
    Territory.SGP, Territory.TON, Territory.DMA, Territory.BHR, Territory.KIR, Territory.TCA, Territory.STP,
    Territory.HKG, Territory.MTQ, Territory.FRO, Territory.GLP, Territory.COM, Territory.MUS, Territory.REU,
    Territory.LUX, Territory.WSM, Territory.SGS, Territory.PYF, Territory.CPV, Territory.TTO, Territory.BRN,
    Territory.ATF, Territory.PRI, Territory.CYP, Territory.LBN, Territory.JAM, Territory.GMB, Territory.QAT,
    Territory.FLK, Territory.VUT, Territory.MNE, Territory.BHS, Territory.TLS, Territory.SWZ, Territory.KWT,
    Territory.FJI, Territory.NCL, Territory.SVN, Territory.ISR, Territory.PSE, Territory.SLV, Territory.BLZ,
    Territory.DJI, Territory.MKD, Territory.RWA, Territory.HTI, Territory.BDI, Territory.GNQ, Territory.ALB,
    Territory.SLB, Territory.ARM, Territory.LSO, Territory.BEL, Territory.MDA, Territory.GNB, Territory.TWN,
    Territory.BTN, Territory.CHE, Territory.NLD, Territory.DNK, Territory.EST, Territory.DOM, Territory.SVK,
    Territory.CRI, Territory.BIH, Territory.HRV, Territory.TGO, Territory.LVA, Territory.LTU, Territory.LKA,
    Territory.GEO, Territory.IRL, Territory.SLE, Territory.PAN, Territory.CZE, Territory.GUF, Territory.ARE,
    Territory.AUT, Territory.AZE, Territory.SRB, Territory.JOR, Territory.PRT, Territory.HUN, Territory.KOR,
    Territory.ISL, Territory.GTM, Territory.CUB, Territory.BGR, Territory.LBR, Territory.HND, Territory.BEN,
    Territory.ERI, Territory.MWI, Territory.PRK, Territory.NIC, Territory.GRC, Territory.TJK, Territory.BGD,
    Territory.NPL, Territory.TUN, Territory.SUR, Territory.URY, Territory.KHM, Territory.SYR, Territory.SEN,
    Territory.KGZ, Territory.BLR, Territory.GUY, Territory.LAO, Territory.ROU, Territory.GHA, Territory.UGA,
    Territory.GBR, Territory.GIN, Territory.ECU, Territory.ESH, Territory.GAB, Territory.NZL, Territory.BFA,
    Territory.PHL, Territory.ITA, Territory.OMN, Territory.POL, Territory.CIV, Territory.NOR, Territory.MYS,
    Territory.VNM, Territory.FIN, Territory.COG, Territory.DEU, Territory.JPN, Territory.ZWE, Territory.PRY,
    Territory.IRQ, Territory.MAR, Territory.UZB, Territory.SWE, Territory.PNG, Territory.CMR, Territory.TKM,
    Territory.ESP, Territory.THA, Territory.YEM, Territory.FRA, Territory.ALA, Territory.KEN, Territory.BWA,
    Territory.MDG, Territory.UKR, Territory.SSD, Territory.CAF, Territory.SOM, Territory.AFG, Territory.MMR,
    Territory.ZMB, Territory.CHL, Territory.TUR, Territory.PAK, Territory.MOZ, Territory.NAM, Territory.VEN,
    Territory.NGA, Territory.TZA, Territory.EGY, Territory.MRT, Territory.BOL, Territory.ETH, Territory.COL,
    Territory.ZAF, Territory.MLI, Territory.AGO, Territory.NER, Territory.TCD, Territory.PER, Territory.MNG,
    Territory.IRN, Territory.LBY, Territory.SDN, Territory.IDN, Territory.MX_DIF, Territory.MX_TLA,
    Territory.MX_MOR, Territory.MX_AGU, Territory.MX_CL, Territory.MX_QUE, Territory.MX_HID, Territory.MX_MX,
    Territory.MX_TAB, Territory.MX_NAY, Territory.MX_GUA, Territory.MX_PUE, Territory.MX_YUC,
    Territory.MX_ROO, Territory.MX_SIN, Territory.MX_CAM, Territory.MX_MIC, Territory.MX_SLP,
    Territory.MX_GRO, Territory.MX_NLE, Territory.MX_BCN, Territory.MX_VER, Territory.MX_CHP,
    Territory.MX_BCS, Territory.MX_ZAC, Territory.MX_JAL, Territory.MX_TAM, Territory.MX_OAX,
    Territory.MX_DUR, Territory.MX_COA, Territory.MX_SON, Territory.MX_CHH, Territory.GRL, Territory.SAU,
    Territory.COD, Territory.DZA, Territory.KAZ, Territory.ARG, Territory.IN_DD, Territory.IN_DN,
    Territory.IN_CH, Territory.IN_AN, Territory.IN_LD, Territory.IN_DL, Territory.IN_ML, Territory.IN_NL,
    Territory.IN_MN, Territory.IN_TR, Territory.IN_MZ, Territory.IN_SK, Territory.IN_PB, Territory.IN_HR,
    Territory.IN_AR, Territory.IN_AS, Territory.IN_BR, Territory.IN_UT, Territory.IN_GA, Territory.IN_KL,
    Territory.IN_TN, Territory.IN_HP, Territory.IN_JK, Territory.IN_CT, Territory.IN_JH, Territory.IN_KA,
    Territory.IN_RJ, Territory.IN_OR, Territory.IN_GJ, Territory.IN_WB, Territory.IN_MP, Territory.IN_TG,
    Territory.IN_AP, Territory.IN_MH, Territory.IN_UP, Territory.IN_PY, Territory.AU_NSW, Territory.AU_ACT,
    Territory.AU_JBT, Territory.AU_NT, Territory.AU_SA, Territory.AU_TAS, Territory.AU_VIC, Territory.AU_WA,
    Territory.AU_QLD, Territory.BR_DF, Territory.BR_SE, Territory.BR_AL, Territory.BR_RJ, Territory.BR_ES,
    Territory.BR_RN, Territory.BR_PB, Territory.BR_SC, Territory.BR_PE, Territory.BR_AP, Territory.BR_CE,
    Territory.BR_AC, Territory.BR_PR, Territory.BR_RR, Territory.BR_RO, Territory.BR_SP, Territory.BR_PI,
    Territory.BR_TO, Territory.BR_RS, Territory.BR_MA, Territory.BR_GO, Territory.BR_MS, Territory.BR_BA,
    Territory.BR_MG, Territory.BR_MT, Territory.BR_PA, Territory.BR_AM, Territory.US_DC, Territory.US_RI,
    Territory.US_DE, Territory.US_CT, Territory.US_NJ, Territory.US_NH, Territory.US_VT, Territory.US_MA,
    Territory.US_HI, Territory.US_MD, Territory.US_WV, Territory.US_SC, Territory.US_ME, Territory.US_IN,
    Territory.US_KY, Territory.US_TN, Territory.US_VA, Territory.US_OH, Territory.US_PA, Territory.US_MS,
    Territory.US_LA, Territory.US_AL, Territory.US_AR, Territory.US_NC, Territory.US_NY, Territory.US_IA,
    Territory.US_IL, Territory.US_GA, Territory.US_WI, Territory.US_FL, Territory.US_MO, Territory.US_OK,
    Territory.US_ND, Territory.US_WA, Territory.US_SD, Territory.US_NE, Territory.US_KS, Territory.US_ID,
    Territory.US_UT, Territory.US_MN, Territory.US_MI, Territory.US_WY, Territory.US_OR, Territory.US_CO,
    Territory.US_NV, Territory.US_AZ, Territory.US_NM, Territory.US_MT, Territory.US_CA, Territory.US_TX,
    Territory.US_AK, Territory.CA_BC, Territory.CA_AB, Territory.CA_ON, Territory.CA_QC, Territory.CA_SK,
    Territory.CA_MB, Territory.CA_NL, Territory.CA_NB, Territory.CA_NS, Territory.CA_PE, Territory.CA_YT,
    Territory.CA_NT, Territory.CA_NU, Territory.RU_MOW, Territory.RU_SPE, Territory.RU_KGD, Territory.RU_IN,
    Territory.RU_AD, Territory.RU_SE, Territory.RU_KB, Territory.RU_KC, Territory.RU_CE, Territory.RU_CU,
    Territory.RU_IVA, Territory.RU_LIP, Territory.RU_ORL, Territory.RU_TUL, Territory.RU_BE,
    Territory.RU_VLA, Territory.RU_KRS, Territory.RU_KLU, Territory.RU_TT, Territory.RU_BRY,
    Territory.RU_YAR, Territory.RU_RYA, Territory.RU_AST, Territory.RU_MOS, Territory.RU_SMO,
    Territory.RU_DA, Territory.RU_VOR, Territory.RU_NGR, Territory.RU_PSK, Territory.RU_KOS,
    Territory.RU_STA, Territory.RU_KDA, Territory.RU_KL, Territory.RU_TVE, Territory.RU_LEN,
    Territory.RU_ROS, Territory.RU_VGG, Territory.RU_VLG, Territory.RU_MUR, Territory.RU_KR,
    Territory.RU_NEN, Territory.RU_KO, Territory.RU_ARK, Territory.RU_MO, Territory.RU_NIZ, Territory.RU_PNZ,
    Territory.RU_KI, Territory.RU_ME, Territory.RU_ORE, Territory.RU_ULY, Territory.RU_PM, Territory.RU_BA,
    Territory.RU_UD, Territory.RU_TA, Territory.RU_SAM, Territory.RU_SAR, Territory.RU_YAN, Territory.RU_KM,
    Territory.RU_SVE, Territory.RU_TYU, Territory.RU_KGN, Territory.RU_CH, Territory.RU_BU, Territory.RU_ZAB,
    Territory.RU_IRK, Territory.RU_NVS, Territory.RU_TOM, Territory.RU_OMS, Territory.RU_KK,
    Territory.RU_KEM, Territory.RU_AL, Territory.RU_ALT, Territory.RU_TY, Territory.RU_KYA, Territory.RU_MAG,
    Territory.RU_CHU, Territory.RU_KAM, Territory.RU_SAK, Territory.RU_PO, Territory.RU_YEV,
    Territory.RU_KHA, Territory.RU_AMU, Territory.RU_SA, Territory.CN_SH, Territory.CN_TJ, Territory.CN_BJ,
    Territory.CN_HI, Territory.CN_NX, Territory.CN_CQ, Territory.CN_ZJ, Territory.CN_JS, Territory.CN_FJ,
    Territory.CN_AH, Territory.CN_LN, Territory.CN_SD, Territory.CN_SX, Territory.CN_JX, Territory.CN_HA,
    Territory.CN_GZ, Territory.CN_GD, Territory.CN_HB, Territory.CN_JL, Territory.CN_HE, Territory.CN_SN,
    Territory.CN_NM, Territory.CN_HL, Territory.CN_HN, Territory.CN_GX, Territory.CN_SC, Territory.CN_YN,
    Territory.CN_XZ, Territory.CN_GS, Territory.CN_QH, Territory.CN_XJ, Territory.UMI, Territory.CPT,
    Territory.AAA,
  ];

  // ----------------------------------------------------------------------------------------------
  // Instance fields.
  // ----------------------------------------------------------------------------------------------
  private readonly number: number;
  private readonly fullName: string;
  private readonly parentTerritory: Territory | null;
  private readonly aliases: string[];
  private readonly fullNameAliases: string[];
  private readonly alphabets: Alphabet[];
  readonly name: string;
  private ordinalValue = -1;

  private constructor(
    num: number,
    fullName: string,
    alphabets: Alphabet[] | null,
    parentTerritory: Territory | null,
    aliases: string[] | null,
    fullNameAliases: string[] | null,
  ) {
    this.number = num;
    this.fullName = fullName;
    this.alphabets = alphabets === null ? [Alphabet.ROMAN] : alphabets;
    this.parentTerritory = parentTerritory;
    this.aliases = aliases === null ? [] : aliases;
    this.fullNameAliases = fullNameAliases === null ? [] : fullNameAliases;
    // name and ordinal are filled in by the static initializer wiring below.
    this.name = "";
  }

  // ----------------------------------------------------------------------------------------------
  // Public instance methods.
  // ----------------------------------------------------------------------------------------------

  /** Numeric territory code (package-private in Java, exposed for the port). */
  getNumber(): number {
    return this.number;
  }

  getFullName(): string {
    return this.fullName;
  }

  getAliases(): string[] {
    return this.aliases;
  }

  getParentTerritory(): Territory | null {
    return this.parentTerritory;
  }

  getFullNameAliases(): string[] {
    return this.fullNameAliases;
  }

  getAlphabets(): Alphabet[] {
    return this.alphabets;
  }

  isSubdivision(): boolean {
    return this.parentTerritory !== null;
  }

  hasSubdivisions(): boolean {
    return Territory.PARENT_LIST.includes(this);
  }

  ordinal(): number {
    return this.ordinalValue;
  }

  toString(alphabet?: Alphabet | null): string {
    return this.toAlphaCode(AlphaCodeFormat.INTERNATIONAL, alphabet ?? null);
  }

  toAlphaCode(format: AlphaCodeFormat, alphabet?: Alphabet | null): string {
    checkNonnull("format", format);
    let result = this.name.replace(/_/g, "-");
    if (format !== AlphaCodeFormat.INTERNATIONAL) {
      const index = this.name.lastIndexOf("_");
      if (index !== -1) {
        const shortName = this.name.substring(index + 1);
        const list = Territory.NAME_MAP.get(shortName);
        if (format === AlphaCodeFormat.MINIMAL || (list !== undefined && list.length === 1)) {
          result = shortName;
        }
      }
    }
    const alpha = alphabet ?? null;
    if (alpha !== null) {
      try {
        result = convertStringToAlphabet(result, alpha);
      } catch {
        // Simply return result if translation to alphabet fails.
      }
    }
    return result;
  }

  // ----------------------------------------------------------------------------------------------
  // Static lookup data structures (mirror the Java static initializers).
  // ----------------------------------------------------------------------------------------------
  static readonly PARENT_TERRITORIES: Set<Territory> = new Set();

  private static readonly MAP_ISO3_TO_ISO2 = new Map<string, string>();
  private static readonly MAP_ISO2_TO_ISO3 = new Map<string, string>();
  private static readonly COUNTRY_ISO2_CODES = new Set<string>();
  private static readonly COUNTRY_ISO3_CODES = new Set<string>();
  private static readonly CODE_LIST: (Territory | null)[] = [];
  private static readonly NAME_MAP = new Map<string, Territory[]>();
  private static readonly PARENT_LIST: Territory[] = [];

  // ----------------------------------------------------------------------------------------------
  // Static methods.
  // ----------------------------------------------------------------------------------------------

  static values(): Territory[] {
    return Territory.ALL.slice();
  }

  static fromNumber(num: number): Territory {
    if (num < 0 || num >= Territory.CODE_LIST.length) {
      throw new UnknownTerritoryError(num);
    }
    const t = Territory.CODE_LIST[num];
    if (t === null) {
      throw new UnknownTerritoryError(num);
    }
    return t;
  }

  static fromString(alphaCode: string, parentTerritory?: Territory): Territory {
    checkNonnull("alphaCode", alphaCode);
    if (parentTerritory !== undefined) {
      checkNonnull("parentTerritory", parentTerritory);
      if (!Territory.PARENT_TERRITORIES.has(parentTerritory)) {
        throw new IllegalArgumentError("Parameter " + parentTerritory.toString() + " is not a parent territory");
      }
      return Territory.createFromString(alphaCode, parentTerritory);
    }
    return Territory.createFromString(alphaCode, null);
  }

  static fromCountryISO2(countryISO2: string): Territory {
    return Territory.fromString(Territory.getCountryISO3FromISO2(countryISO2));
  }

  static fromCountryISO3(countryISO3: string): Territory {
    if (!Territory.MAP_ISO3_TO_ISO2.has(countryISO3.toUpperCase())) {
      throw new IllegalArgumentError(
        "Parameter " + countryISO3 + " must be a valid ISO 3166 country code, 3 characters",
      );
    }
    return Territory.fromString(countryISO3);
  }

  static fromCountryISO(countryISO: string): Territory {
    try {
      return Territory.fromCountryISO2(countryISO);
    } catch (ignored) {
      if (ignored instanceof IllegalArgumentError) {
        return Territory.fromCountryISO3(countryISO);
      }
      throw ignored;
    }
  }

  static getCountryISO2FromISO3(countryISO3: string): string {
    const countryISO2 = Territory.MAP_ISO3_TO_ISO2.get(countryISO3.toUpperCase());
    if (countryISO2 === undefined) {
      throw new IllegalArgumentError(
        "Parameter " + countryISO3 + " must be a valid ISO 3166 country code, 3 characters",
      );
    }
    return countryISO2;
  }

  static getCountryISO3FromISO2(countryISO2: string): string {
    // Clipperton Island not recognized by Java - treat separately.
    if (countryISO2.toUpperCase() === "CP") {
      return "CPT";
    }
    const countryISO3 = Territory.MAP_ISO2_TO_ISO3.get(countryISO2.toUpperCase());
    if (countryISO3 === undefined) {
      throw new IllegalArgumentError(
        "Parameter " + countryISO2 + " must be a valid ISO 3166 country code, 2 characters",
      );
    }
    return countryISO3;
  }

  static allCountryISO2Codes(): Set<string> {
    return Territory.COUNTRY_ISO2_CODES;
  }

  static allCountryISO3Codes(): Set<string> {
    return Territory.COUNTRY_ISO3_CODES;
  }

  private static createFromString(alphaCode: string, parentTerritory: Territory | null): Territory {
    // Replace '_' with '-', but leave spaces alone (may be part of the name).
    const trimmed = convertStringToPlainAscii(alphaCode.trim().replace(/_/g, "-")).toUpperCase();

    const territories = Territory.NAME_MAP.get(trimmed);
    if (territories !== undefined) {
      if (parentTerritory === null) {
        return territories[0];
      }
      for (const territory of territories) {
        if (territory.getParentTerritory() === parentTerritory) {
          return territory;
        }
      }
    } else {
      // Check for a case such as "United States of America-IN".
      const lastSeparator = Math.max(trimmed.lastIndexOf("-"), trimmed.lastIndexOf(" "));
      if (lastSeparator >= 0) {
        const prefix = trimmed.substring(0, lastSeparator);
        const parent = Territory.createFromString(prefix, parentTerritory);
        if (Territory.PARENT_TERRITORIES.has(parent)) {
          const postfix = trimmed.substring(lastSeparator + 1);
          const child = Territory.createFromString(postfix, parentTerritory);
          if (child.parentTerritory === parent) {
            return child;
          }
        }
      }
    }
    throw new UnknownTerritoryError(trimmed);
  }

  private static addName(name: string, territory: Territory): void {
    const existing = Territory.NAME_MAP.get(name);
    if (existing !== undefined) {
      const territories = existing;
      const newTerritoryParent = territory.getParentTerritory();
      if (newTerritoryParent === null && name === territory.toString()) {
        // A primary identifier always takes priority.
        territories.length = 0;
        territories.push(territory);
        return;
      }
      if (newTerritoryParent !== null) {
        for (let i = 0; i < territories.length; i++) {
          const existingTerritoryParent = territories[i].getParentTerritory();
          if (existingTerritoryParent === null && territories[i].toString() === name) {
            // A primary identifier always takes priority.
            return;
          }
          if (
            existingTerritoryParent === null ||
            existingTerritoryParent.ordinal() > newTerritoryParent.ordinal()
          ) {
            territories.splice(i, 0, territory);
            return;
          }
        }
      }
      territories.push(territory);
    } else {
      Territory.NAME_MAP.set(name, [territory]);
    }
  }

  private static addNameWithSeperatorVariants(name: string, territory: Territory): void {
    Territory.addName(name, territory);
    // Tolerate a space character in place of a hyphen.
    if (name.includes("-")) {
      Territory.addName(name.replace(/-/g, " "), territory);
    }
  }

  private static addNameWithParentVariants(name: string, territory: Territory): void {
    Territory.addNameWithSeperatorVariants(name, territory);

    if (name.includes("-")) {
      const childTerritoryName = name.substring(name.lastIndexOf("-") + 1);

      // Tolerate a child territory specified without the parent.
      Territory.addName(childTerritoryName, territory);

      if (territory.parentTerritory !== null) {
        let nameVariant = territory.parentTerritory.toString() + "-" + childTerritoryName;
        if (nameVariant !== name) {
          Territory.addNameWithSeperatorVariants(nameVariant, territory);
        }
        for (const alias of territory.parentTerritory.aliases) {
          nameVariant = alias + "-" + childTerritoryName;
          if (nameVariant !== name) {
            Territory.addNameWithSeperatorVariants(nameVariant, territory);
          }
        }
      }
    }
  }

  private static readonly _STATIC_INIT = Territory.staticInit();

  private static staticInit(): boolean {
    // ISO3 <-> ISO2 maps (mirrors Java's Locale-based static block).
    for (const [iso3, iso2] of ISO3_TO_ISO2) {
      Territory.MAP_ISO3_TO_ISO2.set(iso3, iso2);
      Territory.MAP_ISO2_TO_ISO3.set(iso2, iso3);
      Territory.COUNTRY_ISO2_CODES.add(iso2);
      Territory.COUNTRY_ISO3_CODES.add(iso3);
    }

    // Wire enum-constant names (Java's name()) onto each instance.
    for (const [n, t] of Object.entries(Territory as unknown as Record<string, unknown>)) {
      if (t instanceof Territory) {
        (t as unknown as { name: string }).name = n;
      }
    }

    // Assign ordinals by declaration order (index in ALL).
    for (let i = 0; i < Territory.ALL.length; i++) {
      Territory.ALL[i].ordinalValue = i;
    }

    for (const t of [Territory.USA, Territory.IND, Territory.CAN, Territory.AUS, Territory.MEX,
      Territory.BRA, Territory.RUS, Territory.CHN, Territory.ATA]) {
      Territory.PARENT_TERRITORIES.add(t);
    }

    const errorPrefix = "Initializing error: ";
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    const territoryNumbers = new Set<number>();
    const namesSet = new Set<string>();

    for (const territory of Territory.ALL) {
      const territoryNumber = territory.getNumber();
      if (territoryNumber < 0 || territoryNumber >= Territory.ALL.length) {
        throw new Error(errorPrefix + "territory number out of range: " + territoryNumber);
      }
      if (territoryNumbers.has(territoryNumber)) {
        throw new Error(errorPrefix + "non-unique territory number: " + territoryNumber);
      }
      territoryNumbers.add(territory.getNumber());

      for (let i = Territory.CODE_LIST.length; i <= territory.number; i++) {
        Territory.CODE_LIST.push(null);
      }
      Territory.CODE_LIST[territory.number] = territory;
      if (territory.parentTerritory !== null && !Territory.PARENT_LIST.includes(territory.parentTerritory)) {
        Territory.PARENT_LIST.push(territory.parentTerritory);
      }

      if (namesSet.has(territory.toString())) {
        throw new Error(errorPrefix + "non-unique territory name: " + territory.toString());
      }
      namesSet.add(territory.toString());
      Territory.addNameWithParentVariants(territory.toString(), territory);
      for (const alias of territory.aliases) {
        if (namesSet.has(alias)) {
          throw new Error(errorPrefix + "non-unique alias: " + alias);
        }
        namesSet.add(alias);
        Territory.addNameWithParentVariants(alias, territory);
      }

      if (
        namesSet.has(territory.fullName.toUpperCase()) &&
        territory.toString() !== territory.fullName.toUpperCase()
      ) {
        throw new Error(errorPrefix + "non-unique territory fullName: " + territory.fullName.toUpperCase());
      }
      Territory.addNameWithParentVariants(territory.fullName.toUpperCase(), territory);
      for (const fullNameAlias of territory.fullNameAliases) {
        if (namesSet.has(fullNameAlias.toUpperCase())) {
          throw new Error(errorPrefix + "non-unique territory fullName alias: " + fullNameAlias.toUpperCase());
        }
        namesSet.add(fullNameAlias.toUpperCase());
        Territory.addNameWithParentVariants(fullNameAlias.toUpperCase(), territory);
      }
      min = Math.min(min, territory.number);
      max = Math.max(max, territory.number);
    }

    if (!(min === 0 && max === Territory.ALL.length - 1)) {
      throw new Error(errorPrefix + "incorrect min/max territory number: " + min + "/" + max);
    }
    return true;
  }
}
