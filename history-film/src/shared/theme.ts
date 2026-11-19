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
