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
