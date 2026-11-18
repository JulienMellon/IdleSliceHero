import type { Scene } from '../../../types';
import { panel } from './kit';

// ───────────────────────────── FENWAY · Manny Ortiz ─────────────────────────────
// Text is docs/story/BOSTON-SCRIPT.md (card W3). Trigger counts are the home city's University numbers (card E3 fits Boston's own).
export const FENWAY_SCENES: Scene[] = [
  {
    id: 'fenway-1',
    city: 'boston',
    character: 'manny',
    neighborhood: 'fenway',
    beat: 1,
    title: 'Get Your Pizza Here',
    trigger: { kind: 'unlock', neighborhood: 'fenway' },
    panels: [
      panel('fenway', [], `Fenway. Brick walls, a ballpark at the end of the street, and somebody yelling.`, []),
      panel('fenway', [['manny', 'happy']], null, [
        ['Manny', `PIZZA HERE! Wait, that's your line now. Manny Ortiz. I sell peanuts at Old Kettle Park.`],
        ['Manny', `Been on that cart since before the scoreboard had lights.`],
      ], { cue: 'welcome' }),
      panel('fenway', [['manny', 'neutral']], null, [
        ['Manny', `Game days, the whole neighborhood floods in hungry. Then it floods out angry.`],
        ['You', `Angry?`],
        ['Manny', `The Chowderheads. We lose a lot. We lose with heart. But we lose.`],
      ]),
      panel('fenway', [['manny', 'happy']], null, [
        ['Manny', `The park's picking a new food vendor this season. Me and my cart are gonna bid.`],
        ['Manny', `Me, a cart and... say. You got any interest in a partner?`],
      ]),
    ],
  },
  {
    id: 'fenway-2',
    city: 'boston',
    character: 'manny',
    neighborhood: 'fenway',
    beat: 2,
    title: 'Peanuts and Pizza',
    trigger: { kind: 'deliveries', neighborhood: 'fenway', count: 30000 },
    panels: [
      panel('fenway', [['manny', 'surprised']], `Game day. Manny sells your pizza in the cheap seats. It's gone by the anthem.`, [
        ['Manny', `Gone! Sold out! I've never sold out of anything! Except patience!`],
      ]),
      panel('fenway', [['manny', 'happy']], null, [
        ['Manny', `And the Chowderheads scored! Fans say it's the pizza. I say it's the pizza!`],
      ]),
      panel('fenway', [['manny', 'sad']], null, [
        ['Manny', `Bad news. The park wants a big outfit. Trucks, logos, a mascot.`],
        ['Manny', `I've got a cart, a cap and a voice. I don't think "voice" goes on the form.`],
      ], { prop: 'clipboard' }),
    ],
  },
  {
    id: 'fenway-3',
    city: 'boston',
    character: 'manny',
    neighborhood: 'fenway',
    beat: 3,
    title: 'The Bid',
    trigger: { kind: 'deliveries', neighborhood: 'fenway', count: 135000 },
    panels: [
      panel('fenway', [['trish-vance', 'happy']], `Across from the ballpark, a MegaSlice opens. Name tag: PRESIDENT, BOSTON.`, [
        ['Trish', `Great news! MegaSlice is bidding on the ballpark. Our pizza tastes like winning.`],
      ], { prop: 'name-tag', propText: 'TRISH VANCE PRESIDENT, BOSTON' }),
      panel('fenway', [['manny', 'angry'], ['trish-vance', 'neutral']], null, [
        ['Trish', `I've never seen a game. Sports aren't my thing.`],
        ['Trish', `...Your shortstop drops his elbow on the swing, by the way.`],
        ['Manny', `Lady. How do you know that?`],
      ]),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'happy']], null, [
        ['Victor Crust', `Trish! Don't tell me. The ballpark is mine.`],
        ['Trish', `Great news, Victor. I've seen the bids.`],
        ['Victor Crust', `If only I'd had you instead of... Todd. See? I know it now. Too late.`],
      ], { prop: 'phone' }),
      panel('fenway', [['manny', 'neutral']], null, [
        ['Manny', `Park's board is tied. So the fans pick, game day. Loudest cheer wins.`],
        ['Manny', `So we feed every fan in the park. And then we make them LOUD.`],
      ]),
    ],
  },
  {
    id: 'fenway-5',
    city: 'boston',
    character: 'manny',
    neighborhood: 'fenway',
    beat: 'interlude',
    title: 'The Scorecard',
    trigger: { kind: 'after', neighborhood: 'fenway', scene: 'fenway-3', seconds: 360 },
    panels: [
      panel('fenway', [['manny', 'neutral'], ['trish-vance', 'neutral']], `Rain delay. Empty stands. Trish, alone in the cheap seats, keeping score in pencil.`, [
        ['Manny', `Nobody keeps score in pencil anymore. Just old-timers and their grandkids.`],
      ]),
      panel('fenway', [['manny', 'happy']], `In Manny's cart, an old photo: a woman in a big hat, yelling. A girl with a pencil.`, [
        ['Manny', `They came every Sunday. Split a hot dog. The kid kept score.`],
      ], { prop: 'photo' }),
      panel('fenway', [['manny', 'surprised'], ['trish-vance', 'sad']], null, [
        ['Trish', `Cute photo.`],
        ['Manny', `She draws a little star for every run. Just like that kid did.`],
      ]),
    ],
  },
  {
    id: 'fenway-4',
    city: 'boston',
    character: 'manny',
    neighborhood: 'fenway',
    beat: 4,
    title: 'Loudest Cheer',
    trigger: { kind: 'challenge', neighborhood: 'fenway' },
    requires: ['fenway-5'],
    perk: true,
    panels: [
      panel('fenway', [], `Game day. The vote. Across the street, the MegaSlice mascot has gone very quiet.`, []),
      panel('fenway', [['manny', 'surprised']], `MegaSlice gets polite clapping. Manny and Rosa's get a roar that shakes the bleachers.`, [
        ['Manny', `Is that for us? That's for US! I'm gonna need a bigger cap!`],
      ], { cue: 'triumph' }),
      panel('fenway', [['manny', 'happy']], `Bottom of the last inning. The Chowderheads win. Fans throw crusts like confetti.`, [
        ['Manny', `Contract's ours, partner! Fenway's yours! Every slice in the park is Rosa's!`],
        ['Manny', `And the Chowderheads won. I didn't know the scoreboard went that high.`],
      ]),
      panel('fenway', [['trish-vance', 'sad']], `In the emptied stands, Trish keeps score anyway. She draws a star for the Chowderheads.`, [], { prop: 'scorecard' }),
    ],
  },
];
