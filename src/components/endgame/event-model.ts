// What the weekly events show, as plain data (v5.15): a countdown chip in the hour before, a banner while one runs.
// The rules are engine/features/events.ts (`eventView`); the words are the copy table. Pure: unit-tested in node.
import type { EventId } from '../../content/endgame';
import type { EventView } from '../../engine/features/events';
import { copy, speakerOf } from './copy-text';

/** The copy keys call the events `friday` and `gameday`. */
const COPY_EVENT: Record<EventId, 'friday' | 'gameday'> = { 'friday-rush': 'friday', 'game-day': 'gameday' };

/** "42m" while there are minutes left, "45s" in the last minute: the chip repaints once a minute, then once a second. */
export const eventTime = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds));
  return s >= 60 ? `${Math.ceil(s / 60)}m` : `${s}s`;
};

/** "Rush: 42m left": the chip in the hour before an event starts; '' while one runs or none is near (the chip is then not drawn). */
export function eventChipText(v: EventView | null): string {
  if (!v || v.active) return '';
  return copy(`rush.${COPY_EVENT[v.def.id]}.chip`, { time: eventTime(v.seconds) });
}

export interface EventBannerView {
  id: EventId;
  /** "Friday Night Rush!" */
  title: string;
  /** "x1.5": what the event does to the shops it covers. */
  mult: string;
  /** "1h 12m" left. */
  left: string;
  /** The character's start line, shown for the first moments of the banner. */
  start: string;
  speaker: string;
}

/** The banner while an event runs; null while it is only upcoming or none is near. */
export function eventBannerView(v: EventView | null): EventBannerView | null {
  if (!v || !v.active) return null;
  const k = COPY_EVENT[v.def.id];
  const m = Math.floor((v.seconds % 3600) / 60);
  const h = Math.floor(v.seconds / 3600);
  return {
    id: v.def.id,
    title: copy(`rush.${k}.banner`),
    mult: `×${v.def.mult}`,
    left: h > 0 ? `${h}h ${m}m` : `${Math.max(1, Math.ceil(v.seconds / 60))}m`,
    start: copy(`rush.${k}.start`),
    speaker: speakerOf(`rush.${k}.start`) ?? '',
  };
}

/** The start line stays up this long (ms) before the banner shrinks to its title. */
export const START_LINE_MS = 6000;
