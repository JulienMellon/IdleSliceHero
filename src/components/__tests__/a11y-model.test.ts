/// <reference types="jest" />
// Step 3 (accessibility), behaviour: what a reader says for the main screen's models, what a cut-scene panel exposes, and the one Reduce Motion rule.
import { buyLabelText } from '../a11y-labels';
import { lotView } from '../city-model';
import { panelSpeech, panelText, sceneTexts } from '../cutscene/panel-speech';
import { drawerCards } from '../drawer-model';
import { motionPlan } from '../motion-model';
import { HOME_SCENES } from '../../content/scenes/home';
import { NEIGHBORHOODS } from '../../content/tuning';
import * as G from '../../engine/game';

const game = (cash: number): G.GameState => ({ ...G.newGame(0), cash });

describe('buy buttons', () => {
  it('say what they buy, the price and why they are off', () => {
    expect(buyLabelText('Prep', '$12', undefined, null)).toBe('Prep, $12');
    expect(buyLabelText('Prep', '$12', 'no gain now', 'need $4')).toBe('Prep, $12. no gain now. need $4');
    expect(buyLabelText(undefined, 'Collect', undefined, undefined)).toBe('Collect');
  });
});

describe('the main screen models, walked', () => {
  it.each([0, 1e12])('every drawer card has a name, a price or a reason and a detail a reader can say (cash %p)', (cash) => {
    const v = drawerCards({ game: game(cash), id: 'downtown' });
    const cards = [...v.cards, ...v.decor];
    expect(cards.length).toBeGreaterThan(10);
    for (const c of cards) {
      const label = buyLabelText(
        c.title,
        c.cost === null ? c.costLabel : (c.buyLabel ?? String(c.cost)),
        c.tone === 'nogain' ? 'no gain now' : undefined,
        null,
      );
      expect(c.title.trim()).not.toBe('');
      expect(c.detail.trim()).not.toBe('');
      expect(label.startsWith(c.title)).toBe(true);
      expect(label).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('every city row says its name and its state', () => {
    const g = game(0);
    for (const n of NEIGHBORHOODS) {
      const lot = lotView(g, n);
      const said = g.shops[n.id].built ? `${n.name}: built` : `${n.name}: ${lot.rowSub}${lot.rowRight ? `. ${lot.rowRight}` : ''}`;
      expect(said).not.toMatch(/undefined|NaN/);
      expect(said.length).toBeGreaterThan(n.name.length + 2);
    }
  });
});

describe('cut-scenes expose their lines as text', () => {
  it('every panel of every scene says something (a caption, a prop or a line)', () => {
    expect(HOME_SCENES.length).toBeGreaterThan(30);
    for (const scene of HOME_SCENES) {
      scene.panels.forEach((p, i) => {
        expect({ scene: scene.id, panel: i, text: panelText(p).trim().length > 0 }).toEqual({ scene: scene.id, panel: i, text: true });
      });
    }
  });

  it('a beat reads its speaker and its line; a caption comes first', () => {
    const p = {
      caption: 'Later that week',
      lines: [
        { speaker: 'Nonna Rosa', text: 'Ciao!' },
        { speaker: 'You', text: 'Hi.' },
      ],
    };
    expect(panelSpeech(p, 0)).toBe('Later that week. Nonna Rosa: Ciao!');
    expect(panelSpeech(p, 1)).toBe('Later that week. You: Hi.');
    expect(panelSpeech({ lines: [], propText: 'SOLD' }, 0)).toBe('Sign: SOLD');
  });

  it('a scene lists one text per panel', () => {
    for (const scene of HOME_SCENES) expect(sceneTexts(scene)).toHaveLength(scene.panels.length);
  });
});

describe('Reduce Motion', () => {
  it('turns coin flights, bursts, shakes, loops and slides off, and nothing else', () => {
    expect(motionPlan(true, true)).toEqual({ fly: false, burst: false, shake: false, loops: false, slide: false });
    expect(motionPlan(false, true)).toEqual({ fly: true, burst: true, shake: true, loops: true, slide: true });
  });

  it('the background stops the loops and nothing the player would see a moment later', () => {
    expect(motionPlan(false, false)).toEqual({ fly: true, burst: true, shake: true, loops: false, slide: true });
  });
});
