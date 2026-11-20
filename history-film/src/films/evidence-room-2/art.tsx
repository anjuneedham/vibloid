import React from "react";
import { interpolate } from "remotion";
import { BANGERS, COMIC, FELL, GOTHIC, ROMAN } from "../../shared/fonts";
import { rand } from "../../shared/Frame";
import { SHADOW } from "../../shared/theme";

// Slide art for EvidenceRoom2, drawn in code. Every slide lives in a 1000 x 680 viewBox (LanternSlide).
// RULE: any words on a page, letter or tablet are REAL words from sources.md, set in a period face, and quoted
// only where the source says them. No asemic squiggles pretending to be text.

const clampE = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Vellum ground with a ruled border. */
export const Vellum: React.FC<{ tone?: string }> = ({ tone = SHADOW.vellum }) => (
  <g>
    <rect width={1000} height={680} fill={tone} />
    <rect x={20} y={20} width={960} height={640} fill="none" stroke={SHADOW.vellumDark} strokeWidth={8} opacity={0.65} />
    <rect x={34} y={34} width={932} height={612} fill="none" stroke={SHADOW.vellumDark} strokeWidth={2} opacity={0.6} />
  </g>
);

/** HTML block inside the slide's SVG (for wrapped, real text). */
export const Html: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, children, style }) => (
  <foreignObject x={x} y={y} width={w} height={h}>
    <div style={{ width: w, height: h, display: "flex", flexDirection: "column", justifyContent: "center", ...style }}>{children}</div>
  </foreignObject>
);

const Q = ({ children }: { children: React.ReactNode }) => (
  <>
    “{children}”
  </>
);

/** A real quotation, attributed. `kicker` sits above (who says it). */
export const QuoteArt: React.FC<{ kicker: string; quote: string; cite: string; fs?: number; reveal?: number; gothicKicker?: boolean }> = ({
  kicker,
  quote,
  cite,
  fs = 62,
  reveal = 1,
  gothicKicker = false,
}) => (
  <g>
    <Vellum />
    <Html x={80} y={50} w={840} h={580}>
      <div style={{ fontFamily: gothicKicker ? GOTHIC : BANGERS, fontSize: gothicKicker ? 46 : 42, letterSpacing: gothicKicker ? 1 : 4, color: SHADOW.rubric, textAlign: "center" }}>{kicker}</div>
      <div style={{ height: 2, background: SHADOW.rubric, opacity: 0.5, margin: "10px 220px 22px" }} />
      <div style={{ fontFamily: FELL, fontStyle: "italic", fontSize: fs, lineHeight: 1.18, color: SHADOW.scribe, textAlign: "center", opacity: reveal }}>
        <Q>{quote}</Q>
      </div>
      <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 26, color: SHADOW.scribe, opacity: 0.8, textAlign: "center", marginTop: 26 }}>{cite}</div>
    </Html>
  </g>
);

/**
 * A printed book page (the translations used are printed books): running head in blackletter, the verified
 * excerpt set in IM Fell with ellipses either side, the quoted words underlined in red as they are read.
 */
export const BookPageArt: React.FC<{ head: string; quote: string; cite: string; underline?: number; fs?: number; children?: React.ReactNode }> = ({
  head,
  quote,
  cite,
  underline = 1,
  fs = 50,
  children,
}) => (
  <g>
    <Vellum tone={SHADOW.parchment} />
    {/* gutter shadow: an open book */}
    <rect x={0} y={0} width={60} height={680} fill={SHADOW.vellumDark} opacity={0.35} />
    <Html x={110} y={50} w={800} h={70}>
      <div style={{ fontFamily: GOTHIC, fontSize: 44, color: SHADOW.scribe, textAlign: "center" }}>{head}</div>
    </Html>
    <line x1={150} x2={850} y1={128} y2={128} stroke={SHADOW.scribe} strokeWidth={2} opacity={0.6} />
    <Html x={120} y={150} w={780} h={400}>
      <div style={{ fontFamily: FELL, fontSize: fs, lineHeight: 1.3, color: SHADOW.scribe, textAlign: "center" }}>
        …{" "}
        <span
          style={{
            backgroundImage: `linear-gradient(${SHADOW.rubric}, ${SHADOW.rubric})`,
            backgroundSize: `${underline * 100}% 4px`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 92%",
          }}
        >
          {quote}
        </span>{" "}
        …
      </div>
    </Html>
    <Html x={100} y={560} w={800} h={70}>
      <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 26, color: SHADOW.scribe, opacity: 0.8, textAlign: "center" }}>{cite}</div>
    </Html>
    {children}
  </g>
);

/** Two sources side by side: the contradiction, shown not hidden. */
export const CompareArt: React.FC<{
  left: { head: string; body: React.ReactNode; cite: string };
  right: { head: string; body: React.ReactNode; cite: string };
  rightIn?: number;
  stamp?: string;
  stampIn?: number;
}> = ({ left, right, rightIn = 1, stamp, stampIn = 0 }) => {
  const col = (c: typeof left, x: number, o: number) => (
    <Html x={x} y={60} w={420} h={560} style={{ justifyContent: "flex-start", opacity: o }}>
      <div style={{ fontFamily: BANGERS, fontSize: 44, letterSpacing: 3, color: SHADOW.rubric, textAlign: "center" }}>{c.head}</div>
      <div style={{ height: 2, background: SHADOW.rubric, opacity: 0.5, margin: "8px 60px 18px" }} />
      <div style={{ fontFamily: FELL, fontSize: 38, lineHeight: 1.22, color: SHADOW.scribe, textAlign: "center" }}>{c.body}</div>
      <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 23, color: SHADOW.scribe, opacity: 0.8, textAlign: "center", marginTop: 18 }}>{c.cite}</div>
    </Html>
  );
  const ss = interpolate(stampIn, [0, 0.4, 1], [2.2, 0.92, 1], clampE);
  return (
    <g>
      <Vellum />
      <line x1={500} x2={500} y1={70} y2={610} stroke={SHADOW.vellumDark} strokeWidth={4} />
      <text x={500} y={350} textAnchor="middle" fontFamily={BANGERS} fontSize={54} fill={SHADOW.rubric} stroke={SHADOW.vellum} strokeWidth={14} paintOrder="stroke">
        VS
      </text>
      {col(left, 50, 1)}
      {col(right, 530, rightIn)}
      {stamp && stampIn > 0 ? (
        <g transform={`translate(740 520) rotate(-9) scale(${ss})`} opacity={Math.min(1, stampIn * 3)}>
          <rect x={-200} y={-46} width={400} height={92} fill="none" stroke={SHADOW.rubric} strokeWidth={8} />
          <text y={20} textAnchor="middle" fontFamily={BANGERS} fontSize={58} letterSpacing={3} fill={SHADOW.rubric}>
            {stamp}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** Ordnance-Survey-style plan: the Usk, the fortress, and the oval outside its walls with the map's own label. */
export const MapArt: React.FC<{ label?: number; pulse?: number }> = ({ label = 1, pulse = 0 }) => (
  <g>
    <rect width={1000} height={680} fill={SHADOW.parchment} />
    {/* grid */}
    {Array.from({ length: 11 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 100} x2={i * 100} y1={0} y2={680} stroke={SHADOW.vellumDark} strokeWidth={1} opacity={0.35} />
    ))}
    {Array.from({ length: 7 }).map((_, i) => (
      <line key={`h${i}`} x1={0} x2={1000} y1={i * 100} y2={i * 100} stroke={SHADOW.vellumDark} strokeWidth={1} opacity={0.35} />
    ))}
    {/* the River Usk */}
    <path d="M-20 600 Q 200 520 330 600 T 640 610 Q 820 590 1020 660" fill="none" stroke={SHADOW.water} strokeWidth={34} opacity={0.9} />
    <text x={150} y={640} fontFamily={FELL} fontStyle="italic" fontSize={34} fill={SHADOW.mapInk}>
      River Usk
    </text>
    {/* the fortress: a rounded rectangle, its walls hatched */}
    <rect x={110} y={90} width={420} height={330} rx={40} fill="none" stroke={SHADOW.mapInk} strokeWidth={8} strokeDasharray="22 8" transform="rotate(-8 320 255)" />
    <text x={320} y={270} textAnchor="middle" fontFamily={FELL} fontSize={36} letterSpacing={4} fill={SHADOW.mapInk} transform="rotate(-8 320 255)">
      CAERLEON
    </text>
    {/* the amphitheatre, outside the walls */}
    <ellipse cx={700} cy={360} rx={150} ry={112} fill="none" stroke={SHADOW.mapInk} strokeWidth={22} opacity={0.35} />
    <ellipse cx={700} cy={360} rx={150} ry={112} fill="none" stroke={SHADOW.mapInk} strokeWidth={6} />
    <ellipse cx={700} cy={360} rx={110} ry={76} fill="none" stroke={SHADOW.mapInk} strokeWidth={3} />
    <ellipse cx={700} cy={360} rx={175 + pulse * 30} ry={135 + pulse * 22} fill="none" stroke={SHADOW.rubric} strokeWidth={6} opacity={(1 - pulse) * label} />
    <g opacity={label}>
      <text x={700} y={185} textAnchor="middle" fontFamily={FELL} fontStyle="italic" fontSize={44} fill={SHADOW.mapInk}>
        King Arthur’s Round Table
      </text>
      <text x={700} y={372} textAnchor="middle" fontFamily={FELL} fontSize={30} letterSpacing={6} fill={SHADOW.mapInk}>
        AMPHITHEATRE
      </text>
    </g>
  </g>
);

/** A legionary silhouette (helmet crest, shield, spear), for the troop count. */
const Legionary: React.FC<{ x: number; y: number; s: number; fill: string }> = ({ x, y, s, fill }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
    <ellipse cx={0} cy={-58} rx={11} ry={10} />
    <path d="M-12 -64 Q 0 -80 12 -64 Z" />
    <rect x={-2} y={-82} width={4} height={12} />
    <path d="M-14 -46 L14 -46 L18 -6 L-18 -6 Z" />
    <rect x={-10} y={-6} width={6} height={22} />
    <rect x={4} y={-6} width={6} height={22} />
    <rect x={-30} y={-48} width={18} height={40} rx={4} />
    <rect x={18} y={-96} width={3} height={110} />
  </g>
);

export const StatArt: React.FC<{ n: number }> = ({ n }) => (
  <g>
    <Vellum />
    {Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 16 }).map((_, c) => {
        const i = r * 16 + c;
        return i < n ? <Legionary key={i} x={95 + c * 54 + (r % 2) * 20} y={300 + r * 66} s={0.62} fill={SHADOW.scribe} /> : null;
      }),
    )}
    <text x={500} y={150} textAnchor="middle" fontFamily={BANGERS} fontSize={120} letterSpacing={4} fill={SHADOW.rubric}>
      OVER 5,000
    </text>
    <text x={500} y={210} textAnchor="middle" fontFamily={BANGERS} fontSize={50} letterSpacing={8} fill={SHADOW.scribe}>
      SOLDIERS
    </text>
    <text x={500} y={640} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={26} fill={SHADOW.scribe} opacity={0.8}>
      Museum Wales, National Roman Legion Museum info sheet
    </text>
  </g>
);

/** Three editions searched, each with its zero count. */
export const SearchArt: React.FC<{ k: number }> = ({ k }) => {
  const books = [
    { t: "Giles", s: "English trans., 1848" },
    { t: "Evans", s: "English trans., 1904" },
    { t: "Giles", s: "Latin edition, 1844" },
  ];
  return (
    <g>
      <Vellum />
      <text x={500} y={110} textAnchor="middle" fontFamily={GOTHIC} fontSize={56} fill={SHADOW.scribe}>
        History of the Kings of Britain
      </text>
      {books.map((b, i) => {
        const o = interpolate(k, [i * 0.22, i * 0.22 + 0.15], [0, 1], clampE);
        const x = 110 + i * 280;
        return (
          <g key={i} opacity={o} transform={`translate(0 ${(1 - o) * 20})`}>
            <rect x={x} y={160} width={220} height={300} rx={8} fill={[SHADOW.rubric, SHADOW.scribe, SHADOW.brassDark][i]} />
            <rect x={x + 16} y={176} width={188} height={268} rx={4} fill="none" stroke={SHADOW.gold} strokeWidth={3} />
            <text x={x + 110} y={300} textAnchor="middle" fontFamily={GOTHIC} fontSize={52} fill={SHADOW.gold}>
              {b.t}
            </text>
            <text x={x + 110} y={500} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={25} fill={SHADOW.scribe}>
              {b.s}
            </text>
            <text x={x + 110} y={560} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={24} fill={SHADOW.rubric}>
              “round table”: 0
            </text>
            <text x={x + 110} y={596} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={24} fill={SHADOW.rubric}>
              “amphitheatre”: 0
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** Geoffrey's banquet: one long table set by rank (the high seat at the head), with the verified Evans words. */
export const BanquetArt: React.FC<{ underline: number }> = ({ underline }) => (
  <BookPageArt head="Book IX, chapter XIII" quote="when all were set at table according as the rank of each did demand" cite="Geoffrey of Monmouth, trans. Sebastian Evans (1904)" underline={underline} fs={44}>
    <g transform="translate(500 500)">
      <rect x={-300} y={-22} width={600} height={44} fill={SHADOW.scribe} opacity={0.85} />
      {/* the high seat at the head, then smaller seats down the sides */}
      <rect x={-352} y={-46} width={40} height={92} fill={SHADOW.rubric} />
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i}>
          <rect x={-270 + i * 82} y={-50 + i * 1.5} width={30 - i * 2} height={22 - i * 1.5} fill={SHADOW.scribe} opacity={0.75} />
          <rect x={-270 + i * 82} y={28} width={30 - i * 2} height={22 - i * 1.5} fill={SHADOW.scribe} opacity={0.75} />
        </g>
      ))}
    </g>
  </BookPageArt>
);

/** 1136 versus 1155: Geoffrey's table of rank, then Wace's Round Table (no head of the table). */
export const TimelineArt: React.FC<{ k: number }> = ({ k }) => {
  const a = interpolate(k, [0, 0.2], [0, 1], clampE);
  const b = interpolate(k, [0.35, 0.6], [0, 1], clampE);
  const arrow = interpolate(k, [0.2, 0.45], [0, 1], clampE);
  return (
    <g>
      <Vellum />
      <line x1={120} x2={120 + 760 * arrow} y1={150} y2={150} stroke={SHADOW.scribe} strokeWidth={6} />
      <g opacity={a}>
        <circle cx={250} cy={150} r={16} fill={SHADOW.scribe} />
        <text x={250} y={110} textAnchor="middle" fontFamily={BANGERS} fontSize={60} fill={SHADOW.scribe}>
          c. 1136
        </text>
        <text x={250} y={230} textAnchor="middle" fontFamily={GOTHIC} fontSize={44} fill={SHADOW.scribe}>
          Geoffrey
        </text>
        <g transform="translate(250 380)">
          <rect x={-150} y={-20} width={300} height={40} fill={SHADOW.scribe} />
          <rect x={-182} y={-40} width={26} height={80} fill={SHADOW.rubric} />
        </g>
        <text x={250} y={490} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={30} fill={SHADOW.scribe}>
          a table, set by rank
        </text>
      </g>
      <g opacity={b}>
        <circle cx={750} cy={150} r={16} fill={SHADOW.rubric} />
        <text x={750} y={110} textAnchor="middle" fontFamily={BANGERS} fontSize={60} fill={SHADOW.rubric}>
          1155
        </text>
        <text x={750} y={230} textAnchor="middle" fontFamily={GOTHIC} fontSize={44} fill={SHADOW.rubric}>
          Wace
        </text>
        <g transform="translate(750 380)">
          <ellipse rx={110} ry={44} fill={SHADOW.rubric} />
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={i} cx={Math.cos((i / 10) * Math.PI * 2) * 140} cy={Math.sin((i / 10) * Math.PI * 2) * 66} r={13} fill={SHADOW.scribe} />
          ))}
        </g>
        <text x={750} y={490} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={30} fill={SHADOW.rubric}>
          the Round Table: no head seat
        </text>
      </g>
      <text x={500} y={600} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={24} fill={SHADOW.scribe} opacity={0.8}>
        Wace, Roman de Brut (1155): first known Round Table (Camelot Project; Kibler)
      </text>
    </g>
  );
};

/** The lead curse tablet with Cadw's English translation scratched in Roman capitals (NOT the Latin original). */
export const TabletArt: React.FC<{ k: number }> = ({ k }) => {
  const words = "LADY NEMESIS, I GIVE THEE A CLOAK AND A PAIR OF BOOTS; LET HIM WHO TOOK THEM NOT REDEEM THEM (UNLESS) WITH HIS OWN BLOOD.".split(" ");
  const shown = Math.floor(interpolate(k, [0, 0.95], [0, words.length], clampE));
  return (
    <g>
      <rect width={1000} height={680} fill={SHADOW.screenDeep} />
      <path d="M90 90 L880 70 L930 160 L910 590 L130 620 L70 520 Z" fill={SHADOW.lead} />
      <path d="M90 90 L880 70 L930 160 L910 590 L130 620 L70 520 Z" fill="none" stroke={SHADOW.leadDark} strokeWidth={10} />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={120 + rand(i) * 760} cy={110 + rand(i + 50) * 480} r={3 + rand(i + 90) * 10} fill={SHADOW.leadDark} opacity={0.35} />
      ))}
      <Html x={150} y={120} w={720} h={430}>
        <div style={{ fontFamily: ROMAN, fontSize: 40, lineHeight: 1.32, letterSpacing: 2, color: SHADOW.leadDark, textAlign: "center", textShadow: `1px 1px 0 ${SHADOW.leadHi}` }}>
          {words.map((w, i) => (
            <span key={i} style={{ opacity: i < shown ? 1 : 0.08 }}>
              {w}{" "}
            </span>
          ))}
        </div>
      </Html>
      <text x={500} y={660} textAnchor="middle" fontFamily={COMIC} fontWeight={700} fontSize={24} fill={SHADOW.text}>
        Cadw’s translation, Trailblazers booklet, p. 25 (shown in English, not the original lettering)
      </text>
    </g>
  );
};

/** A plain index card of the source (for the newspaper beat): who, what, where. */
export const CardArt: React.FC<{ head: string; lines: React.ReactNode; cite: string }> = ({ head, lines, cite }) => (
  <g>
    <Vellum />
    <Html x={80} y={50} w={840} h={580}>
      <div style={{ fontFamily: BANGERS, fontSize: 64, letterSpacing: 4, color: SHADOW.rubric, textAlign: "center" }}>{head}</div>
      <div style={{ height: 2, background: SHADOW.rubric, opacity: 0.5, margin: "10px 200px 22px" }} />
      <div style={{ fontFamily: FELL, fontSize: 50, lineHeight: 1.25, color: SHADOW.scribe, textAlign: "center" }}>{lines}</div>
      <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 26, color: SHADOW.scribe, opacity: 0.8, textAlign: "center", marginTop: 24 }}>{cite}</div>
    </Html>
  </g>
);

// ------------------------------------------------------------------ SILHOUETTES (mask content: white = card)
// Simple cartoon figures, never portraits: potato heads, bell robes. Geoffrey, Gerald, Tennyson and the Wheelers
// appear ONLY as these anonymous cut-outs, named by caption.

/** A seated writer at a sloped desk with a candle. `t` drives the writing arm. */
export const ScholarSil: React.FC<{ x: number; y: number; s?: number; t: number; hat?: "hood" | "brim" }> = ({ x, y, s = 1, t, hat = "hood" }) => {
  const arm = Math.sin(t / 5) * 6;
  const nod = Math.sin(t / 37) * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* stool + robe */}
      <rect x={-60} y={-90} width={18} height={90} fill="white" />
      <rect x={30} y={-90} width={18} height={90} fill="white" />
      <path d="M-110 -80 Q -120 -230 -40 -300 Q 30 -320 70 -270 Q 100 -190 90 -80 Z" fill="white" />
      {/* head (potato) */}
      <g transform={`rotate(${nod} 0 -320)`}>
        <ellipse cx={-6} cy={-350} rx={62} ry={50} fill="white" />
        {hat === "hood" ? <path d="M-74 -340 Q -80 -420 -10 -424 Q 60 -420 62 -350 Q 30 -400 -20 -398 Q -60 -394 -74 -340 Z" fill="white" /> : null}
        {hat === "brim" ? (
          <>
            <ellipse cx={-6} cy={-392} rx={110} ry={16} fill="white" />
            <path d="M-56 -392 Q -54 -450 -6 -452 Q 44 -450 46 -392 Z" fill="white" />
          </>
        ) : null}
        <path d="M54 -350 L 70 -340 L 54 -334 Z" fill="white" />
      </g>
      {/* writing arm + quill */}
      <g transform={`translate(40 -240) rotate(${-30 + arm})`}>
        <rect x={0} y={-10} width={130} height={22} rx={10} fill="white" />
        <path d="M120 -6 L 190 -70 L 196 -64 L 130 4 Z" fill="white" />
      </g>
      {/* desk with a book */}
      <path d="M120 -170 L 330 -210 L 340 -186 L 130 -146 Z" fill="white" />
      <rect x={220} y={-186} width={20} height={186} fill="white" />
      <path d="M150 -180 L 320 -212 L 322 -222 L 236 -206 L 150 -192 Z" fill="white" />
      {/* candle with a cut-out flame hole */}
      <rect x={290} y={-262} width={18} height={52} fill="white" />
      <path d={`M299 -262 Q ${288 + Math.sin(t / 3) * 3} -282 299 -300 Q ${310 + Math.sin(t / 4) * 3} -282 299 -262 Z`} fill="black" />
    </g>
  );
};

/** A robed walker with a staff (a churchman on a journey). `t` drives the step. */
export const WalkerSil: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => {
  const st = Math.sin(t / 6);
  return (
    <g transform={`translate(${x} ${y - Math.abs(st) * 6}) scale(${s})`}>
      <rect x={-30 + st * 16} y={-40} width={16} height={44} fill="white" transform={`rotate(${st * 12} -22 -40)`} />
      <rect x={14 - st * 16} y={-40} width={16} height={44} fill="white" transform={`rotate(${-st * 12} 22 -40)`} />
      <path d="M-80 -30 Q -86 -200 -20 -260 Q 30 -280 66 -240 Q 96 -160 84 -30 Z" fill="white" />
      <ellipse cx={0} cy={-300} rx={56} ry={44} fill="white" />
      <path d="M-60 -296 Q -66 -368 0 -372 Q 58 -366 58 -300 Q 26 -344 -6 -344 Q -46 -340 -60 -296 Z" fill="white" />
      <g transform={`rotate(${8 + st * 4} 70 -180)`}>
        <rect x={64} y={-190} width={70} height={18} rx={8} fill="white" />
        <rect x={124} y={-300} width={10} height={320} fill="white" />
        <path d="M129 -300 Q 160 -330 140 -350 Q 116 -344 129 -300 Z" fill="white" />
      </g>
    </g>
  );
};

/** A digger with a spade (1926). `t` drives the dig; `kind` picks spade or barrow. */
export const DiggerSil: React.FC<{ x: number; y: number; s?: number; t: number; phase?: number; kind?: "spade" | "barrow" | "trowel"; hat?: "cap" | "cloche" }> = ({
  x,
  y,
  s = 1,
  t,
  phase = 0,
  kind = "spade",
  hat = "cap",
}) => {
  const d = Math.sin(t / 8 + phase);
  const bend = kind === "spade" ? 10 + d * 12 : kind === "trowel" ? 26 : 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-34} y={-70} width={18} height={70} fill="white" />
      <rect x={16} y={-70} width={18} height={70} fill="white" />
      <g transform={`rotate(${bend} 0 -70)`}>
        <path d="M-60 -60 Q -66 -190 -10 -230 Q 40 -240 58 -200 Q 70 -130 60 -60 Z" fill="white" />
        <ellipse cx={0} cy={-270} rx={50} ry={40} fill="white" />
        {hat === "cap" ? <path d="M-50 -280 Q -46 -330 6 -330 Q 48 -326 50 -286 L 84 -280 Z" fill="white" /> : null}
        {hat === "cloche" ? <path d="M-58 -270 Q -60 -336 0 -338 Q 60 -334 58 -270 Q 0 -290 -58 -270 Z" fill="white" /> : null}
        {kind === "spade" ? (
          <g transform={`rotate(${-20 + d * 18} 40 -170)`}>
            <rect x={36} y={-180} width={12} height={200} fill="white" />
            <path d="M24 16 L 60 16 L 56 64 L 28 64 Z" fill="white" />
          </g>
        ) : null}
        {kind === "trowel" ? (
          <g transform={`rotate(${30 + d * 10} 40 -160)`}>
            <rect x={36} y={-170} width={10} height={110} fill="white" />
            <path d="M30 -64 L 54 -64 L 42 -20 Z" fill="white" />
          </g>
        ) : null}
      </g>
      {kind === "barrow" ? (
        <g transform={`translate(120 -40)`}>
          <path d="M-60 -60 L 120 -70 L 100 0 L -40 0 Z" fill="white" />
          <circle cx={110} cy={20} r={30} fill="white" />
          <rect x={-120} y={-56} width={80} height={12} fill="white" />
        </g>
      ) : null}
    </g>
  );
};

/** A press camera on a tripod with a flash pan. */
export const PressCamSil: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 -150 L -70 0 L -58 0 L 0 -130 L 58 0 L 70 0 Z" fill="white" />
    <rect x={-60} y={-230} width={120} height={84} rx={6} fill="white" />
    <rect x={56} y={-210} width={50} height={40} fill="white" />
    <rect x={-10} y={-300} width={8} height={72} fill="white" />
    <path d="M-40 -300 L 40 -300 L 30 -316 L -30 -316 Z" fill="white" />
  </g>
);

/** A small table (for Doubt's joke). */
export const TableSil: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-120} rx={130} ry={22} fill="white" />
    <rect x={-10} y={-120} width={20} height={110} fill="white" />
    <path d="M-60 0 L 60 0 L 10 -20 L -10 -20 Z" fill="white" />
  </g>
);

/** A window with mullions: the frame is card, the panes are holes (the moonlit screen shows through). */
export const WindowSil: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <rect x={x - 400} y={y - 400} width={w + 800} height={h + 800} fill="white" />
    <path d={`M${x} ${y + h} L${x} ${y + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L${x + w} ${y + h} Z`} fill="black" />
    <rect x={x + w / 2 - 7} y={y} width={14} height={h} fill="white" />
    <rect x={x} y={y + h * 0.55} width={w} height={14} fill="white" />
  </g>
);
