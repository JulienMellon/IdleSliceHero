# R0 — the sound source

**Scope:** find out whether the soundfont is the problem before any note is rewritten. No cue in the game changes in this round: `assets/audio/` and `src/audio/manifest.ts` must come out untouched.

## Cards
| ID | What | Card |
| --- | --- | --- |
| M0 | Bank comparison, the bank switch in the build, the reel tool, the stem audit | `card-M0.md` |

## Flow
1. **M0.**
2. **Verify, short form** (instead of README section 6):
   ```
   git status --short assets/audio src | head -3          # must print nothing
   npx jest src/audio 2>&1 | tail -5
   ls -la tools/audio/build/reel/R0.mp3 | cut -c1-80
   git status --short | grep 'tools/audio/build/\|tools/audio/banks/' | head -3      # must print nothing: both are ignored
   ```
3. Commit and push. **No review** in this round: there is no cue sheet change to review.
4. Reel: M0 has built `tools/audio/build/reel/R0.mp3`; send it with `R0.txt`.
5. Stop.

## The question for Julien
"Which clip is the least like bagpipes and the most relaxing: A, B, C or D? Clip 1 is today's Downtown for reference. Default if you'd rather not choose: `<the letter on the Needs: line of M0's report>`."

Put the composer's recommendation and its two supporting numbers (from the `Needs:` line) in your message. If he says none of them is good enough, that is notes with no yes: run a notes round with his words.

## Defaults
- **Candidates:** A = TimGM6mb (today's bank). B = FluidR3_GM (`apt-get install fluid-soundfont-gm`). C = MuseScore_General (`apt-get install musescore-general-soundfont`). D = GeneralUser GS (GitHub `mrbumpy409/GeneralUser-GS`). A bank that can't be fetched or loaded within 10 minutes is dropped, and the message says which.
- **Banks are never committed.** `tools/audio/fetch_bank.sh` fetches the chosen one and checks its sha256.
- **Licence:** a bank whose licence file does not clearly allow using its rendered audio in a commercial app is shown in the table but is not recommended. The composer quotes the licence name and where it read it; nobody here gives a legal opinion.
- **The reel** is five clips of 12 seconds: today's Downtown, then the same 16 bars with the accordion's part on nylon guitar through each bank. Same bars, same mastering, no per-clip loudness matching.
