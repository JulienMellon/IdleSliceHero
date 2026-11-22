import { createGrantBus } from '../grant-bus';
import { GRANTS, PACK_SPLIT, emptyLedger, firstBuysUsed, grantKey, isConsumable, ownedFrom, parseLedger, redeem } from '../grants';
import { PRODUCT_IDS } from '../types';

describe('grants', () => {
  it('has a grant for every product', () => {
    for (const id of PRODUCT_IDS) expect(GRANTS[id]).toBeDefined();
  });

  it('starter pack gives the 24 h boost and the founder awning; Plus gives the entitlement; packs give diamonds', () => {
    expect(GRANTS.starter_pack.boost).toEqual({ mult: 2, hours: 24 });
    expect(GRANTS.starter_pack.cosmetic).toBe('awning-founder');
    expect(GRANTS.nonnas_plus.plus).toBe(true);
    expect([GRANTS.diamonds_80.diamonds, GRANTS.diamonds_500.diamonds, GRANTS.diamonds_1200.diamonds]).toEqual([80, 500, 1200]);
  });

  it('the Starter Pack pays 400 diamonds (PRICING-STRATEGY §3)', () => {
    expect(GRANTS.starter_pack.diamonds).toBe(400);
  });

  it('a pack is its base plus its bonus: 400 + 100 and 800 + 400', () => {
    expect(PACK_SPLIT.diamonds_500).toEqual({ base: 400, bonus: 100 });
    expect(PACK_SPLIT.diamonds_1200).toEqual({ base: 800, bonus: 400 });
    for (const id of PRODUCT_IDS.filter(isConsumable)) expect(PACK_SPLIT[id]!.base + PACK_SPLIT[id]!.bonus).toBe(GRANTS[id].diamonds);
  });

  it('a consumable pays once per transaction id, so a replay never pays diamonds twice', () => {
    const a = redeem(emptyLedger(), 'diamonds_80', 'tx1');
    expect(a.grant?.diamonds).toBe(160); // the first buy pays double
    const replay = redeem(a.ledger, 'diamonds_80', 'tx1');
    expect(replay.grant).toBeNull();
    const second = redeem(replay.ledger, 'diamonds_80', 'tx2');
    expect(second.grant?.diamonds).toBe(80);
  });

  it('the first paid-out buy of each pack pays its diamonds twice, once, and writes first:<id> to the ledger', () => {
    const a = redeem(emptyLedger(), 'diamonds_500', 'a');
    expect(a.grant).toMatchObject({ diamonds: 1000, firstBuy: true });
    expect(a.ledger.keys).toEqual(['tx:a', 'first:diamonds_500']);
    const b = redeem(a.ledger, 'diamonds_500', 'b');
    expect(b.grant?.diamonds).toBe(500);
    expect(b.grant?.firstBuy).toBeUndefined();
    // each pack has its own first buy
    expect(redeem(b.ledger, 'diamonds_1200', 'c').grant?.diamonds).toBe(2400);
    expect(firstBuysUsed(b.ledger)).toEqual(['diamonds_500']);
  });

  it('the Starter Pack and Plus are not paid double', () => {
    expect(redeem(emptyLedger(), 'starter_pack', 'x').grant?.diamonds).toBe(400);
    expect(redeem(emptyLedger(), 'nonnas_plus', 'x').ledger.keys).toEqual(['product:nonnas_plus']);
  });

  it('a duplicate transaction pays nothing, not even a second first buy', () => {
    const a = redeem(emptyLedger(), 'diamonds_80', 'tx1');
    const dup = redeem(a.ledger, 'diamonds_80', 'tx1');
    expect(dup.grant).toBeNull();
    expect(dup.ledger).toBe(a.ledger);
  });

  it('a restore never pays the double, and a first buy after it is still the first paid-out one', () => {
    const r = redeem(emptyLedger(), 'diamonds_1200', 'old', 'restore');
    expect(r.grant?.diamonds).toBe(1200);
    expect(r.grant?.firstBuy).toBeUndefined();
    // the first buy is spent by any paid-out purchase, so nothing doubles later
    expect(redeem(r.ledger, 'diamonds_1200', 'new').grant?.diamonds).toBe(1200);
  });

  it('a consumable with no transaction id pays nothing', () => {
    expect(redeem(emptyLedger(), 'diamonds_500', '').grant).toBeNull();
    expect(grantKey('diamonds_500', '')).toBeNull();
  });

  it('a non-consumable pays once whatever its transaction id', () => {
    const a = redeem(emptyLedger(), 'starter_pack', 'tx1');
    expect(a.grant?.diamonds).toBe(400);
    expect(redeem(a.ledger, 'starter_pack', 'tx-restored').grant).toBeNull();
    expect(ownedFrom(a.ledger)).toEqual(['starter_pack']);
  });

  it('a restore on a new device gives back the standing entitlements, not the spent diamonds and boost', () => {
    const r = redeem(emptyLedger(), 'starter_pack', '', 'restore');
    expect(r.grant).toEqual({ diamonds: 0, cosmetic: 'awning-founder' });
    expect(redeem(emptyLedger(), 'nonnas_plus', '', 'restore').grant?.plus).toBe(true);
    // a consumable is never restored, but a replayed one still pays by transaction
    expect(redeem(emptyLedger(), 'diamonds_80', 'tx9', 'restore').grant?.diamonds).toBe(80);
  });

  it('a redeemed grant is a copy: editing it leaves the table alone', () => {
    const g = redeem(emptyLedger(), 'diamonds_80', 'tx').grant!;
    g.diamonds = 1;
    expect(GRANTS.diamonds_80.diamonds).toBe(80);
  });

  it('classes the packs as consumable and the rest not', () => {
    expect(PRODUCT_IDS.filter(isConsumable)).toEqual(['diamonds_80', 'diamonds_500', 'diamonds_1200']);
  });

  it('survives a broken saved ledger', () => {
    expect(parseLedger(null).keys).toEqual([]);
    expect(parseLedger('{nope').keys).toEqual([]);
    expect(parseLedger('{"keys":["a",3]}').keys).toEqual(['a']);
  });

  it('the bus holds grants until the game listens, then delivers each once', () => {
    const bus = createGrantBus();
    bus.emit({ diamonds: 80 });
    const got: number[] = [];
    bus.subscribe((g) => got.push(g.diamonds));
    bus.emit({ diamonds: 500 });
    expect(got).toEqual([80, 500]);
    expect(bus.waiting()).toBe(0);
  });
});
