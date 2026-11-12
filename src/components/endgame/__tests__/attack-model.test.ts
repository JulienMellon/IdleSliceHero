/// <reference types="jest" />
import { COUNTERATTACK } from '../../../content/endgame';
import { NEIGHBORHOODS } from '../../../content/tuning';
import type { NeighborhoodId } from '../../../content/types';
import * as G from '../../../engine/game';
import { attackView, startChallenge } from '../../../engine/features/counterattack';
import { behindPace } from '../../order-model';
import { attackFace, attackLite, bannerView, barPct, barStep, behindChallenge, challengeView, resultView, retryText, weekLeftText, winDiamondsText } from '../attack-model';

const IDS = NEIGHBORHOODS.map((n) => n.id);
const at = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s).getTime();
const WED = at(2026, 11, 11, 12);
const MON = at(2026, 11, 16);
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
function city(): G.GameState {
  let g = G.newGame(WED);
  for (const id of IDS) g = withShop(g, id, { built: true, managed: true, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10, tables: 10, drivers: 5 });
  return { ...g, seenScenes: ['uptown-4'] };
}
const tick = (g: G.GameState, now: number, dt = 1) => G.playTick(g, dt, now);
const attacked = (): G.GameState => tick(tick(city(), WED), MON);
const defending = (g = attacked()): G.GameState => {
  const r = startChallenge(g, MON);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('which face the attack shows', () => {
  test('nothing before the first Monday', () => {
    const g = tick(city(), WED);
    expect(attackFace(attackView(g, WED))).toBe('none');
    expect(attackLite(g).face).toBe('none');
    expect(bannerView(attackView(g, WED))).toBeNull();
    expect(challengeView(attackView(g, WED))).toBeNull();
  });

  test('an open attack is the banner, naming the shop, with Victor’s line for that shop and a Defend button', () => {
    const g = attacked();
    const v = attackView(g, MON);
    const b = bannerView(v)!;
    expect(attackFace(v)).toBe('banner');
    expect(attackLite(g)).toMatchObject({ face: 'banner', shopId: v.shopId });
    expect(b.name).toBe(v.name);
    expect(b.title).toBe('MegaSlice is coming! Defend your shop.');
    expect(b.victor).toMatch(/\S/);
    expect(b).toMatchObject({ canDefend: true, button: 'Defend' });
  });

  test('a running challenge is the chip, and the banner is gone', () => {
    const g = defending();
    const v = attackView(g, MON);
    expect(attackFace(v)).toBe('running');
    expect(attackLite(g).face).toBe('running');
    expect(bannerView(v)).toBeNull();
    expect(challengeView(v)).not.toBeNull();
  });

  test('a lost challenge: the result first, then the banner waits for the retry', () => {
    let g = defending();
    g = tick(g, MON + 1000, COUNTERATTACK.challengeSeconds + 1);
    const v = attackView(g, MON + 1000);
    expect(attackFace(v)).toBe('lost');
    expect(resultView(v)).toMatchObject({ kind: 'lost' });
    expect(attackLite(g).face).toBe('lost');
  });
});

describe('the challenge chip', () => {
  test('pie count, bars in 5% steps, clock, reward', () => {
    let g = defending();
    const v0 = challengeView(attackView(g, MON))!;
    expect(v0).toMatchObject({ progress: expect.stringMatching(/^0 \/ [\d.]+K? pies$/), fillStep: 0, drainStep: 20, clock: '5:00', urgent: false, behind: false });
    const id = attackView(g, MON).shopId!;
    const target = attackView(g, MON).target;
    g = withShop(g, id, { sold: g.shops[id].sold + Math.ceil(target / 2) });
    const v1 = challengeView(attackView(tick(g, MON, 0.2), MON))!;
    expect(v1.fillStep).toBe(barStep(Math.ceil(target / 2) / target));
    expect(v1.fillStep % 1).toBe(0);
    expect(barPct(v1.fillStep) % 5).toBe(0);
  });

  test('the bars move in 5% steps only', () => {
    expect(barStep(0.02)).toBe(0);
    expect(barStep(0.03)).toBe(1);
    expect(barStep(1.7)).toBe(20);
    expect(barStep(-1)).toBe(0);
    expect(barStep(NaN)).toBe(0);
    expect(barPct(barStep(0.5))).toBe(50);
  });

  test('"tap to rush!" follows the orders’ pace rule on the challenge’s own clock', () => {
    const T = COUNTERATTACK.challengeSeconds;
    // behind at half the time used with a fifth sold, ahead with four fifths sold, the same as the order rule at the same share of time
    expect(behindChallenge(20, 100, T / 2)).toBe(true);
    expect(behindChallenge(80, 100, T / 2)).toBe(false);
    for (const [done, used] of [[0, 0.5], [30, 0.5], [60, 0.5], [95, 0.9], [10, 0.1]] as const) {
      const orderLeft = 120 * (1 - used);
      expect(behindChallenge(done, 100, T * (1 - used))).toBe(behindPace(done, 100, orderLeft));
    }
    expect(behindChallenge(0, 0, 10)).toBe(false);
  });

  test('the last 15 s are urgent', () => {
    let g = defending();
    g = tick(g, MON + 1000, COUNTERATTACK.challengeSeconds - 10);
    const v = challengeView(attackView(g, MON + 1000))!;
    expect(v.urgent).toBe(true);
    expect(v.clock).toBe('0:10');
    expect(v.drainStep).toBeLessThanOrEqual(1);
  });
});

describe('how it ends', () => {
  test('a win shows the shop’s character’s win line, the cash and the diamonds', () => {
    let g = defending();
    const v = attackView(g, MON);
    const id = v.shopId!;
    g = withShop(g, id, { sold: g.shops[id].sold + v.target + 5 });
    g = tick(g, MON + 1000, 0.2);
    const end = attackView(g, MON + 1000);
    expect(attackFace(end)).toBe('won');
    const r = resultView(end)!;
    expect(r.kind).toBe('won');
    expect(r.diamonds).toBe(COUNTERATTACK.rewardDiamonds);
    expect(r.cash).toBeGreaterThan(0);
    expect(r.line).toMatch(/\S/);
    expect(winDiamondsText(r.diamonds)).toBe('+15 diamonds');
  });

  test('every shop has a win and a lose line from its own character', () => {
    const lines = new Set<string>();
    for (const id of IDS) {
      for (const kind of ['won', 'lost'] as const) {
        const r = resultView({ ...attackView(attacked(), MON), news: kind === 'won' ? { kind, shopId: id, cash: 5, diamonds: 15 } : { kind, shopId: id } })!;
        expect(r.line).toMatch(/\S/);
        lines.add(r.line);
      }
    }
    expect(lines.size).toBe(12);
    expect(resultView({ ...attackView(attacked(), MON), news: { kind: 'won', shopId: 'suburbs', cash: 1, diamonds: 15 } })).toMatchObject({ speaker: 'Dale', who: 'dale' });
  });

  test('an attack that expired unpaid has no line to show', () => {
    expect(resultView({ ...attackView(attacked(), MON), news: { kind: 'expired', shopId: 'suburbs' } })).toBeNull();
  });
});

describe('time text', () => {
  test('the week left, and the retry wait', () => {
    expect(weekLeftText(2 * 86_400 + 4 * 3600 + 30)).toBe('2d 4h');
    expect(weekLeftText(5 * 3600 + 10 * 60)).toBe('5h 10m');
    expect(weekLeftText(42 * 60)).toBe('42m');
    expect(weekLeftText(10)).toBe('1m');
    expect(retryText(52 * 60)).toBe('Retry in 52m');
  });
});
