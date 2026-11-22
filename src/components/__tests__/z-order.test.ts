/// <reference types="jest" />
import { readFileSync } from 'fs';
import { join } from 'path';

import { Z, type ZLayer } from '../z-order';

const src = (p: string) => readFileSync(join(__dirname, '..', '..', p), 'utf8');

describe('the game screen stacking order (G118, D543, K5)', () => {
  it('runs HUD < coach < gift < night oven < SHEETS < offline popup < coins', () => {
    const order: ZLayer[] = ['hud', 'coach', 'gift', 'nightOven', 'sheets', 'offline', 'coins'];
    for (let i = 1; i < order.length; i++) expect(Z[order[i]]).toBeGreaterThan(Z[order[i - 1]]);
  });

  it('gives every layer its own value', () => {
    const v = Object.values(Z);
    expect(new Set(v).size).toBe(v.length);
  });

  it('keeps every layer above the scene area, which stays at 0', () => {
    for (const z of Object.values(Z)) expect(z).toBeGreaterThan(0);
  });

  it('is the only place a screen layer takes its zIndex from', () => {
    const index = src('app/index.tsx');
    expect(index).not.toMatch(/zIndex:\s*\d/);
    expect(index).toContain('Z.coach');
    expect(index).toContain('Z.gift');
    expect(index).toContain('Z.nightOven');
    expect(index).toContain('Z.sheets');
    expect(index).toContain('Z.offline');
    expect(index).toContain('Z.coins');
    expect(src('components/game-ui.tsx')).toMatch(/hud:\s*\{[^}]*zIndex: Z\.hud/);
  });
});
