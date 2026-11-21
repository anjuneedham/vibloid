# Monday recording plan: 3 Past Tense + 3 Gold Journal

## Thumbnail templates (`renderTemplateThumbnail` in `src/lib/thumbnail.ts`)
Taken from Crayon Capital's approach: **one subject, one idea, 1–3 words, bold outline, saturated colour, recurring character.**

| Template | Use when | Look |
|---|---|---|
| **A: Name** | The story is a person or place | Name huge across the top, white with black outline. Subject fills the frame. Optional character bottom-left. |
| **B: Number** | There's a shocking figure | Red stat top-left ("-$6.3 BILLION"). Subject below. |
| **C: Board** | Mystery, scandal, spy | Evidence-board frame, red pins and string, red label strip at the top. |

Samples: `docs/thumb-A.png`, `docs/thumb-B.png`, `docs/thumb-C.png` (placeholder background).

Rules: all text and the subject's face go in the top half. TV and phone apps cover the bottom with the duration, progress bar and title. Text never repeats the title. Read it at phone size before uploading. Upload all 3 to YouTube Test & Compare.

The biggest missing piece is a **recurring character**, like Crayon's little banker. Pass one PNG as `characterPath` and it goes on every thumbnail. For example, a scribe with a quill for Past Tense and a bearded prospector for Gold Journal.

---

## Script shape (both channels, 10–14 min, about 1,500–2,000 words)
1. **Cold open (0:00–0:30).** Drop in at the most dramatic moment, then ask the question the video answers. No "welcome back".
2. **Promise (0:30–0:45).** "By the end you'll know X, and the part nobody tells you is Y."
3. **Chapters 1–4 (2–3 min each).** Each one ends on an **open loop**, a question answered in the *next* chapter:
   "But that wasn't the worst part…" / "What he didn't know was…" / "And that's when the phone rang."
4. **Mid-video reset (~50%).** A surprising fact or "plot twist" beat to catch drop-off.
5. **Payoff.** Answer the cold-open question.
6. **Lesson + loop.** One sentence on why it matters today, then point to the next video.

Readability: one idea per sentence, about 15 words or fewer. Say every name and date once on screen. Use an "explain like I'm 5" analogy for anything complex.

---

## Past Tense (history)

**Recurring cast** (Evidence Room, in `history-film/src/shared/cast` on branch `ccr-8df25987-ah0f5r`; see `previews/evidence-room-cast.png`):
- The Curator: bowler hat and monocle, the host
- Dig: pith helmet, believes every find
- Doubt: red scarf, sleepy eyes, the sceptic
- The Clerk: round glasses and inkwell, keeps the sources

Build Past Tense thumbnails in Remotion with the existing `Actor` / `BigText` / `StampMark` pieces, like `series/Thumbnail1.tsx` ("TOMB ON TRIAL" + "NOT PROVEN" stamp). That file already is template A with two reactors. Put the BigText at the top for TV. Characters stand at the sides with feet at the bottom; the overlays only cover their feet.

| Video | Text (top) | Cast | Stamp / prop |
|---|---|---|---|
| Prometheus | STOLE FROM ZEUS | Dig amazed (left), Doubt arms crossed (right) | flame in a fennel stalk, centre |
| Jesus records | ROMAN RECORDS | The Clerk holding a scroll, Doubt squinting | stamp: "EVIDENCE?" |
| Vietnam spy | THE PERFECT SPY | The Curator with a magnifying glass, Dig shocked | redacted photo pinned on the board, stamp: "DOUBLE AGENT" |

### 1. Prometheus
- **Titles:** *Prometheus: The God Who Betrayed Zeus* · *Why Zeus Chained Prometheus Forever* · *The Myth of Prometheus Explained Like You're 5*
- **Thumbnail:** A, "PROMETHEUS" (chained figure, eagle) · alt C, "STOLE FROM ZEUS"
- **Cold open:** An eagle arrives at a mountain every single day to eat the same man's liver. What did he do?
- **Chapters:**
  1. The Titans' war (loop: "he picked the winning side and still lost")
  2. The trick at Mekone, bones hidden under fat (loop: Zeus's revenge)
  3. Stealing fire in a fennel stalk (loop: the punishment is for humans too)
  4. Pandora
  5. The chains, then Heracles
- **Lesson:** Why "Promethean" still means dangerous knowledge, from Frankenstein to AI.
- **Sources:** Hesiod, *Theogony* and *Works and Days*; Aeschylus, *Prometheus Bound*.
- **Description keywords:** Prometheus myth, Greek mythology explained, Prometheus and Zeus, Titan, Pandora's box, Greek gods story, mythology animated.

### 2. Jesus in the historical record
- **Titles:** *What Roman Historians Actually Wrote About Jesus* · *Jesus Outside the Bible: The Ancient Records* · *Did History Record Jesus? Explained Like You're 5*
- **Thumbnail:** C, "ROMAN RECORDS" (manuscript and Pilate Stone) · alt A, "TACITUS"
- **Cold open:** In 116 AD a Roman senator who disliked Christians wrote one sentence that historians still argue over.
- **Chapters:**
  1. Paul's letters, the earliest writing
  2. Josephus and the "edited" passage (loop: who changed it?)
  3. Tacitus and Pliny
  4. Archaeology: the Pilate inscription and the crucified man's heel bone
  5. Where historians agree and disagree
- **Tone:** Report what the sources say. Never argue for or against faith.
- **Description keywords:** historical Jesus, Jesus in Roman history, Tacitus Jesus, Josephus, Pontius Pilate, biblical archaeology, ancient history explained.

### 3. The Vietnam War spy (Pham Xuan An)
- **Titles:** *The Spy Who Fooled America for 20 Years* · *Time Magazine's Reporter Was a Communist Spy* · *The Perfect Spy of the Vietnam War*
- **Thumbnail:** C, "THE PERFECT SPY" (redaction bar over eyes) · alt A, "DOUBLE LIFE"
- **Cold open:** The most trusted reporter in Saigon had dinner with American officers every week. He was also a colonel for the other side.
- **Chapters:**
  1. Recruited young
  2. Sent to study in California (loop: the US trained its own enemy)
  3. Reuters, then Time
  4. What he passed on (flag what's disputed)
  5. 1975 and the reveal
- **Source:** Larry Berman, *Perfect Spy* (2007).
- **Description keywords:** Vietnam War spy, Pham Xuan An, Cold War espionage, Time magazine spy, Saigon 1975, Vietnam War history documentary.

---

## The Gold Journal (finance, told as stories, no advice)

### 4. The Hunt Brothers tried to corner silver
- **Titles:** *How Two Brothers Tried to Own All the World's Silver* · *Silver Thursday: The Hunt Brothers' Billion-Dollar Crash*
- **Thumbnail:** B, loss figure (verify the exact number first) · alt A, "HUNT BROTHERS"
- **Cold open:** In January 1980 silver hit about $50. Two months later the richest family in Texas couldn't pay its bills.
- **Chapters:**
  1. Oil money and inflation fear
  2. The buying spree (loop: the exchange changes the rules)
  3. Silver Thursday
  4. The bailout and the trial
- **Description keywords:** Hunt brothers silver, Silver Thursday 1980, silver market history, commodity crash explained, finance history.

### 5. Why the dollar left gold (Nixon, 1971)
- **Titles:** *The Day the Dollar Stopped Being Gold* · *Nixon's 1971 Decision Explained Like You're 5*
- **Thumbnail:** A, "1971" (Nixon and a gold bar) · alt C, "NO MORE GOLD"
- **Cold open:** A Sunday-night TV speech in August 1971 changed what money is, and most people watching had no idea.
- **Chapters:**
  1. Bretton Woods
  2. France asks for its gold back (loop)
  3. Camp David weekend
  4. What fiat money means today
- **Description keywords:** gold standard explained, Nixon shock 1971, Bretton Woods, fiat money, history of the dollar, gold price history.

### 6. The Brink's-Mat gold heist (London, 1983)
- **Titles:** *The Robbers Expected Cash. They Found 3 Tonnes of Gold* · *The Heist That Was Too Successful*
- **Thumbnail:** B, "3 TONNES" · alt C, "THE CURSE"
- **Cold open:** Six men broke into a warehouse expecting about £1 million in cash. They found gold worth £26 million and no way to sell it.
- **Chapters:**
  1. The inside man
  2. The haul (loop: how do you sell stolen gold?)
  3. Melting and laundering
  4. The "curse", as people linked to it kept dying
- **Description keywords:** Brink's-Mat robbery, biggest gold heist, true crime history, gold heist explained, UK heist documentary.

Every Gold Journal description ends with: "Educational storytelling only, not financial advice."

---

## Description template
```
[1–2 sentences restating the title's promise, using the main keyword in the first line]
[2–3 sentences of story teaser with 3–4 secondary keywords used naturally]

Chapters
0:00 ...
Sources: ...
Visual credits: ...
(Gold Journal) Educational storytelling only, not financial advice.
```

## Visual depth without editing skills
Downloading other creators' YouTube Shorts and reusing them is copyright infringement. It also gets videos flagged as reused content and demonetised, and the system blocks `rights_status=unknown`.

Free sources you can safely use:
- Public-domain art: Met Open Access, Rijksmuseum, Wikimedia Commons
- US archives (Vietnam, Nixon): NARA, Library of Congress
- Stock footage: Pexels
- Descript's built-in stock library

Descript can also auto-edit your mic recording: remove filler words, add captions and drop in stock clips.
