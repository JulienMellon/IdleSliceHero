/// <reference types="jest" />
import { DAILY_CHESTS, GIFT_DAYS, VISITOR_LINES } from '../../content/rewards';
import * as G from '../../engine/game';
import { dayKey, refreshRewards, taskDone } from '../../engine/rewards';
import { NONNA_TAKEOVER } from '../../content/tuning';
import { boostChip, boosterLabel, boosterStartLabel, boostOnText, boostRingPct, boostedRate, boostSummary, chestRows, collectionText, compactSpan, countdownText, dailyRows, giftHeader, giftIcon, giftShort, giftText, giftTiles, hudBoostText, hudRateText, pointsPct, rewardsHud, spanText, visitCaption, weeklyChestView, weeklyRows } from '../rewards-model';

const NOW = new Date(2026, 9, 28, 13, 7, 41, 333).getTime(); // a Wednesday
const DAY = 86_400_000;
const NO_FLOAT = /\d\.\d{3,}/;

function base(): G.GameState {
  const s = G.newGame(NOW);
  const shops = { ...s.shops, downtown: { ...s.shops.downtown, prep: 22.37, ovens: 20, counter: 18, drivers: 14, managed: true } };
  const g = { ...s, shops, seenScenes: [NONNA_TAKEOVER.sceneId], cash: 3120.789, totalEarned: 15000.123456 };
  return refreshRewards(g, NOW);
}
const withR = (s: G.GameState, p: Partial<G.Rewards>): G.GameState => ({ ...s, rewards: { ...s.rewards, ...p } });
const strings = (x: unknown): string[] => (typeof x === 'string' ? [x] : Array.isArray(x) ? x.flatMap(strings) : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : []);

describe('time text', () => {
  test('spans use whole numbers of the two biggest units', () => {
    expect(spanText(5 * 3600 + 12 * 60 + 59.9)).toBe('5 h 12 m');
    expect(spanText(2 * 86400 + 4 * 3600 + 1)).toBe('2 d 4 h');
    expect(spanText(12 * 60)).toBe('12 m');
    expect(spanText(20)).toBe('<1 m');
    expect(countdownText(5 * 3600 + 12 * 60)).toBe('Resets in 5 h 12 m');
    expect(compactSpan(6 * 86400 + 23 * 3600)).toBe('6d23h');
  });
  test('boost chips', () => {
    expect(boostChip(2, 6 * 86400 + 23 * 3600 + 50)).toBe('2× · 6 d 23 h');
    expect(hudBoostText(2, 14 * 60 + 5)).toBe('2× 14m');
    expect(boosterLabel({ mult: 2, seconds: 900 })).toBe('2× 15m');
    expect(boosterLabel({ mult: 3, minutes: 30 })).toBe('3× 30m');
    expect(boosterStartLabel({ mult: 2, seconds: 900 })).toBe('Start 2× 15m');
    expect(boostOnText(600)).toBe('ON · 10 m left');
  });
  test('the draining ring is the time left over the smallest standard length', () => {
    expect(boostRingPct(900)).toBe(1);
    expect(boostRingPct(450)).toBe(0.5);
    expect(boostRingPct(1200)).toBeCloseTo(1200 / 1800);
    expect(boostRingPct(0)).toBe(0);
    expect(boostRingPct(NaN)).toBe(0);
  });
  test('G84: the HUD rate is the boosted rate', () => {
    expect(boostedRate(179, 2)).toBe(358);
    expect(boostedRate(179, 1)).toBe(179);
    expect(boostedRate(179, 0)).toBe(179);
    expect(hudRateText(179, 2)).toBe('$358/sec');
    expect(hudRateText(179, 1)).toBe('$179/sec');
  });
  test('boost summary adds the multipliers and counts down to the first end', () => {
    const s = withR(base(), { boosts: [{ mult: 2, until: NOW + 840_500, source: 'a' }, { mult: 2, until: NOW + 9e6, source: 'b' }] });
    expect(boostSummary(s, NOW)).toEqual({ mult: 3, seconds: 841 });
    expect(boostSummary(base(), NOW)).toBeNull();
  });
});

describe('rewardsHud (one gift status call)', () => {
  test('a new player: badge 0, gift ready and the calendar opens by itself, no boost', () => {
    const h = rewardsHud(base(), NOW);
    expect(h).toEqual({ badge: 0, giftDot: true, autoGift: true, boost: null, mult: 1 });
  });
  test('shown today: no auto-open but the dot stays', () => {
    const s = base();
    const h = rewardsHud(withR(s, { giftShownDay: dayKey(NOW) }), NOW);
    expect(h.autoGift).toBe(false);
    expect(h.giftDot).toBe(true);
  });
  test('a running boost gives its text and multiplier', () => {
    const s = withR(base(), { boosts: [{ mult: 2, until: NOW + 600_000, source: 'a' }], lastSeen: NOW - 1000 });
    const h = rewardsHud(s, NOW);
    expect(h.mult).toBe(2);
    expect(h.boost).toEqual({ mult: 2, seconds: 600, text: '2× 10m' });
  });
  test('locked rewards: nothing to show', () => {
    const s = { ...base(), seenScenes: [] };
    expect(rewardsHud(s, NOW)).toMatchObject({ badge: 0, giftDot: false, autoGift: false });
  });
  test('a clock behind lastSeen hides the badge and the auto-open', () => {
    const s = withR(base(), { lastSeen: NOW + 3600_000 });
    expect(rewardsHud(s, NOW)).toMatchObject({ badge: 0, autoGift: false });
  });
});

describe('task rows', () => {
  test('daily rows show progress, state and reward, with whole numbers', () => {
    let s = base();
    expect(s.rewards.daily).toHaveLength(5);
    const t0 = s.rewards.daily[0];
    s = withR(s, { daily: s.rewards.daily.map((t, i) => (i === 0 ? { ...t, target: 40, base: 0 } : i === 1 ? { ...t, claimed: true } : t)) });
    s = { ...s, stats: { ...s.stats, upgrades: 12.00004, walkins: 12.9, deliveries: 12.9, baked: 12.9 } };
    const rows = dailyRows(s);
    expect(rows).toHaveLength(5);
    expect(rows[1].state).toBe('claimed');
    expect(rows[1].pct).toBe(1);
    expect(rows[0].state).toBe(taskDone(s, s.rewards.daily[0]) ? 'ready' : 'todo');
    for (const r of rows) {
      expect(r.reward).toMatch(/^15 min income \(\$[\d.]+[KMBT]?\) · \+20 pts$/);
      expect(r.pct).toBeGreaterThanOrEqual(0);
      expect(r.pct).toBeLessThanOrEqual(1);
    }
    expect(t0.kind).toBeTruthy();
  });
  test('a finished task is ready and its bar is full', () => {
    let s = base();
    const t = s.rewards.daily[0];
    s = { ...s, stats: { ...s.stats, upgrades: 1e6, walkins: 1e6, deliveries: 1e6, baked: 1e6, hires: 1e6, decor: 1e6, offline: 1e6, boosters: 1e6 }, totalEarned: s.totalEarned + 1e9 };
    const r = dailyRows(s)[0];
    expect(r.state).toBe('ready');
    expect(r.pct).toBe(1);
    expect(t.claimed).toBe(false);
  });
  test('weekly rows name the diamonds per task', () => {
    const rows = weeklyRows(base());
    expect(rows).toHaveLength(7);
    expect(rows[0].reward).toMatch(/2 h income .* \+8 diamonds$/);
    expect(rows[1].reward).toMatch(/\+7 diamonds$/);
  });
  test('cash tasks show money on both sides', () => {
    let s = base();
    s = withR(s, { daily: [{ kind: 'earn', target: 5000, base: s.totalEarned - 1234.56789, claimed: false }] });
    const r = dailyRows(s)[0];
    expect(r.progress).toBe('$1.23K / $5K');
  });
});

describe('chests', () => {
  test('locked, ready, opened by points and flags', () => {
    let s = withR(base(), { points: 55.5, chests: [false, false, false] });
    expect(chestRows(s).map((c) => c.state)).toEqual(['ready', 'locked', 'locked']);
    s = withR(s, { points: 100, chests: [true, false, false] });
    expect(chestRows(s).map((c) => c.state)).toEqual(['opened', 'ready', 'ready']);
    expect(chestRows(s).map((c) => c.points)).toEqual(DAILY_CHESTS.map((c) => c.points));
    expect(chestRows(s)[2].label).toBe('10 diamonds + 2× 15m booster');
    expect(chestRows(s)[0].label).toBe('30 min income');
  });
  test('points bar clamps', () => {
    expect(pointsPct(withR(base(), { points: 50 }))).toBe(0.5);
    expect(pointsPct(withR(base(), { points: 500 }))).toBe(1);
  });
  test('weekly chest names the cosmetic', () => {
    let s = base();
    const v = weeklyChestView(s);
    expect(v.state).toBe('locked');
    expect(v.label).toContain(v.prize);
    s = withR(s, { weekly: s.rewards.weekly.map((t) => ({ ...t, claimed: true })) });
    expect(weeklyChestView(s).state).toBe('ready');
    s = withR(s, { weeklyChest: true });
    expect(weeklyChestView(s).label).toBe('Opened this week');
  });
  test('G85: the weekly chest names the cosmetic, or the fallback once all are owned', () => {
    const owned = ['oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold'];
    const v = weeklyChestView(base());
    expect(v.prize).toMatch(/^[A-Z][\w -]+$/);
    const all = weeklyChestView(withR(base(), { cosmetics: owned }));
    expect(all.prize).toBe('30 \u{1F48E} + 2 h income');
    expect(all.label).toBe("30 \u{1F48E} + 2 h income \u00B7 7 tasks to go");
  });
  test('collection line', () => {
    expect(collectionText(base())).toBe('Collection: empty. Open a weekly chest or reach day 28.');
    expect(collectionText(withR(base(), { cosmetics: ['oven-gold', 'storefront-skin-2'] }))).toBe('Collection: Gold oven, Storefront skin 2');
  });
});

describe('gift calendar', () => {
  const gift = (streak: number, lastDaysAgo: number, extra: Partial<G.Rewards['gift']> = {}) => withR(base(), { gift: { streak, last: dayKey(NOW - lastDaysAgo * DAY), saveUsed: false, cycle: 0, ...extra } });
  test('30 tiles, five milestones drawn big', () => {
    const t = giftTiles(base(), NOW);
    expect(t).toHaveLength(30);
    expect(t.filter((x) => x.big).map((x) => x.day)).toEqual([7, 14, 21, 28, 30]);
    expect(t.map((x) => x.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
  test('a new player: day 1 is today', () => {
    const t = giftTiles(base(), NOW);
    expect(t[0].state).toBe('today');
    expect(t.slice(1).every((x) => x.state === 'future')).toBe(true);
  });
  test('streak 6 claimed yesterday: day 7 is ready', () => {
    const s = gift(6, 1);
    const t = giftTiles(s, NOW);
    expect(t.filter((x) => x.state === 'claimed')).toHaveLength(6);
    expect(t[6].state).toBe('today');
    expect(giftHeader(s, NOW).title).toBe('Day 7 of 30');
    expect(giftHeader(s, NOW).prize).toBe('50 diamonds');
    expect(giftHeader(s, NOW).prizeIcon).toBe('gem');
  });
  test('claimed today: ticks through today, nothing to claim', () => {
    const t = giftTiles(gift(7, 0), NOW);
    expect(t.filter((x) => x.state === 'claimed')).toHaveLength(7);
    expect(t.some((x) => x.state === 'today')).toBe(false);
    expect(giftHeader(gift(7, 0), NOW).caption).toMatch(/^Claimed\. Next gift in \d+ h \d+ m$/);
  });
  test('a missed day shows the tile a repair would give', () => {
    const t = giftTiles(gift(6, 2), NOW);
    expect(t[6].state).toBe('missed');
    expect(t.filter((x) => x.state === 'claimed')).toHaveLength(6);
    expect(giftHeader(gift(6, 2), NOW).caption).toBe('Missed a day! Keep your streak for 20 \u{1F48E} (day 7: 50 \u{1F48E}).');
  });
  test('day 30 names the visitor of the cycle', () => {
    expect(giftHeader(gift(29, 1), NOW).title).toBe('Day 30 · Nonna Rosa visits');
    expect(giftHeader(gift(29, 1, { cycle: 1 }), NOW).title).toContain('Big Sal');
    const h = giftHeader(gift(29, 1), NOW);
    expect(h.caption).toBe(`Nonna Rosa drops by. \u201C${VISITOR_LINES.nonna}\u201D`);
    expect(h.caption).toBe(visitCaption('nonna'));
    expect(h.prize).toBe('2× income for 7 days · 300 diamonds · Gold oven');
    expect(h.prizeIcon).toBe('star');
  });
  test('gift text covers every kind', () => {
    expect(giftText(GIFT_DAYS[0])).toBe('30 min of income');
    expect(giftText(GIFT_DAYS[1])).toBe('2× 15m booster');
    expect(giftText(GIFT_DAYS[2])).toBe('5 diamonds');
    expect(giftText(GIFT_DAYS[13])).toBe('3 boosters · 2× 30m');
    expect(giftText(GIFT_DAYS[20])).toBe('2× income for 1 day');
    expect(giftText(GIFT_DAYS[27], 1)).toBe('Storefront skin 2');
    expect(GIFT_DAYS.every((g) => giftShort(g).length > 0 && giftShort(g).length <= 8)).toBe(true);
  });
  test('D386/S13: tiles carry an icon kind and a clear label', () => {
    const t = giftTiles(base(), NOW);
    expect(t[0]).toMatchObject({ icon: 'coin', label: '30 min' });
    expect(t[1]).toMatchObject({ icon: 'bolt', label: '15m' });
    expect(t[2]).toMatchObject({ icon: 'gem', label: '5' });
    expect(t[6]).toMatchObject({ icon: 'gem', label: '50', big: true });
    expect(t[13]).toMatchObject({ icon: 'bolt', label: '3 boosts' });
    expect(t[20]).toMatchObject({ icon: 'bolt', label: '1 day' });
    expect(t[27]).toMatchObject({ icon: 'star', label: 'Skin' });
    expect(t[29]).toMatchObject({ icon: 'star', label: 'Visit' });
    expect(giftIcon(GIFT_DAYS[29])).toBe('star');
  });
});

describe('no raw floats in any string', () => {
  test('fractional state', () => {
    let s = base();
    s = { ...s, cash: 123456.789123, totalEarned: 98765.4321987, stats: { ...s.stats, upgrades: 7.123456, walkins: 3.987654, deliveries: 9.55555, baked: 11.11111 } };
    s = withR(s, { points: 33.333333, boosts: [{ mult: 2, until: NOW + 123456.789, source: 'x' }], diamonds: 12.5, cosmetics: ['oven-gold'] });
    const all = [dailyRows(s), weeklyRows(s), chestRows(s), weeklyChestView(s), giftTiles(s, NOW), giftHeader(s, NOW), collectionText(s), boostSummary(s, NOW), boostChip(2, 123456.789), hudBoostText(2, 99.999), countdownText(12345.6789)];
    for (const x of strings(all)) expect([x, NO_FLOAT.test(x)]).toEqual([x, false]);
  });
});
