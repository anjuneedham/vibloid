// Shared colours and sizes for the Past Tense history channel.
// Never hard-code colours elsewhere: import from here.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BAR_HEIGHT = 54;

export const THEME = {
  ink: "#14121A", // outlines
  night: "#07080D", // darkest background
  dusk: "#1B1A2B", // dim room walls
  paper: "#EADFC4", // old paper / sepia photo border
  card: "#FFE600", // bold card text
  white: "#FFFFFF",
  candle: "#FFB347", // warm light pools
  moon: "#9DB4FF", // cool light pools
  ghost: "#3DF2C0", // ghost / memory tint
  // Card background gradients (start, end)
  cardPurple: ["#5A00FF", "#1A0033"],
  cardTeal: ["#0B7A75", "#032B2B"],
  cardRed: ["#B3001B", "#2A0008"],
} as const;

export const SKIN_TONES = ["#F2C9A0", "#C98E5B", "#8A5A2B", "#5A3A1E", "#F7E1C6"];

/** Comic-book palette for The Evidence Room series. All comic colours live here. */
export const PAL = {
  page: "#F4E9CC",
  pageDots: "rgba(200,60,40,0.18)",
  dotsDark: "rgba(0,0,0,0.20)",
  dotsLight: "rgba(255,255,255,0.20)",
  shadow: "rgba(0,0,0,0.35)",
  caption: "#FFF3A0",
  bubble: "#FFFFFF",
  burstPale: "#FFF1B0",
  red: "#B3001B",
  redHot: "#FF5A4A",
  redDeep: "#7A0012",
  stampGreen: "#1E8A4C",
  stampGrey: "#596070",
  sunTop: "#FFD36B",
  sunBottom: "#FF9F43",
  dawnTop: "#8FC4EE",
  dawnBottom: "#FFE2B0",
  nightTop: "#2B2850",
  nightBottom: "#5A3A7A",
  tealTop: "#4CC2B2",
  tealBottom: "#0B7A75",
  labTop: "#2D3A4F",
  labBottom: "#4C617D",
  earth: "#B5612B",
  earthDark: "#7A4020",
  grass: "#7A9A4A",
  stone: "#A79F90",
  stoneDark: "#6F685C",
  seed: "#9BAA62",
  seedDark: "#5A6638",
  hair: "#3B2A1A",
  wood: "#9A6A3A",
  woodDark: "#6B4423",
  brass: "#E8B64A",
  parchment: "#E8D5A0",
  parchmentDark: "#C8AE72",
  tent: "#C84B3A",
  tentTrim: "#F4EEDD",
  steam: "#F6F6F6",
  glassTint: "rgba(190,235,255,0.55)",
  cardPaper: "#EFE6D0",
  black: "#000000",
} as const;

/** Episode 2+ long-film look: LANTERN-LIT SHADOW THEATRE. All shadow-theatre colours live here. */
export const SHADOW = {
  // the backlit paper screen, hottest to darkest
  screenHot: "#FFF2CF",
  screenWarm: "#F7C772",
  screenAmber: "#D9852E",
  screenDeep: "#7E3A12",
  screenEdge: "#241006",
  room: "#0E0703", // the dark auditorium around the screen
  // moonlit screen for night exteriors (cool paper, still lit from behind)
  nightHot: "#EEF0DE",
  nightMid: "#8FA9B4",
  nightDeep: "#2E4A5E",
  nightEdge: "#0B1520",
  cut: "#0C0705", // black card cut-outs
  cutMid: "#1C110A", // cut-outs a little further from the screen
  rim: "#FFD089", // lamp light catching a cut edge
  lampCore: "#FFF6DC",
  lampGlow: "#FFB55E",
  gelAmber: "#F0A238",
  gelTeal: "#2C8C88",
  gelRose: "#C44E6C",
  gelNight: "#26476E",
  brass: "#E3B04B",
  brassDark: "#8C6420",
  thread: "#D23A2E",
  slideGlass: "#FFF7E2",
  vellum: "#F2DFB3",
  vellumDark: "#C6A466",
  scribe: "#4A2A12",
  rubric: "#A8281E",
  gold: "#E9C25A",
  wax: "#8E1414",
  waxHi: "#E05A44",
  waxDeep: "#3E0505",
  parchment: "#F5E4BD",
  plate: "rgba(16,9,4,0.80)", // cartouche plate
  text: "#FBF0D8",
  textDim: "#E2C998",
  dust: "#FFE4AE",
  shade: "rgba(12,7,5,0.42)", // soft shadow cast on the screen
  lead: "#8E8C84", // the Nemesis curse tablet (lead sheet)
  leadDark: "#4F4D47",
  leadHi: "#C9C6BA",
  mapInk: "#3A2A1A", // Ordnance-Survey-style plan lettering
  water: "#7FA3B0",
} as const;

/** Episode 2+ Shorts look: LINOCUT two-colour print (black + one Welsh-dragon red on cream). */
export const LINO = {
  paper: "#F1E6CC",
  paperShade: "#DCCBA6",
  fibre: "#9C7F52",
  ink: "#17120F",
  red: "#C8102E",
  redDeep: "#8A0A1F",
} as const;

/** Illuminated manuscript look (style reel option). */
export const MANU = {
  vellum: "#EBD7A8",
  vellumDark: "#B99560",
  ink: "#2B1A0C",
  gold: "#D9A93A",
  goldHi: "#FFE08A",
  lapis: "#1F3F8F",
  vermilion: "#C0331E",
  verdigris: "#2F7A5E",
  night: "#0E0B12",
} as const;

/** Newspaper collage look (style reel option). */
export const NEWS = {
  desk: "#15130F",
  print: "#E8E1CF",
  printOld: "#D9CCA9",
  ink: "#1A1714",
  red: "#B3261E",
  tape: "rgba(236,226,190,0.72)",
  photo: "#8E8574",
} as const;
