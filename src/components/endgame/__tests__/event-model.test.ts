/// <reference types="jest" />
import '../../../engine/game';
import { eventView } from '../../../engine/features/events';
import { eventBannerView, eventChipText, eventTime } from '../event-model';

const at = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s).getTime();
// Fri 2026-11-13 (Friday Night Rush 17:00-21:00), Sun 2026-11-15 (Big Game Day 13:00-16:00)
const FRI = (h: number, mi = 0, s = 0) => at(2026, 11, 13, h, mi, s);
const SUN = (h: number, mi = 0, s = 0) => at(2026, 11, 15, h, mi, s);

describe('the countdown chip: the hour before an event, nothing otherwise', () => {
  test('Friday: 30 minutes before the Rush', () => {
    expect(eventChipText(eventView(FRI(16, 30)))).toBe('Rush: 30m left');
    expect(eventChipText(eventView(FRI(16, 0, 1)))).toBe('Rush: 60m left');
    expect(eventChipText(eventView(FRI(16, 58, 30)))).toBe('Rush: 2m left');
    expect(eventChipText(eventView(FRI(16, 59, 30)))).toBe('Rush: 30s left');
    expect(eventChipText(eventView(FRI(16, 59, 50)))).toBe('Rush: 10s left');
  });

  test('Sunday: the game', () => {
    expect(eventChipText(eventView(SUN(12, 15)))).toBe('Game: 45m left');
  });

  test('none more than an hour before, none while it runs, none after', () => {
    expect(eventChipText(eventView(FRI(15, 59)))).toBe('');
    expect(eventChipText(eventView(FRI(17)))).toBe('');
    expect(eventChipText(eventView(FRI(19)))).toBe('');
    expect(eventChipText(eventView(FRI(21)))).toBe('');
    expect(eventChipText(eventView(at(2026, 11, 12, 12)))).toBe('');
    expect(eventChipText(null)).toBe('');
  });

  test('the chip fits a 44 pt pill: two short lines', () => {
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

  test('Big Game Day', () => {
    const b = eventBannerView(eventView(SUN(15, 30)))!;
    expect(b).toMatchObject({ id: 'game-day', title: 'Big Game Day!', mult: '×2', left: '30m', speaker: 'Dale' });
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
