import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadComic } from "@remotion/google-fonts/ComicNeue";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadGotisch } from "@remotion/google-fonts/GrenzeGotisch";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";

export const BANGERS = loadBangers().fontFamily;
export const COMIC = loadComic("normal", { weights: ["400", "700"] }).fontFamily;

// Period faces for REAL quoted words on manuscript, book-page and letter slides (never fake text).
/** IM Fell English: an old-style book face (the 1806 to 1904 translations are printed books). */
export const FELL = loadFell("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
loadFell("italic", { weights: ["400"], subsets: ["latin"] });
/** Grenze Gotisch: a legible blackletter, for running heads and titles only. */
export const GOTHIC = loadGotisch("normal", { weights: ["600"], subsets: ["latin"] }).fontFamily;
/** Cinzel: Roman inscriptional capitals (the curse tablet). */
export const ROMAN = loadCinzel("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily;
