import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadComic } from "@remotion/google-fonts/ComicNeue";

export const BANGERS = loadBangers().fontFamily;
export const COMIC = loadComic("normal", { weights: ["400", "700"] }).fontFamily;
