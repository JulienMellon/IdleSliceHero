// Station heads' barks, the Head of the Week and the day-30 visitors' cameo (v5.15). Every number and line is here; the rules are in
// src/engine/features/heads.ts (barks, the week's pick) and src/components/scene/cameo.ts (the visitor in the shop).
// Strings come from docs/story/COPY-v5.15.md sections 2 and 8, by key: bark.<shop>.<station>.<trigger> and cameo.nonna.<n>.
import type { NeighborhoodId } from './types';

export type BarkStation = 'prep' | 'oven' | 'counter';
/** What makes a head speak: its station's Lv 25/50/100, a rush combo, an attack on its shop, being Head of the Week. */
export type BarkTrigger = 'milestone' | 'rush' | 'attack' | 'week';

export const HEAD_BARKS = {
  /** A bubble stays up this long (s). */
  seconds: 2.5,
  /** Bubbles in one shop start at least this far apart (s). */
  gap: 20,
  /** When two things ask at once, the first in this list speaks. */
  priority: ['attack', 'milestone', 'week', 'rush'] as readonly BarkTrigger[],
  /** Rank pins: a head wears one per station level reached (TUNING.milestones), bronze, silver, gold. */
  rankLevels: [25, 50, 100] as readonly number[],
  rankColors: ['#C98B3C', '#C9CED4', '#FFC531'] as readonly string[],
  /** The Head of the Week is rolled with this salt on the week number. */
  seedSalt: 515,
} as const;

/** The daily-task kinds each station answers for: the Head of the Week's station has these tasks starred. */
export const STATION_TASKS: Readonly<Record<BarkStation, readonly string[]>> = {
  prep: ['upgrades', 'decor'],
  oven: ['baked', 'ovens'],
  counter: ['walkins', 'deliveries'],
};

export const BARKS: Record<NeighborhoodId, Record<BarkStation, Record<BarkTrigger, string>>> = {
  downtown: {
    prep: { milestone: 'Flour on the ceiling! Worth it!', rush: 'Dough’s flying! Duck, everybody!', attack: 'MegaSlice? I’ll roll ’em out flat!', week: 'Me? Head of the Week? Nonna, look!' },
    oven: { milestone: 'My oven. My fire. My record.', rush: 'Nobody touches the oven door but me!', attack: 'They want this oven? Over my ashes.', week: 'Zia Rosa will pretend not to be proud.' },
    counter: { milestone: 'Every regular, by name. And by topping.', rush: 'Mrs. Russo, the usual? Already rung up!', attack: 'MegaSlice doesn’t know anyone’s usual.', week: 'Head of the Week! Put it on my tab.' },
  },
  suburbs: {
    prep: { milestone: 'Labeled, sorted, done! Next bin!', rush: 'Sign-up sheet for toppings! Go, go!', attack: 'MegaSlice is not on the approved list.', week: 'I made myself a sticker. It’s laminated.' },
    oven: { milestone: 'A good fire is a patient fire, sport.', rush: 'Crank it up. Dad’s got this.', attack: 'Nobody tells Hank how to run a fire.', week: 'Head of the Week. Gonna tell the kids.' },
    counter: { milestone: 'Cool. Huge. I’m screaming inside.', rush: 'Line’s out the door. I’m thriving.', attack: 'MegaSlice? Yeah, no.', week: 'Head of the Week. Résumé material.' },
  },
  waterfront: {
    prep: { milestone: 'Square knot on every pie! Tied tight!', rush: 'All hands! Clove-hitch those orders!', attack: 'MegaSlice? Tie ’em up in a sheepshank!', week: 'Me? Knot bad. Knot bad at all.' },
    oven: { milestone: 'Seen hotter ovens. In a storm. Barely.', rush: 'Rough seas tonight. Keep her burning.', attack: 'Weathered worse than a pizza chain.', week: 'Head of the Week. Tell the gulls.' },
    counter: { milestone: 'Every order logged and docked.', rush: 'Hold your course! Single file!', attack: 'No MegaSlice vessel docks at my counter.', week: 'Harbor master of the week. Obviously.' },
  },
  university: {
    prep: { milestone: 'New record. Publishing my findings.', rush: 'Throughput maxed. Thesis: confirmed.', attack: 'MegaSlice dough fails peer review.', week: 'Adding this to my CV. Top of page.' },
    oven: { milestone: 'Right on temperature. As predicted.', rush: 'Heat’s up. Reaction’s accelerating!', attack: 'Ran tests on MegaSlice. Mostly glue.', week: 'Head of the Week. Reproducible results.' },
    counter: { milestone: 'Bro. BRO. We did that.', rush: 'Everybody gets a slice and a compliment!', attack: 'MegaSlice? Not at my counter, bro.', week: 'Head of the Week? Group hug. Everyone.' },
  },
  industrial: {
    prep: { milestone: 'Record shift. Break’s still at the bell.', rush: 'Rush or no rush, break’s on time.', attack: 'Filing a grievance against MegaSlice.', week: 'Head of the Week. Telling the union.' },
    oven: { milestone: '(Ox nods. The oven roars.)', rush: '(Ox lifts the whole crate. Gently.)', attack: '(Ox stands in the doorway. Arms folded.)', week: '(Ox blushes.) …Thanks.' },
    counter: { milestone: 'Look at you go, hon. Proud of ya.', rush: 'Line’s long, hon. Rita’s got it.', attack: 'MegaSlice, hon? Bless their hearts.', week: 'Head of the Week? Oh, stop it, hon.' },
  },
  uptown: {
    prep: { milestone: 'Magnifique. Despite the pepperoni.', rush: 'So many toppings. So little dignity.', attack: 'MegaSlice toppings should be illegal.', week: 'An honor. I will allow extra cheese.' },
    oven: { milestone: 'Flakier than a croissant. I said it.', rush: 'Faster than any soufflé. Allez!', attack: 'MegaSlice bakes in a toaster. Probably.', week: 'Pastry never gave me this. Merci.' },
    counter: { milestone: 'Another table delighted. As expected.', rush: 'Right this way. Your slice awaits.', attack: 'I’m sorry, MegaSlice has no reservation.', week: 'Head of the Week. I’ll alert the press.' },
  },
};

/** Nonna's six cameo lines (COPY section 8), told in turn every few minutes. */
export const CAMEO_NONNA_LINES: readonly string[] = [
  'Who folded these boxes? Is crooked.',
  'This oven runs hot. Good. Like mine.',
  'I’m not checking. I’m just… standing.',
  'More garlic. No, more. MORE.',
  'Eat! You look like a breadstick.',
  'The phone rings and rings. Is music.',
];

export const CAMEO = {
  /** The visitor says a line this often (s) while the boost runs, the first one after `firstAfter`. */
  everySeconds: 150,
  firstAfter: 8,
  /** The line stays up this long (s). */
  lineSeconds: 4,
} as const;
