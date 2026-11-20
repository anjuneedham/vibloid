import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { BANGERS } from "../../shared/fonts";
import { Letterbox, Wordmark } from "../../shared/Frame";
import { SHADOW } from "../../shared/theme";
import { BanquetArt, BookPageArt, CardArt, CompareArt, MapArt, QuoteArt, SearchArt, StatArt, TabletArt, TimelineArt } from "./art";
import EP from "./episode.json";
import { clamp, Dips, Room, Shot, SourceTags, Speech, useShot } from "./kit";
import { LineId, linePages } from "./lines";
import {
  BoardShot,
  DigCrew,
  EndCard,
  FactPlate,
  GeoffreyPlay,
  GeraldPlay,
  PlaceShot,
  PoetPlay,
  PressFlash,
  SealShot,
  SlideShot,
  TableGag,
  TessaPlay,
  TitlePlate,
} from "./shots";
import { BEAT_START as B, cutBefore as C, HAS_VOICEOVER, inLine, lf, TOTAL_FRAMES, VOICEOVER_FILE } from "./timing";

// THE EVIDENCE ROOM, PART 2: THE ROUND TABLE AT CAERLEON. Lantern-lit shadow theatre, 1920 x 1080.
// Storyboard: scripts/evidence-room-2-caerleon/STORYBOARD.md (shot numbers s01..s41 match the names below).
// Every cut is placed relative to a line (C = just before a line starts, pg = a cartouche page inside a line),
// so the film re-flows when the real recording's units.json replaces the estimate.

/** absolute frame where page p of a line starts */
const pg = (id: LineId, p: number) => {
  const [a, b] = lf(id);
  return Math.round(a + (b - a) * linePages(id)[p].from);
};
/** local progress 0..1 through a line, for slide reveals */
const useLineK = (id: LineId) => {
  const { frame, S } = useShot();
  const s = S(id);
  return interpolate(frame, [s[0], s[1]], [0, 1], clamp);
};

const SvgStamp: React.FC<{ x: number; y: number; text: string; k: number; w?: number }> = ({ x, y, text, k, w = 520 }) =>
  k > 0 ? (
    <g transform={`translate(${x} ${y}) rotate(-8) scale(${interpolate(k, [0, 0.3, 1], [2, 0.92, 1], clamp)})`} opacity={Math.min(1, k * 4)}>
      <rect x={-w / 2} y={-40} width={w} height={80} fill={SHADOW.vellum} opacity={0.6} stroke={SHADOW.rubric} strokeWidth={7} />
      <text y={20} textAnchor="middle" fontFamily={BANGERS} fontSize={52} letterSpacing={3} fill={SHADOW.rubric}>
        {text}
      </text>
    </g>
  ) : null;

// ------------------------------------------------------------------ slide contents that need line progress
const MapSlide = () => {
  const { frame } = useShot();
  return <MapArt label={interpolate(frame, [12, 30], [0, 1], clamp)} pulse={(frame % 45) / 45} />;
};
const StatSlide = () => {
  const { frame } = useShot();
  return <StatArt n={Math.round(interpolate(frame, [6, 70], [0, 80], clamp))} />;
};
const Ad90vs80 = () => {
  const { frame, S } = useShot();
  return (
    <CompareArt
      left={{ head: "AROUND AD 90", body: <>“Built around AD 90 to entertain the legionaries stationed at the fort of Caerleon.”</>, cite: "Cadw, amphitheatre page (also Museum Wales, Roman Ruins)" }}
      right={{ head: "AROUND AD 80", body: <>The excavators concluded “around AD 80”.</>, cite: "Museum Wales blog, Where Gladiators Fought" }}
      rightIn={interpolate(frame, [S("L11")[0], S("L11")[0] + 14], [0, 1], clamp)}
    />
  );
};
const GilesPage = () => (
  <BookPageArt head="Book IX, chapter 12" quote="hold a magnificent court, to place the crown upon his head" cite="Geoffrey of Monmouth, trans. J. A. Giles (1848)" underline={useLineK("L13")} />
);
const CadwVsGeoffrey = () => {
  const { frame, S, P } = useShot();
  return (
    <CompareArt
      left={{ head: "CADW SAYS", body: <>Geoffrey wrote that “the ruined amphitheatre was actually the remains of King Arthur’s Round Table”.</>, cite: "Cadw booklet, p. 22, and Cadw web page" }}
      right={{ head: "GEOFFREY’S TEXT", body: <>Round Table: no mention. Amphitheatre: no mention.</>, cite: "Giles 1848, Evans 1904, Latin ed. 1844 (word search)" }}
      rightIn={interpolate(frame, [S("L17")[0] - 6, S("L17")[0] + 8], [0, 1], clamp)}
      stamp="NOT IN THE TEXT"
      stampIn={interpolate(frame, [P("L17", 1), P("L17", 1) + 12], [0, 1], clamp)}
    />
  );
};
const Banquet = () => <BanquetArt underline={useLineK("L18")} />;
const Timeline = () => <TimelineArt k={useLineK("L19")} />;
const HoarePage = () => {
  const { frame, P } = useShot();
  return (
    <BookPageArt
      head="Itinerary, Book I, chapter 5"
      quote="Immense palaces, ornamented with gilded roofs, in imitation of Roman magnificence; a tower of prodigious size, remarkable hot baths, relics of temples, and theatres inclosed within fine walls"
      cite="Gerald of Wales (1188), trans. R. C. Hoare (1806)"
      underline={useLineK("L22")}
      fs={34}
    >
      <SvgStamp x={690} y={520} text="ROUND TABLE: NOT MENTIONED" k={interpolate(frame, [P("L22", 3), P("L22", 3) + 12], [0, 1], clamp)} w={560} />
    </BookPageArt>
  );
};
const MemoirPage = () => (
  <BookPageArt
    head="A Memoir, vol. 1, p. 416"
    quote="The Usk murmurs by the windows, and I sit like King Arthur in Caerleon."
    cite="Tennyson’s letter of 16 September 1856, in Hallam Tennyson’s Memoir (1897)"
    underline={useLineK("L23")}
  />
);
const Tablet = () => <TabletArt k={useLineK("L31")} />;

// ------------------------------------------------------------------ the shot list (absolute frames)
type ShotDef = { name: string; from: number; el: React.ReactNode };

const ROOM_LAMP = 900;
const SHOTS: ShotDef[] = [
  // BEAT 1: THE CASE
  {
    name: "s01-room-open",
    from: 0,
    el: <Room lampX={760} zoom={[1.0, 1.07]} pan={[-40, 30]} cast={[{ who: "curator", x: 880, width: 320 }, { who: "clerk", x: 1560, width: 240, eyesClosed: true, headDrop: 10, idle: false }]} />,
  },
  { name: "s02-place-title", from: pg("L02", 1) - 6, el: <PlaceShot kind="moon" zoom={[1.0, 1.06]} place="CAERLEON, SOUTH WALES" overlay={<TitlePlate at={6} />} /> },
  // BEAT 2: THE CLAIM
  {
    name: "s03-room-claim",
    from: B[2],
    el: <Room lampX={ROOM_LAMP} cast={[{ who: "dig", x: 600, width: 300, armL: 130, armR: -130, browLift: 1 }, { who: "doubt", x: 1300, width: 290 }, { who: "clerk", x: 1640, width: 240 }]} />,
  },
  { name: "s04-place-arena", from: C("L04", 0.3), el: <PlaceShot kind="ruins" place="OUTSIDE THE FORTRESS WALLS" sub="Caerleon, south Wales" /> },
  { name: "s05-slide-map", from: pg("L04", 2) - 4, el: <SlideShot full exhibit="EXHIBIT A" label="Ordnance Survey 2nd edition, recorded 1898 to 1908" art={() => <MapSlide />} /> },
  {
    name: "s06-slide-founded",
    from: C("L05"),
    el: <SlideShot cast={[{ who: "clerk", x: 340, width: 290, armR: -60 }]} exhibit="EXHIBIT B" label="Museum Wales" art={() => <QuoteArt kicker="MUSEUM WALES" quote="It was founded in AD 74 or 75" cite="Museum Wales, Caerleon, City of the Legion" />} gel={SHADOW.gelTeal} />,
  },
  // BEAT 3: THE ROMANS
  {
    name: "s07-place-fortress",
    from: B[3],
    el: (
      <PlaceShot
        kind="fortress"
        place="ISCA (CAERLEON), ABOUT AD 75"
        sub="Fortress of the Second Augustan Legion"
        overlay={<FactPlate at={pg("L06", 1) - B[3]} big="ONE OF JUST THREE" small="permanent legionary fortresses in Britain (Cadw)" />}
      />
    ),
  },
  { name: "s08-slide-soldiers", from: C("L07"), el: <SlideShot full exhibit="EXHIBIT C" label="Museum Wales" art={() => <StatSlide />} /> },
  {
    name: "s09-place-amphitheatre",
    from: C("L08"),
    el: (
      <PlaceShot
        kind="ruins"
        zoom={[1.02, 1.12]}
        place="THE AMPHITHEATRE"
        sub="outside the fortress walls"
        overlay={
          <>
            <FactPlate at={10} to={pg("L08", 1) - C("L08")} big="BEGUN AROUND AD 90" small="Cadw; Museum Wales" />
            <FactPlate at={pg("L08", 1) - C("L08")} big="ABOUT 6,000 SEATS" small="an estimate (Cadw; Museum Wales)" />
          </>
        }
      />
    ),
  },
  {
    name: "s10-slide-multiplex",
    from: C("L09"),
    el: <SlideShot full exhibit="EXHIBIT D" label="Cadw" art={() => <QuoteArt kicker="CADW CALLS IT" quote="the Roman equivalent of today’s multiplex cinema" cite="Cadw, Caerleon Roman Amphitheatre page" fs={70} />} />,
  },
  { name: "s11-room-doubt", from: C("L10", 0.25), el: <Room lampX={ROOM_LAMP} zoom={[1.12, 1.15]} lean={0} cast={[{ who: "doubt", x: 960, width: 330 }]} gel={SHADOW.gelTeal} gelOpacity={0.24} /> },
  { name: "s12-slide-ad90-ad80", from: C("L11"), el: <SlideShot cast={[{ who: "clerk", x: 340, width: 290, armR: -60 }]} exhibit="CONTRADICTION" label="Cadw vs Museum Wales" art={() => <Ad90vs80 />} gel={SHADOW.gelTeal} /> },
  // BEAT 4: THE WITNESS
  { name: "s13-play-geoffrey", from: B[4], el: <GeoffreyPlay /> },
  { name: "s14-slide-giles", from: C("L13"), el: <SlideShot cast={[{ who: "dig", x: 340, width: 300, armR: -120, armL: 40 }]} exhibit="EXHIBIT E" label="Geoffrey, Book IX ch. 12" art={() => <GilesPage />} /> },
  {
    name: "s15-slide-cadw-geoffrey",
    from: C("L14"),
    el: <SlideShot cast={[{ who: "clerk", x: 340, width: 290, armR: -60 }]} exhibit="EXHIBIT F" label="Cadw" art={() => <QuoteArt kicker="CADW ON GEOFFREY" quote="the somewhat imaginative 12th-century scholar" cite="Cadw, Caerleon Roman Amphitheatre page" fs={66} />} gel={SHADOW.gelTeal} />,
  },
  { name: "s16-room-somewhat", from: C("L15", 0.2), el: <Room lampX={ROOM_LAMP} zoom={[1.16, 1.18]} lean={0} cast={[{ who: "doubt", x: 960, width: 330, browTilt: 1 }]} gel={SHADOW.gelTeal} gelOpacity={0.24} /> },
  // BEAT 5: THE MISSING TABLE
  { name: "s17-slide-search", from: B[5], el: <SlideShot cast={[{ who: "clerk", x: 340, width: 290, armR: -60 }]} exhibit="EXHIBIT G" label="Three editions searched" art={(f) => <SearchArt k={f / 90} />} gel={SHADOW.gelTeal} /> },
  { name: "s18-slide-cadw-vs-geoffrey", from: C("L17", 0.2), el: <SlideShot full exhibit="CONTRADICTION" label="Cadw vs Geoffrey's own text" art={() => <CadwVsGeoffrey />} /> },
  { name: "s19-slide-banquet", from: C("L18"), el: <SlideShot full exhibit="EXHIBIT H" label="Geoffrey, Book IX ch. 13 (Evans)" art={() => <Banquet />} /> },
  { name: "s20-slide-wace", from: C("L19"), el: <SlideShot full exhibit="EXHIBIT I" label="Geoffrey c. 1136, Wace 1155" art={() => <Timeline />} /> },
  {
    name: "s21-room-dig-doubt",
    from: C("L20", 0.3),
    el: <Room lampX={ROOM_LAMP} cast={[{ who: "dig", x: 640, width: 300, armL: 120, armR: -120, browLift: 1 }, { who: "doubt", x: 1280, width: 290 }]} />,
  },
  { name: "s22-play-table", from: pg("L21", 1) - 4, el: <TableGagWrap /> },
  // BEAT 6: THE WITNESSES
  { name: "s23-play-gerald", from: B[6], el: <GeraldPlay /> },
  { name: "s24-slide-hoare", from: pg("L22", 2) - 4, el: <SlideShot full exhibit="EXHIBIT J" label="Gerald of Wales, 1188" art={() => <HoarePage />} /> },
  { name: "s25-play-poet", from: C("L23"), el: <PoetPlay /> },
  { name: "s26-slide-memoir", from: pg("L23", 3) - 4, el: <SlideShot full exhibit="EXHIBIT K" label="Hallam Tennyson, Memoir, 1897" art={() => <MemoirPage />} /> },
  { name: "s27-room-lovely", from: C("L24"), el: <Room lampX={ROOM_LAMP} cast={[{ who: "dig", x: 640, width: 300 }, { who: "doubt", x: 1280, width: 290 }]} gel={SHADOW.gelTeal} gelOpacity={0.2} /> },
  // BEAT 7: THE NEWSPAPER
  {
    name: "s28-place-dig1926",
    from: B[7],
    el: (
      <PlaceShot kind="ruins" place="CAERLEON, 1926" sub="the amphitheatre is dug out" pan={[-40, 60]}>
        <DigCrew />
        <PressFlash />
      </PlaceShot>
    ),
  },
  {
    name: "s29-slide-paid",
    from: C("L26"),
    el: (
      <SlideShot
        cast={[{ who: "clerk", x: 340, width: 290, armR: -60 }]}
        exhibit="EXHIBIT L"
        label="Cadw booklet, pp. 22 to 23"
        art={() => <CardArt head="1926: WHO PAID?" lines={<>The Daily Mail funded the dig, in return for “exclusive” updates.</>} cite="Cadw, Trailblazers: Tessa Verney Wheeler (booklet), pp. 22 to 23" />}
        gel={SHADOW.gelTeal}
      />
    ),
  },
  {
    name: "s30-slide-canny",
    from: C("L27"),
    el: <SlideShot cast={[{ who: "doubt", x: 340, width: 290 }]} exhibit="EXHIBIT M" label="Cadw booklet" art={() => <QuoteArt kicker="CADW BOOKLET" quote="The Wheelers were canny enough not to dispute this romantic idea" cite="Cadw, Trailblazers booklet, pp. 22 to 23" fs={56} />} gel={SHADOW.gelTeal} />,
  },
  {
    name: "s31-slide-untrue",
    from: C("L28"),
    el: <SlideShot cast={[{ who: "curator", x: 340, width: 300, armR: -50 }]} exhibit="EXHIBIT N" label="Cadw booklet" art={() => <QuoteArt kicker="CADW’S OWN BOOKLET" quote="an appealing, (though untrue), story and was guaranteed to sell newspapers." cite="Cadw, Trailblazers booklet, pp. 22 to 23" fs={56} />} />,
  },
  { name: "s32-play-tessa", from: C("L29"), el: <TessaPlay /> },
  { name: "s33-slide-tablet-in", from: C("L30", 0.3), el: <SlideShot cast={[{ who: "dig", x: 340, width: 300, armL: 120, armR: -120, browLift: 1 }]} exhibit="EXHIBIT O" label="Lead curse tablet" art={() => <TabletArt k={0} />} /> },
  { name: "s34-slide-tablet", from: C("L31"), el: <SlideShot full exhibit="EXHIBIT O" label="Cadw's translation" art={() => <Tablet />} gel={SHADOW.gelTeal} /> },
  { name: "s35-room-evidence", from: C("L32", 0.2), el: <Room lampX={ROOM_LAMP} zoom={[1.1, 1.13]} lean={0} cast={[{ who: "doubt", x: 960, width: 330, browLift: 0.6 }]} /> },
  // BEAT 8: THE EVIDENCE BOARD
  { name: "s36-board", from: B[8], el: <BoardWrap /> },
  // BEAT 9: THE VERDICT
  { name: "s37-room-court-finds", from: B[9], el: <Room lampX={960} zoom={[1.04, 1.13]} lean={0} cast={[{ who: "curator", x: 960, width: 330 }]} gel={SHADOW.gelRose} gelOpacity={0.16} moths={false} /> },
  { name: "s38-seal", from: C("L36", 1.4), el: <SealWrap /> },
  {
    name: "s39-room-great-story",
    from: C("L38", 0.3),
    el: <Room lampX={960} cast={[{ who: "dig", x: 560, width: 290, armL: 120, armR: -120 }, { who: "curator", x: 960, width: 300, mouth: "smile" }, { who: "doubt", x: 1360, width: 290 }]} gel={SHADOW.gelRose} gelOpacity={0.22} />,
  },
  // BEAT 10: NEXT CASE
  { name: "s40-room-next-case", from: B[10], el: <NextCase /> },
  { name: "s41-end-card", from: B[11], el: <EndCard /> },
];

function TableGagWrap() {
  const { S } = useShot();
  const s = S("L21");
  return <TableGag grow={[6, s[1] - 4]} />;
}

function BoardWrap() {
  const { P, S } = useShot();
  return (
    <BoardShot
      cards={[
        { at: P("L33", 0) - 6, stampAt: P("L33", 0) + 30, head: "ROMAN AMPHITHEATRE", body: "Cadw; Museum Wales; Coflein", stamp: "FOUND", tone: SHADOW.gelTeal, x: 250, y: 160, r: -3 },
        { at: P("L33", 1) - 6, stampAt: P("L33", 1) + 36, head: "ROUND TABLE IN GEOFFREY", body: "Giles, Evans and the Latin, searched", stamp: "NOT IN THE TEXT", tone: SHADOW.rubric, x: 1220, y: 170, r: 2.5 },
        { at: P("L33", 2) - 6, stampAt: P("L33", 4), head: "AMPHITHEATRE CALLED THE ROUND TABLE", body: "Earliest firm label: Ordnance Survey maps, recorded 1898 to 1908", stamp: "c. 1900", tone: SHADOW.brassDark, x: 260, y: 500, r: 2 },
        { at: S("L34")[0] - 6, stampAt: S("L34")[0] + 40, head: "WHEN DID THE NAME BEGIN?", body: "No dated source found", stamp: "NOT FOUND", tone: SHADOW.rubric, x: 1220, y: 520, r: -2 },
      ]}
    />
  );
}

function SealWrap() {
  const { T } = useShot();
  return <SealShot hit={T(inLine("L36", 0.55))} speaker={{ who: "curator", x: 330, width: 300 }} />;
}

function NextCase() {
  return (
    <AbsoluteFill>
      <Room lampX={960} dim={0.7} lean={0} zoom={[1.02, 1.08]} cast={[{ who: "curator", x: 760, width: 300 }]} lit={[2]} />
      <FactPlate at={14} big={EP.teaserCard} small="Pinned for next time" x={1000} y={260} />
    </AbsoluteFill>
  );
}

/** The cuts that get a soft lamp-dip instead of a hard cut (moving between places). */
const DIPS = ["s02-place-title", "s07-place-fortress", "s13-play-geoffrey", "s23-play-gerald", "s28-place-dig1926", "s36-board", "s41-end-card"].map(
  (n) => SHOTS.find((s) => s.name === n)!.from,
);

export const EVIDENCE_ROOM_2_FRAMES = TOTAL_FRAMES;

export const EvidenceRoom2: React.FC = () => (
  <AbsoluteFill style={{ background: SHADOW.room }}>
    <BoilDefs id="ink" scale={4} rate={8} frequency={0.02} />
    {SHOTS.map((s, i) => (
      <Shot key={s.name} name={s.name} from={s.from} to={i < SHOTS.length - 1 ? SHOTS[i + 1].from : TOTAL_FRAMES}>
        {s.el}
      </Shot>
    ))}
    <SourceTags />
    <Speech />
    <Dips at={DIPS} />
    {HAS_VOICEOVER ? <Audio src={staticFile(VOICEOVER_FILE)} /> : null}
    <Letterbox />
    <Wordmark bottom={10} zIndex={1100} />
  </AbsoluteFill>
);
