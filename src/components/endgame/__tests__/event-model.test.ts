/// <reference types="jest" />
import '../../../engine/features'; // registers the features (A31)
import { eventView } from '../../../engine/features/events';
import { eventBannerView, eventChipText, eventTime, eventViewNow } from '../event-model';

const at = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s).getTime();
// Fri 2026-11-13 (Friday Night Rush 17:00-21:00), Sun 2026-11-15 (Big Game Day 13:00-16:00)
const FRI = (h: number, mi = 0, s = 0) => at(2026, 11, 13, h, mi, s);
const SUN = (h: number, mi = 0, s = 0) => at(2026, 11, 15, h, mi, s);

describe('the countdown chip: the hour before an event, nothing otherwise', () => {
  test('Friday: 30 minutes before the Rush', () => {
    expect(eventChipText(eventView(FRI(16, 30)))).toBe('Rush in 30m');
    expect(eventChipText(eventView(FRI(16, 0, 1)))).toBe('Rush in 60m');
    expect(eventChipText(eventView(FRI(16, 58, 30)))).toBe('Rush in 2m');
    expect(eventChipText(eventView(FRI(16, 59, 30)))).toBe('Rush in 30s');
    expect(eventChipText(eventView(FRI(16, 59, 50)))).toBe('Rush in 10s');
  });

  test('Sunday: the game', () => {
    expect(eventChipText(eventView(SUN(12, 15)))).toBe('Playoffs in 45m');
  });

  test('none more than an hour before, none while it runs, none after', () => {
    expect(eventChipText(eventView(FRI(15, 59)))).toBe('');
    expect(eventChipText(eventView(FRI(17)))).toBe('');
    expect(eventChipText(eventView(FRI(19)))).toBe('');
    expect(eventChipText(eventView(FRI(21)))).toBe('');
    expect(eventChipText(eventView(at(2026, 11, 12, 12)))).toBe('');
    expect(eventChipText(null)).toBe('');
  });

  test('the chip is short: one line for Rush, two at most for the playoffs', () => {
    for (const t of [FRI(16, 30), SUN(12, 15)]) {
      const text = eventChipText(eventView(t));
      expect(text.length).toBeLessThanOrEqual(20);
    }
  });
});

describe('the banner: only while an event runs', () => {
  test('Friday Night Rush with its multiplier and time left', () => {
    const b = eventBannerView(eventView(FRI(18, 48)))!;
    expect(b).toMatchObject({ id: 'friday-rush', title: 'Friday Night Rush!', mult: '×1.5', left: '2h 12m', speaker: 'Captain Marisol' });
    expect(b.start).toMatch(/Friday night, crew/);
  });

  test('Mudhens Playoff Rush (Sunday)', () => {
    const b = eventBannerView(eventView(SUN(15, 30)))!;
    expect(b).toMatchObject({ id: 'game-day', title: 'Mudhens Playoff Rush!', mult: '×2', left: '30m', speaker: 'Dale' });
  });

  test('nothing while upcoming, after, or on another day', () => {
    expect(eventBannerView(eventView(FRI(16, 30)))).toBeNull();
    expect(eventBannerView(eventView(FRI(21)))).toBeNull();
    expect(eventBannerView(eventView(at(2026, 11, 12, 18)))).toBeNull();
    expect(eventBannerView(null)).toBeNull();
  });
});

describe('time text', () => {
  test('minutes, then seconds in the last minute', () => {
    expect(eventTime(3600)).toBe('60m');
    expect(eventTime(61)).toBe('2m');
    expect(eventTime(60)).toBe('1m');
    expect(eventTime(59)).toBe('59s');
    expect(eventTime(0)).toBe('0s');
  });
});

describe('U14: one eventView per whole second', () => {
  test('the same answer within a second, a new one the next', () => {
    const t = FRI(16, 30);
    const a = eventViewNow(t + 100);
    expect(eventViewNow(t + 900)).toBe(a);
    expect(eventViewNow(t + 1100)).not.toBe(a);
    expect(eventChipText(eventViewNow(t + 1100))).toBe('Rush in 30m');
    expect(eventViewNow(at(2026, 11, 12, 12))).toBeNull();
  });
});
