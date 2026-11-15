// C121 (v5.16): a hire scene is marked seen on load only for a save from before v6 (when the hire scenes came). A v6 save whose shop has
// just got its manager keeps the scene pending across a reload, so the player still meets the manager.
import * as G from '../game';

const withManager = (saveVersion: number) => {
  const g = G.newGame(1000);
  const raw = { ...g, saveVersion, seenScenes: ['suburbs-1'], shops: { ...g.shops, suburbs: { ...g.shops.suburbs, built: true, managed: true } } };
  return G.migrate(JSON.parse(JSON.stringify(raw)), 2000);
};

describe('migrate: hire scenes', () => {
  it('a v6 save keeps the hire scene pending on reload', () => {
    expect(withManager(6).seenScenes).not.toContain('suburbs-hire');
  });
  it('a save from before v6 with the manager already hired has met them', () => {
    expect(withManager(5).seenScenes).toContain('suburbs-hire');
  });
});
