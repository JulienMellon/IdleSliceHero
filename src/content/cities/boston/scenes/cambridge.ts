import type { Scene } from '../../../types';
import { panel } from './kit';

// ───────────────────────────── CAMBRIDGE · Dr. Lena Ko ─────────────────────────────
// Text is docs/story/BOSTON-SCRIPT.md (card W3). Trigger counts are the home city's Industrial numbers (card E3 fits Boston's own).
export const CAMBRIDGE_SCENES: Scene[] = [
  {
    id: 'cambridge-1',
    city: 'boston',
    character: 'lena-ko',
    neighborhood: 'cambridge',
    beat: 1,
    title: 'Promising',
    trigger: { kind: 'unlock', neighborhood: 'cambridge' },
    panels: [
      panel('cambridge', [], `Cambridge. Brick labs, bike racks, and a loud BOOM from a basement window.`, []),
      panel('cambridge', [['lena-ko', 'happy']], `A woman climbs out of the smoke. Lab coat. No eyebrows.`, [
        ['Dr. Ko', `Dr. Lena Ko. Don't worry. That was a successful failure.`],
      ], { cue: 'welcome' }),
      panel('cambridge', [['lena-ko', 'neutral']], null, [
        ['Dr. Ko', `I'm building the perfect pizza oven. Perfect heat, perfect crust, perfect everything.`],
        ['You', `And the explosions?`],
        ['Dr. Ko', `Data. Very loud data.`],
      ]),
      panel('shop', [['lena-ko', 'neutral']], null, [
        ['Dr. Ko', `Lab crews work every shift. They eat whenever the experiments let them.`],
        ['Dr. Ko', `Lend me your oven. For science. I'll give it back. Mostly in its original shape.`],
      ]),
    ],
  },
  {
    id: 'cambridge-2',
    city: 'boston',
    character: 'lena-ko',
    neighborhood: 'cambridge',
    beat: 2,
    title: 'Tech Support',
    trigger: { kind: 'deliveries', neighborhood: 'cambridge', count: 100000 },
    panels: [
      panel('cambridge', [['lena-ko', 'sad']], `BOOM. Again. The dean has banned explosions on campus.`, [
        ['Dr. Ko', `No more booms on campus. So the experiment moves to your kitchen. Congratulations.`],
      ]),
      panel('shop', [['priya', 'happy'], ['lena-ko', 'surprised']], `Your kitchen. A familiar face at the back door, with a laptop and a team on screen.`, [
        ['Priya', `Hi! Priya. I lead a tech team now. I made them a list. It has tabs.`],
        ['Dr. Ko', `The drone girl. I read your code. It made me jealous.`],
      ]),
      panel('shop', [['priya', 'neutral'], ['lena-ko', 'neutral']], null, [
        ['Priya', `Your oven's code is perfect. Your oven's metal hates it.`],
        ['Dr. Ko', `Can you fix it?`],
        ['Priya', `Give me some time. And a fire extinguisher. Possibly several.`],
      ]),
    ],
  },
  {
    id: 'cambridge-3',
    city: 'boston',
    character: 'lena-ko',
    neighborhood: 'cambridge',
    beat: 3,
    title: 'Peer Review',
    trigger: { kind: 'deliveries', neighborhood: 'cambridge', count: 360000 },
    panels: [
      panel('cambridge', [['trish-vance', 'happy']], `Across from your shop, a MegaSlice opens. Name tag: PRESIDENT, NEW ENGLAND.`, [
        ['Trish', `Great news, Doctor. MegaSlice will fund your lab. All of it. Forever.`],
      ], { prop: 'name-tag', propText: 'TRISH VANCE PRES., NEW ENGLAND' }),
      panel('cambridge', [['lena-ko', 'neutral'], ['trish-vance', 'neutral']], null, [
        ['Trish', `We'd just own the oven. And the name. And you. Lightly.`],
        ['Dr. Ko', `I'll review it. Peer review. You won't enjoy my peers.`],
      ]),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'happy']], null, [
        ['Trish', `Great news, Victor. We have her oven plans. Every page.`],
        ['Victor Crust', `President of New England. Keep this up, Trish, and I'll make you my heir.`],
      ]),
      panel('shop', [['lena-ko', 'surprised']], `Across the street, a familiar BOOM. MegaSlice built ovens from Dr. Ko's old plans.`, [
        ['Dr. Ko', `They stole my old design. The one that explodes. ...They all explode.`],
        ['Dr. Ko', `Priya. We need the new one working before they blame us for theirs.`],
      ]),
    ],
  },
  {
    id: 'cambridge-5',
    city: 'boston',
    character: 'lena-ko',
    neighborhood: 'cambridge',
    beat: 'interlude',
    title: 'Lie Detector',
    trigger: { kind: 'after', neighborhood: 'cambridge', scene: 'cambridge-3', seconds: 360 },
    panels: [
      panel('shop', [['lena-ko', 'neutral'], ['trish-vance', 'neutral']], `After hours. Your kitchen. Dr. Ko has wired a thermometer to Trish's chair.`, [
        ['Dr. Ko', `Quick questions. For science. Is MegaSlice pizza good?`],
        ['Trish', `Delicious.`],
      ], { prop: 'thermometer' }),
      panel('shop', [['lena-ko', 'surprised'], ['trish-vance', 'neutral']], `The needle doesn't move. Not for the pizza, the profits or "never been to Boston."`, [
        ['Dr. Ko', `You're the steadiest liar I've ever measured. It's beautiful. Last question.`],
      ], { prop: 'thermometer' }),
      panel('shop', [['lena-ko', 'neutral'], ['trish-vance', 'sad']], null, [
        ['Dr. Ko', `Do you have family in Boston?`],
        ['Trish', `No.`],
      ], { prop: 'thermometer' }),
      panel('shop', [['lena-ko', 'happy']], `POP. The thermometer bursts. When Dr. Ko looks up, Trish's chair is empty.`, [
        ['Dr. Ko', `Off the chart. Then off the thermometer. Best data I've had all year.`],
      ], { prop: 'thermometer' }),
    ],
  },
  {
    id: 'cambridge-4',
    city: 'boston',
    character: 'lena-ko',
    neighborhood: 'cambridge',
    beat: 4,
    title: 'Perfect',
    trigger: { kind: 'challenge', neighborhood: 'cambridge' },
    requires: ['cambridge-5'],
    perk: true,
    panels: [
      panel('cambridge', [], `Across the street, the stolen ovens finally gave up. MegaSlice's windows are boarded.`, []),
      panel('shop', [['priya', 'happy'], ['lena-ko', 'neutral']], `Dr. Ko's oven, in your kitchen. Priya's code. Wren, holding an extinguisher.`, [
        ['Priya', `My team says it's ready. My team also says stand back.`],
        ['Dr. Ko', `Standing back is just good science.`],
      ]),
      panel('shop', [['lena-ko', 'surprised']], `Ding. No boom. A pizza slides out. It is perfect.`, [
        ['Dr. Ko', `It didn't explode. I don't know how to feel. I think I feel... hungry.`],
        ['Dr. Ko', `Cambridge is yours. The lab voted. I abstained so I could eat.`],
      ], { cue: 'triumph' }),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'sad']], null, [
        ['Trish', `Great news, Victor. Our ovens have... retired. With honors.`],
        ['Victor Crust', `Never mind ovens. Win me Dorchester, Trish, and the whole company is yours.`],
      ]),
    ],
  },
];
