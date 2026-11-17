# Leo's trade: 5-part series (James narrates)

Template: `t03` (series) from `specs/james-templates.json`, borrowing the sizing (`t07`) and review (`t19`) beats. One made-up trader (Leo), fixed numbers: account 5,000; risk 1% = 50; buy 100, stop 98, target 104; 25 shares; stop hit, loss 50, account 4,950.

Each part is **two ElevenLabs blocks** (~15 s each, ~38 words). The exact text for every block is in `blocks.json`. Voice: "Khalid - Warm, Articulate & Steady" (`YdQ8Mm2zk57XBAwp6QyE`), model `eleven_multilingual_v2`, one take each.

| Part | Spec | Audio |
|---|---|---|
| 1 plan | `leo-1-the-plan.json` | blocks 1 and 2 still to generate |
| 2 size | `leo-2-the-size.json` | blocks 1 and 2 still to generate |
| 3 stop | `leo-3-the-stop.json` | block 1 still to generate; block 2 done |
| 4 journal | `leo-4-the-journal.json` | done, built |
| 5 rule | `leo-5-the-rule.json` | done, built |

To finish a part: generate its missing blocks with the exact text from `blocks.json`, save them as `assets/james-audio/<slug>.b1.mp3` and `.b2.mp3`, add the `audio.blocks` entry to the spec (same shape as parts 4 and 5), then run
`TTS_PROVIDER=mock pnpm exec tsx scripts/make-short.ts specs/james-leo-series/<slug>.json`
(`TTS_PROVIDER=mock` is only a placeholder: the real voice comes from the `audio` blocks).

Caption timing is estimated from the audio, with cuts snapped to the quietest point near each sentence boundary. For exact word timing, regenerate with `ELEVENLABS_API_KEY` set and the ElevenLabs provider (it uses the with-timestamps endpoint).
