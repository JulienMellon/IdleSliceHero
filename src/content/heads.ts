// Station heads' bark rules, the Head of the Week and the day-30 visitors' cameo (v5.15). Every number is here (the lines are each city's `barks`,
// the home city's in cities/home/voice.ts); the rules are in
// src/engine/features/heads.ts (barks, the week's pick) and src/components/scene/cameo.ts (the visitor in the shop).
// Strings come from docs/story/COPY-v5.15.md sections 2 and 8, by key: bark.<shop>.<station>.<trigger> and cameo.nonna.<n>
// (the symptom lines, v5.22: docs/story/COPY-v5.22.md, bark.<shop>.<station>.<trigger> and manager.<shop>.<trigger>).
import type { NeighborhoodId } from './types';

export type BarkStation = 'prep' | 'oven' | 'counter';
/**
 * What makes a head (or a manager) speak: its station's Lv 25/50/100, a rush combo, an attack on its shop, being Head of the Week, or, since v5.22, a
 * symptom of the shop that has held 10 s: a pile-up at the head's station (`pile`), idle hands at it (`idle`), a line at the door (`line`, the manager's)
 * or idle drivers (`drivers-idle`, the manager's). A symptom line describes; it never says what to buy.
 */
export type BarkTrigger = 'milestone' | 'rush' | 'attack' | 'week' | 'pile' | 'idle' | 'line' | 'drivers-idle';
/** The triggers that report the shop's state: spaced by `HEAD_BARKS.symptomGap`. */
export type SymptomTrigger = 'pile' | 'idle' | 'line' | 'drivers-idle';
export const SYMPTOM_TRIGGERS: readonly SymptomTrigger[] = ['pile', 'idle', 'line', 'drivers-idle'];
/** What the manager says about the shop, by shop (copy keys `manager.<shop>.<trigger>`; a missing line is silent). */
export type ManagerTrigger = 'line' | 'drivers-idle';
export type ManagerBarks = Partial<Record<NeighborhoodId, Partial<Record<ManagerTrigger, string>>>>;

export const HEAD_BARKS = {
  /** A bubble stays up this long (s). */
  seconds: 2.5,
  /** Bubbles in one shop start at least this far apart (s). */
  gap: 20,
  /** When two things ask at once, the first in this list speaks. */
  priority: ['attack', 'pile', 'line', 'drivers-idle', 'idle', 'milestone', 'week', 'rush'] as readonly BarkTrigger[],
  /** A symptom line is spoken at most this often in one shop (s), and this often once its state has held `symptomLongAfter` s. */
  symptomGap: 45,
  symptomGapLong: 30,
  symptomLongAfter: 120,
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
