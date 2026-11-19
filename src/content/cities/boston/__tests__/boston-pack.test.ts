// Boston's pack beyond the schema (card T2): the story's size and order, the numbers coming from the fit, the copy tables matching the data, and the
// interlude chain that holds each beat 4 (and Dorchester's beat 3) back. The schema itself is src/content/__tests__/city-schema.test.ts.
import '../../../../engine/features';
import { migrate } from '../../../../engine/game';
import { HEAD_KINDS } from '../../../tuning';
import { BOSTON_NUMBERS } from '../fit';
import { BOSTON_CITY } from '..';
import { BOSTON_IDS } from '../data';
import { BOSTON_BARKS, BOSTON_HEADS, BOSTON_LAYER_COPY, BOSTON_PERKS, BOSTON_RECIPES } from '../copy';

const scenes = BOSTON_CITY.scenes;
const byId = new Map(scenes.map((s) => [s.id, s]));

describe('the Boston story', () => {
  it('is the bridge, 24 main beats and 7 interludes, in play order', () => {
    expect(scenes).toHaveLength(32);
    expect(scenes.filter((s) => s.beat !== 'interlude')).toHaveLength(24);
    expect(scenes.filter((s) => s.beat === 'interlude').map((s) => s.id)).toEqual([
      'boston-0',
      'north-end-5',
      'southie-5',
      'back-bay-5',
      'fenway-5',
      'cambridge-5',
      'dorchester-5',
      'dorchester-6',
    ]);
    expect(scenes.map((s) => s.id)).toEqual([
      'boston-0',
      'north-end-1',
      'north-end-2',
      'north-end-3',
      'north-end-5',
      'north-end-4',
      'southie-1',
      'southie-2',
      'southie-3',
      'southie-5',
      'southie-4',
      'back-bay-1',
      'back-bay-2',
      'back-bay-3',
      'back-bay-5',
      'back-bay-4',
      'fenway-1',
      'fenway-2',
      'fenway-3',
      'fenway-5',
      'fenway-4',
      'cambridge-1',
      'cambridge-2',
      'cambridge-3',
      'cambridge-5',
      'cambridge-4',
      'dorchester-1',
      'dorchester-2',
      'dorchester-5',
      'dorchester-3',
      'dorchester-6',
      'dorchester-4',
    ]);
  });
  it('holds each beat 4 behind its interlude (and Dorchester beat 3 behind "Great News"), and each interlude plays after the beat it follows', () => {
    for (const h of BOSTON_IDS) {
      const four = byId.get(`${h}-4`)!;
      expect(four.trigger.kind).toBe('challenge');
      expect(four.requires).toEqual([h === 'dorchester' ? 'dorchester-6' : `${h}-5`]);
    }
    expect(byId.get('dorchester-3')!.requires).toEqual(['dorchester-5']);
    const after = (id: string) => byId.get(id)!.trigger as { kind: string; scene: string; seconds: number };
    expect(
      [
        after('north-end-5'),
        after('southie-5'),
        after('back-bay-5'),
        after('fenway-5'),
        after('cambridge-5'),
        after('dorchester-5'),
        after('dorchester-6'),
      ].map((t) => [t.scene, t.seconds]),
    ).toEqual([
      ['north-end-3', 300],
      ['southie-3', 300],
      ['back-bay-3', 300],
      ['fenway-3', 360],
      ['cambridge-3', 360],
      ['dorchester-2', 300],
      ['dorchester-3', 360],
    ]);
  });
  it('opens after the franchise (boston-0 first), every finale grants its perk, and only the last ends the city', () => {
    expect(byId.get('north-end-1')!.requires).toEqual(['boston-0']);
    for (const h of BOSTON_IDS) expect([h, byId.get(`${h}-4`)!.perk]).toEqual([h, true]);
    expect(scenes.filter((s) => s.reward === 'city-complete').map((s) => s.id)).toEqual(['dorchester-4']);
  });
});

describe('the Boston pack', () => {
  it('takes its prices and values from the fit, shop for shop', () => {
    BOSTON_CITY.neighbourhoods.forEach((n, i) => {
      expect([n.id, n.orderValue, n.buildCost, n.costMult, n.managerCost, n.headsCost]).toEqual([
        n.id,
        ...[BOSTON_NUMBERS.hoods[i]].map((h) => [h.orderValue, h.buildCost, h.costMult, h.managerCost, h.headsCost]).flat(),
      ]);
    });
    expect(BOSTON_CITY.fit.headCostFirst).toEqual(BOSTON_NUMBERS.headCostFirst);
    expect(BOSTON_CITY.fit.vehicles.slice(1).map((v) => v.cost)).toEqual(BOSTON_NUMBERS.vehicleCosts);
  });
  it('plays one layer kind per neighbourhood, the first none, and gives each neighbourhood a perk that applies to its own shop', () => {
    expect(BOSTON_IDS.map((h) => BOSTON_CITY.layers[h])).toEqual([null, 'stars', 'menu', 'gameDay', 'shifts', 'boats']);
    expect(Object.keys(BOSTON_CITY.perks)).toEqual([...BOSTON_IDS]);
  });
  it('has copy tables that match the script and the data: 24 recipe cards, 18 heads, 72 barks, 6 perks, and the layer strings', () => {
    expect(Object.keys(BOSTON_RECIPES)).toHaveLength(24);
    expect(Object.keys(BOSTON_PERKS)).toHaveLength(6);
    expect(Object.keys(BOSTON_HEADS)).toHaveLength(18);
    expect(Object.keys(BOSTON_BARKS)).toHaveLength(72);
    for (const h of BOSTON_IDS) {
      for (const k of HEAD_KINDS) {
        expect([h, k, BOSTON_HEADS[`head.${h}.${k}` as keyof typeof BOSTON_HEADS].name]).toEqual([h, k, BOSTON_CITY.heads[h][k]]);
        for (const n of [1, 2, 3, 4]) expect(typeof BOSTON_BARKS[`bark.${h}.${k}.${n}` as keyof typeof BOSTON_BARKS]).toBe('string');
      }
      for (const n of [1, 2, 3, 4]) expect(BOSTON_RECIPES[`recipe.${h}.${n}` as keyof typeof BOSTON_RECIPES].name.length).toBeGreaterThan(0);
    }
    for (const h of BOSTON_IDS) if (BOSTON_CITY.layers[h]) expect(Object.keys(BOSTON_LAYER_COPY).some((k) => k.startsWith(`layer.${h}.`))).toBe(true);
    expect(Object.keys(BOSTON_LAYER_COPY).some((k) => k.startsWith('layer.north-end.'))).toBe(true);
  });
});

// R7a: the pack moved its cast, numbers and teaser into its own files; none of it may change a save. `v5.18-save.json` is a Boston game (four shops built,
// 60 s played) as the v5.18 build wrote it, and `v5.18-loaded.json` is what that build's `migrate` made of it at 2026-11-11 12:01:30 local time.
describe('a v5.18 Boston save', () => {
  it('loads to the identical state', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const save = require('./fixtures/v5.18-save.json');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('./fixtures/v5.18-loaded.json');
    const now = new Date(2026, 10, 11, 12, 0, 0).getTime() + 90_000;
    expect(JSON.parse(JSON.stringify(migrate(save, now)))).toEqual(loaded);
  });
});
