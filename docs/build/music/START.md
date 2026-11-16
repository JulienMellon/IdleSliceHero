# Music rewrite — how to run it (for Julien)

**The orchestrator does not read this file.** It reads `README.md`, `STATE.md` and one round file. The direction is `docs/PLAN-music-rewrite.md`.

## The sessions
Each session ends by sending you a reel and opening one pull request. Nothing further is built until you have listened.

| # | Round | What gets built | What you get | What you answer |
| --- | --- | --- | --- | --- |
| 1 | R0, sound source | Nothing in the game. Four soundfonts compared on Downtown; the reel tool; the lead-versus-bed audit | A 1-minute reel: today's Downtown, then the same bars on nylon guitar through banks A, B, C, D | A letter |
| 2 | R1, loops | Six loops, Downtown sparse, MegaSlice HQ, as lofi jazz | A 4-minute reel, 30 s per loop | "go", or notes |
| 3 | R2, stingers and story | All stingers, the bid, six triumphs, city theme, villain stings, Victor's exit, recipe, reunion | A 5-minute reel with stingers and triumphs played over their loops | "go", or notes |
| 4 | Close | Logs and cue sheet; unblocks `v5.18/card-A2.md` | Three sentences | Nothing |

Notes without a "go" get a notes round on the same material and a new reel. A "go" with notes moves on and applies the notes first.

## How to run one
1. Merge the last session's pull request. (To throw a round away, close it instead and say so in your answer.)
2. Start a fresh session and paste the prompt below, with your answer on its last line. It is the same prompt every time.
3. If a session stops early, merge its pull request and paste the same prompt with the same answer.

```
You are the orchestrator for Slice Empire's music rewrite. Work only from files; do not explore the repo.
1. Run: ls docs/build/music/README.md .claude/agents/composer.md 2>&1 | tail -2
   If either is missing, run: git fetch -q origin claude/music-rewrite-orchestration && git merge -q --no-edit FETCH_HEAD 2>&1 | tail -3
2. Run: grep -n '^round:\|^step:\|^bank:\|^next:' docs/build/music/STATE.md | cut -c1-200
3. Read docs/build/music/README.md and follow it exactly. It names the only other files you may read.
At the end of the session, send me the audition reel as a file and open one pull request from this session's branch to main, as the README says. I am asking for that reel and that pull request now.
Julien's answer to the last reel: none (first session)
```

Examples of the last line: `B` · `go` · `go, but the Suburbs vibraphone is too loud` · `Uptown still sounds like a horn section; the drums are too busy everywhere`.

## Who does what
| Agent | Brief | Job |
| --- | --- | --- |
| Orchestrator (the session) | `docs/build/music/README.md` | Launches one card at a time, runs the checks, builds and sends the reel, keeps `STATE.md`, stops for you |
| `composer` (Sonnet, high effort) | `.claude/agents/composer.md` | One card: edits `tools/audio/`, runs the audio build, reports measurements |
| `audiocritic` | `.claude/agents/audiocritic.md`, "Music rewrite track" section | Reviews R1 and R2 from code and measurements: palette, lead under bed, loudness hierarchy, groove, harmony, constraints. Advisory |

None of them can hear. The audiocritic's verdict is a check of the code against your brief, not an opinion on the sound.

## What the build enforces from R1 on
- **Palette:** accordion, harmonica, brass, reeds, fiddle, shanai, bagpipe, square and saw leads are out of the whole score; no crash, tom, tambourine or cowbell. A banned program stops the build.
- **Lead under bed:** each loop's lead is rendered alone and measured against its bed. Target −2 to −4 LU; 0 or above fails the card.
- **Hierarchy (from R2):** big rare stingers measure louder than small frequent ones, on average and at their loudest moment.
- Unchanged: loop seams, −6 dBFS ceilings, loudness tiers, the 14 MB cap, the stinger timing tests.

## Sequencing with the version loop
- This track never touches `docs/build/STATE.md`, `src/content/version.ts` or any file under `src/` except the generated `src/audio/manifest.ts`.
- v5.17 can run alongside it: its audio card owned `src/audio/` and was forbidden `tools/audio/` and `assets/audio/`.
- **v5.18's card A2 owns the same files as this track.** It now carries a prerequisite and reports BLOCKED until this track's STATE says `round: done`. Finish the music before v5.18 reaches wave 4, or let wave 4 run without A2.
- v5.19's card A3 says the showdown and ending cues "keep their energy; they are not lofi". That line is older than your 2026-11-15 direction and has not been changed. Your call when v5.19 comes up.
