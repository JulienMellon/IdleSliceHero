import { createGrantBus } from '../grant-bus';
import { GRANTS, emptyLedger, grantKey, isConsumable, ownedFrom, parseLedger, redeem } from '../grants';
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

  it('a consumable pays once per transaction id, so a replay never pays diamonds twice', () => {
    const a = redeem(emptyLedger(), 'diamonds_80', 'tx1');
    expect(a.grant?.diamonds).toBe(80);
    const replay = redeem(a.ledger, 'diamonds_80', 'tx1');
    expect(replay.grant).toBeNull();
    const second = redeem(replay.ledger, 'diamonds_80', 'tx2');
    expect(second.grant?.diamonds).toBe(80);
  });

  it('a consumable with no transaction id pays nothing', () => {
    expect(redeem(emptyLedger(), 'diamonds_500', '').grant).toBeNull();
    expect(grantKey('diamonds_500', '')).toBeNull();
  });

  it('a non-consumable pays once whatever its transaction id', () => {
    const a = redeem(emptyLedger(), 'starter_pack', 'tx1');
    expect(a.grant?.diamonds).toBe(150);
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
