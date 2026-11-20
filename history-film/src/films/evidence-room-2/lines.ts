// THE EVIDENCE ROOM, PART 2: the 39 approved lines (scripts/evidence-room-2-caerleon/script.md), as data.
// `text` is the script line exactly as recorded (slash = pause).
// `screen` is what the lower-third cartouche shows, when it differs: numbers as numerals, and QUOTES set
// word for word as in the source (sources.md), which is sometimes different punctuation from the spoken line.
// " / " = a pause in the read (also a cartouche page break). " | " = a page break only (keeps <= 10 words on screen).
// L39 comes from episode.json (the Part 3 teaser will change).
import EP from "./episode.json";
import type { Who } from "../../shared/comic";

export type LineId =
  | "L01" | "L02" | "L03" | "L04" | "L05" | "L06" | "L07" | "L08" | "L09" | "L10"
  | "L11" | "L12" | "L13" | "L14" | "L15" | "L16" | "L17" | "L18" | "L19" | "L20"
  | "L21" | "L22" | "L23" | "L24" | "L25" | "L26" | "L27" | "L28" | "L29" | "L30"
  | "L31" | "L32" | "L33" | "L34" | "L35" | "L36" | "L37" | "L38" | "L39";

export type Line = { beat: number; who: Who; short: boolean; text: string; screen?: string };

export const LINE_TEXT: Record<LineId, Line> = {
  L01: { beat: 1, who: "curator", short: false, text: "Ladies and gentlemen, / the court of history is back in session." },
  L02: { beat: 1, who: "curator", short: true, text: "Today's case: a Roman ruin in Wales, / and a legend that calls it King Arthur's Round Table." },
  L03: { beat: 2, who: "dig", short: false, text: "Caerleon, in south Wales! / A Roman fortress, home of the Second Augustan Legion!" },
  L04: { beat: 2, who: "dig", short: true, text: "And outside the walls, / a huge oval arena. / Old maps label it King Arthur's Round Table!" },
  L05: { beat: 2, who: "clerk", short: false, text: "Source: Museum Wales. / The fortress was founded in A-D seventy-four or seventy-five.", screen: "Source: Museum Wales. / The fortress was founded in A-D seventy-four or seventy-five." },
  L06: {
    beat: 3,
    who: "curator",
    short: false,
    text: "The Romans are not in doubt. / Cadw says Caerleon was one of just three permanent legionary fortresses in Britain, / built to hold down a fearsome Celtic tribe.",
    screen: "The Romans are not in doubt. / Cadw says Caerleon was one of just three | permanent legionary fortresses in Britain, / built to hold down a fearsome Celtic tribe.",
  },
  L07: { beat: 3, who: "curator", short: false, text: "Museum Wales says it held over five thousand soldiers.", screen: "Museum Wales says it held over five thousand soldiers." },
  L08: { beat: 3, who: "curator", short: false, text: "The amphitheatre was begun around A-D ninety, / with room for about six thousand. / That number is an estimate.", screen: "The amphitheatre was begun around A-D ninety, / with room for about six thousand. / That number is an estimate." },
  L09: { beat: 3, who: "curator", short: true, text: "Cadw calls it / the Roman equivalent of today's multiplex cinema." },
  L10: { beat: 3, who: "doubt", short: true, text: "A cinema. / Not a throne room." },
  L11: { beat: 3, who: "clerk", short: false, text: "Noted: one museum page says A-D eighty.", screen: "Noted: one museum page says A-D eighty." },
  L12: { beat: 4, who: "curator", short: false, text: "The legend starts with a book: / The History of the Kings of Britain, / written about eleven thirty-six by Geoffrey of Monmouth.", screen: "The legend starts with a book: / The History of the Kings of Britain, / written about eleven thirty-six by Geoffrey of Monmouth." },
  L13: { beat: 4, who: "dig", short: false, text: "He says Arthur held a magnificent court / in the City of Legions! / That is Caerleon!" },
  L14: { beat: 4, who: "clerk", short: false, text: 'Cadw describes Geoffrey as / "the somewhat imaginative twelfth-century scholar."', screen: "Cadw describes Geoffrey as / “the somewhat imaginative twelfth-century scholar.”" },
  L15: { beat: 4, who: "doubt", short: false, text: "Somewhat." },
  L16: { beat: 5, who: "clerk", short: false, text: "We searched Geoffrey's book: / two translations and the Latin." },
  L17: { beat: 5, who: "clerk", short: true, text: "No Round Table. / No amphitheatre." },
  L18: { beat: 5, who: "curator", short: false, text: 'His guests sit at a table / "according as the rank of each did demand."', screen: "His guests sit at a table / “according as the rank of each did demand.”" },
  L19: { beat: 5, who: "curator", short: false, text: "The Round Table, / where nobody ranks higher, / first appears in a poem by Wace, in eleven fifty-five.", screen: "The Round Table, / where nobody ranks higher, / first appears in a poem by Wace, in eleven fifty-five." },
  L20: { beat: 5, who: "dig", short: false, text: "So Arthur's table arrives almost twenty years later!", screen: "So Arthur's table arrives almost twenty years later!" },
  L21: { beat: 5, who: "doubt", short: false, text: "A table, I can believe. / A table the size of a stadium?" },
  L22: {
    beat: 6,
    who: "curator",
    short: false,
    text: "In eleven eighty-eight, / Gerald of Wales visited the ruins at Caerleon. / He listed palaces, baths, temples and theatres. / He never mentions a Round Table.",
    screen: "In eleven eighty-eight, / Gerald of Wales visited the ruins at Caerleon. / He listed palaces, baths, temples and theatres. / He never mentions a Round Table.",
  },
  L23: {
    beat: 6,
    who: "dig",
    short: false,
    text: 'Then, in eighteen fifty-six, / the poet Tennyson stays in Caerleon, and writes in a letter: / "I sit like King Arthur in Caerleon!"',
    screen: "Then, in eighteen fifty-six, / the poet Tennyson stays in Caerleon, | and writes in a letter: / “I sit like King Arthur in Caerleon!”",
  },
  L24: { beat: 6, who: "doubt", short: false, text: "Lovely sentence. / He does not mention the amphitheatre either." },
  L25: { beat: 7, who: "curator", short: false, text: "In nineteen twenty-six, the amphitheatre was dug out / amid a blaze of publicity.", screen: "In nineteen twenty-six, the amphitheatre was dug out / amid a blaze of publicity." },
  L26: { beat: 7, who: "clerk", short: true, text: "Source: Cadw. / The Daily Mail paid for the dig, / in return for exclusive updates." },
  L27: { beat: 7, who: "doubt", short: false, text: 'Cadw says the Wheelers / "were canny enough not to dispute this romantic idea."', screen: "Cadw says the Wheelers / “were canny enough not to dispute this romantic idea.”" },
  L28: { beat: 7, who: "curator", short: true, text: 'Cadw\'s own booklet calls the Arthur story / "an appealing, though untrue, story."', screen: "Cadw's own booklet calls the Arthur story / “an appealing, though untrue, story.”" },
  L29: {
    beat: 7,
    who: "dig",
    short: false,
    text: "But the digging was real! / Cadw says Tessa Wheeler, Mortimer Wheeler's wife, did the actual excavation!",
    screen: "But the digging was real! / Cadw says Tessa Wheeler, Mortimer Wheeler's wife, | did the actual excavation!",
  },
  L30: { beat: 7, who: "dig", short: false, text: "And they found a lead curse tablet!" },
  L31: {
    beat: 7,
    who: "clerk",
    short: false,
    text: 'Cadw\'s translation: / "Lady Nemesis, I give thee a cloak and a pair of boots. / Let him who took them not redeem them, unless with his own blood."',
    screen: "Cadw's translation: / “Lady Nemesis, I give thee | a cloak and a pair of boots. / Let him who took them not redeem them, | unless with his own blood.”",
  },
  L32: { beat: 7, who: "doubt", short: false, text: "Now that is evidence." },
  L33: {
    beat: 8,
    who: "clerk",
    short: false,
    text: "Roman amphitheatre: found. / Round Table in Geoffrey: not in the text. / Amphitheatre called the Round Table: / the earliest firm label we found / is on maps from around nineteen hundred.",
    screen: "Roman amphitheatre: found. / Round Table in Geoffrey: not in the text. / Amphitheatre called the Round Table: / the earliest firm label we found / is on maps from around nineteen hundred.",
  },
  L34: { beat: 8, who: "clerk", short: false, text: "We could not find when the name began." },
  L35: { beat: 9, who: "curator", short: false, text: "The court finds: / the Romans are real. / The arena is real. / The Round Table link is unproven." },
  L36: { beat: 9, who: "curator", short: true, text: "Verdict: / unproven." },
  L37: { beat: 9, who: "dig", short: true, text: "But it is a great story!" },
  L38: { beat: 9, who: "doubt", short: true, text: "Great stories sell newspapers." },
  L39: { beat: 10, who: "curator", short: false, text: EP.teaser },
};

export const LINE_IDS = Object.keys(LINE_TEXT) as LineId[];

/** The cartouche pages for a line, with the share of the line's time each page gets (words + 0.35 s per pause). */
export const linePages = (id: LineId): { text: string; from: number; to: number }[] => {
  const src = LINE_TEXT[id].screen ?? LINE_TEXT[id].text;
  const parts: { text: string; pauseAfter: boolean }[] = [];
  src.split(" / ").forEach((seg, i, arr) =>
    seg.split(" | ").forEach((p, j, pa) => parts.push({ text: p.trim(), pauseAfter: j === pa.length - 1 && i < arr.length - 1 })),
  );
  // weight: seconds at an even pace, pauses count as time on the earlier page
  const w = parts.map((p) => p.text.split(/\s+/).length * 0.5 + (p.pauseAfter ? 0.35 : 0));
  const total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  return parts.map((p, i) => {
    const from = acc / total;
    acc += w[i];
    return { text: p.text, from, to: acc / total };
  });
};

/**
 * Pages whose words are ALREADY on the exhibit in that shot (the quote card / page / tablet): the placard keeps
 * the lead-in up instead, so the same words never show twice at once.
 */
export const ON_EXHIBIT: Partial<Record<LineId, number[]>> = {
  L09: [1],
  L14: [1],
  L18: [1],
  L23: [3],
  L27: [1],
  L28: [1],
  L31: [1, 2, 3, 4],
};
