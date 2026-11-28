# Card W6 — copy for renovation, free gifts, the Starter Pack, and story fixes (v5.25, lane T, writer)

**Goal:** every new line v5.25 shows the player, in one file: `docs/story/COPY-v5.25.md`. **T3** puts these strings into code (`src/content/copy/**`, `src/content/scenes/**`), and U7 and N3 read them through T3's keys.

**Read first:** `docs/build/v5.25/VERSION.md`; `docs/build/v5.25/renovation.md` (E10's list); the cast voice files `src/content/cities/home/voice.ts` and `src/content/copy/**` (for tone); the "## Open notes" table only of `docs/build/v5.24/review-r1-story.md` and of `docs/build/v5.24/review-r3-code.md` (rows S97 and S106).

## Write (one section each, every string with a key `section.name`)
1. **Renovation:**
   - the offer line;
   - the confirm screen (what resets: station levels; what stays: cash, staff, hoods; what is gained: x2 / x3 / x4, a plaque, a fixture, 3 new decor);
   - the button labels;
   - the reward banner for each level;
   - one cast reaction bark per level (Marco, Lucia, Benny);
   - plaque text I/II/III;
   - a name for each of the 18 fixtures and 54 decor items in `renovation.md`, at most 18 characters, distinct within a shop, and each fitting its neighbourhood.
2. **Free gift:** a hint line when it is ready, a pickup banner (with `{cash}`, and a second version with `{cash}` and `{diamonds}`), and 3 cast barks for opening it.
3. **Starter Pack:** a store card title, a 1-line subtitle and the three item lines ($7K cash, 400 💎, 2x for 30 min). Check them against N3's LAUNCH-TRACK text, so the two read as one pack.
4. **Story fixes:** for each open row in `review-r1-story.md` (9 minor) and for S97 and S106 (oven names: give each oven a final name), write the corrected string with its file and key, or a reason to keep it.

## Rules
- Banners ≤ 32 characters, barks ≤ 60.
- Numbers are always placeholders (whole numbers on screen, the formatter decides).
- No "limited", no timer pressure.

## Report
Standard writer format, the file path, the count of strings per section, and `Lands in: T3`.
