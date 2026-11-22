/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';

import { PAID_BOOSTERS, PAID_SLOT_CAP } from '../../../content/rewards';
import * as G from '../../../engine/game';
import { buyBooster } from '../../../engine/paid-boost';
import { BOOSTER_LINES, BOOSTER_WORDS, boosterKey, boosterSection } from '../booster-model';
import { vanityViews } from '../shop-model';

const NOW = 1_700_000_000_000;
const takenOver = (diamonds: number): G.GameState => {
  const g = G.newGame(NOW);
  return { ...g, seenScenes: [...g.seenScenes, 'downtown-4'], rewards: { ...g.rewards, diamonds, lastSeen: NOW } };
};

/** The rows of docs/story/COPY-v5.23.md as key to the last cell (the text). */
function copyRows(): Record<string, string> {
  const md = fs.readFileSync(path.join(__dirname, '../../../../docs/story/COPY-v5.23.md'), 'utf8');
  const out: Record<string, string> = {};
  for (const line of md.split('\n'))
    if (line.startsWith('| `')) {
      const cells = line
        .replace(/^\||\|$/g, '')
        .split(' | ')
        .map((c) => c.trim());
      out[cells[0].replace(/`/g, '')] = cells[cells.length - 1];
    }
  return out;
}

describe('the Boosters tab, Buy section (card U5)', () => {
  test("three cards in the engine's order with name, 2×, duration, the line, the pace and the diamond price", () => {
    const { cards, running } = boosterSection(takenOver(500), NOW);
    expect(running).toBeNull();
    expect(cards.map((c) => c.id)).toEqual(PAID_BOOSTERS.map((b) => b.id));
    expect(cards.map((c) => c.price)).toEqual(PAID_BOOSTERS.map((b) => b.diamonds));
    expect(cards.map((c) => c.duration)).toEqual(['1 h', '4 h', '12 h']);
    for (const c of cards) {
      expect(c.mult).toBe('2×');
      expect(c.name).not.toBe(c.id);
      expect(c.desc).not.toBe('');
      expect(c.pace).toMatch(/^≈ \$\S+ at your shop's pace$/);
      expect(c.state).toBe('buy');
    }
  });

  test('short of diamonds: only the dearer cards are off', () => {
    const states = boosterSection(takenOver(50), NOW).cards.map((c) => c.state);
    expect(states).toEqual(['buy', 'poor', 'poor']);
  });

  test('a card short of diamonds says by how many (D565); one the player can pay says 0', () => {
    expect(boosterSection(takenOver(50), NOW).cards.map((c) => c.short)).toEqual([0, 40, 170]);
  });

  test('the key moves with the diamonds, the slot, the shown minute and the pace bucket, not with every tick (U39)', () => {
    const g = takenOver(100);
    const k = boosterKey(g, NOW);
    expect(boosterKey({ ...g, playSeconds: g.playSeconds + 1 }, NOW)).toBe(k);
    expect(boosterKey({ ...g, rewards: { ...g.rewards, diamonds: 101 } }, NOW)).not.toBe(k);
    expect(boosterKey({ ...g, playSeconds: g.playSeconds + 5 }, NOW)).not.toBe(k);
    const r = buyBooster(g, 'rush-hour', NOW);
    if (!r.ok) throw new Error('buy');
    expect(boosterKey(r.state, NOW + 1000)).toBe(boosterKey(r.state, NOW + 2000));
    expect(boosterKey(r.state, NOW + 61_000)).not.toBe(boosterKey(r.state, NOW + 1000));
  });

  test("before Nonna's takeover the cards are shown and the engine refuses (no tab or card is hidden)", () => {
    const g = G.newGame(NOW);
    const { cards } = boosterSection({ ...g, rewards: { ...g.rewards, diamonds: 999 } }, NOW);
    expect(cards).toHaveLength(3);
    expect(cards.every((c) => c.state === 'locked')).toBe(true);
  });

  test('a running slot shows booster.running with the time left; buying more adds to it', () => {
    const r = buyBooster(takenOver(500), 'rush-hour', NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = boosterSection(r.state, NOW + 60_000);
    expect(s.running).toBe('2× income running · 59 m left');
    expect(boosterSection(r.state, NOW + 3_600_000 + 1000).running).toBeNull();
  });

  test('a booster that would pass 24 h is full, and the refusal costs nothing', () => {
    let g = takenOver(2000);
    for (let i = 0; i < 2; i++) {
      const r = buyBooster(g, 'big-night', NOW);
      expect(r.ok).toBe(true);
      if (r.ok) g = r.state;
    }
    expect(PAID_SLOT_CAP).toBe(86_400);
    const { cards } = boosterSection(g, NOW);
    expect(cards.map((c) => c.state)).toEqual(['full', 'full', 'full']);
    const before = g.rewards.diamonds;
    expect(buyBooster(g, 'rush-hour', NOW).ok).toBe(false);
    expect(g.rewards.diamonds).toBe(before);
  });

  test('the words are the copy file (COPY-v5.23 §5, §6)', () => {
    const rows = copyRows();
    for (const w of Object.values(BOOSTER_WORDS)) {
      expect(rows[`booster.${w.key}.name`]).toBe(w.name);
      expect(rows[`booster.${w.key}.desc`]).toBe(w.desc);
    }
    expect(rows['booster.pace']).toBe(BOOSTER_LINES.pace);
    expect(rows['booster.running']).toBe(BOOSTER_LINES.running);
    expect(rows['booster.full']).toBe(BOOSTER_LINES.full);
    expect(rows['store.nudge']).toBe(BOOSTER_LINES.nudge);
    expect(rows['store.dot.label']).toBe(BOOSTER_LINES.dot);
  });
});

describe('the Style tab before the takeover (no tab is locked)', () => {
  test('the looks are listed on a fresh save, each short of diamonds', () => {
    const views = vanityViews(G.newGame(NOW));
    expect(views.length).toBeGreaterThanOrEqual(7);
    expect(views.filter((v) => v.state === 'poor').length).toBeGreaterThan(0);
  });
});
