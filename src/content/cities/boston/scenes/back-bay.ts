import type { Scene } from '../../../types';
import { panel } from './kit';

// ───────────────────────────── BACK BAY · Preston Whitmore III ─────────────────────────────
// Text is docs/story/BOSTON-SCRIPT.md (card W3). Trigger counts are the home city's Waterfront numbers (card E3 fits Boston's own).
export const BACK_BAY_SCENES: Scene[] = [
  {
    id: 'back-bay-1',
    city: 'boston',
    character: 'preston',
    neighborhood: 'back-bay',
    beat: 1,
    title: 'Old Money',
    trigger: { kind: 'unlock', neighborhood: 'back-bay' },
    panels: [
      panel('back-bay', [], `Back Bay. Brownstones, gas lamps, and doormen who judge your shoes.`, []),
      panel('back-bay', [['preston', 'neutral']], null, [
        ['Preston', `Preston Whitmore III. Of the Whitmores. We own a great deal of this street.`],
        ['Preston', `Mother sent me to inspect your establishment. She expects me to disapprove.`],
      ], { cue: 'welcome' }),
      panel('shop', [['preston', 'surprised']], `Preston watches the dough fly. He forgets to blink.`, [
        ['Preston', `Is it... supposed to do that? Is that allowed?`],
      ]),
      panel('shop', [['preston', 'neutral']], null, [
        ['Preston', `A pizza, please. For Mother. I shall report that it was dreadful.`],
        ['Preston', `And another. For... a friend. Me. Could you put it in a briefcase?`],
      ]),
    ],
  },
  {
    id: 'back-bay-2',
    city: 'boston',
    character: 'preston',
    neighborhood: 'back-bay',
    beat: 2,
    title: 'The Borrowed Apron',
    trigger: { kind: 'deliveries', neighborhood: 'back-bay', count: 3000 },
    panels: [
      panel('shop', [['preston', 'surprised']], `Midnight. Your back door. Preston, in a tuxedo and a borrowed apron.`, [
        ['Preston', `A confession. I've been watching your cooks. Through the window. With opera glasses.`],
      ], { prop: 'apron' }),
      panel('shop', [['preston', 'happy']], null, [
        ['Preston', `I want to make pizza. Not own it. Not invest in it. MAKE it. With my hands.`],
        ['You', `So make it. The kitchen's right there.`],
      ]),
      panel('shop', [['preston', 'sad']], `His pizza is shaped like a map of somewhere nobody would visit.`, [
        ['Preston', `Mother says Whitmores don't cook. Whitmores have people who cook.`],
        ['Preston', `If she finds out, she'll sell the building. Your building. She owns it.`],
      ]),
    ],
  },
  {
    id: 'back-bay-3',
    city: 'boston',
    character: 'preston',
    neighborhood: 'back-bay',
    beat: 3,
    title: 'The Tasting Menu',
    trigger: { kind: 'deliveries', neighborhood: 'back-bay', count: 15000 },
    panels: [
      panel('back-bay', [['trish-vance', 'happy']], `Across the avenue, a MegaSlice opens. Tablecloths. Candles. Name tag: EXECUTIVE VP.`, [
        ['Trish', `Great news! MegaSlice Reserve. Same pizza, smaller, with a candle. The candle is extra.`],
      ], { prop: 'name-tag', propText: 'TRISH VANCE · EXECUTIVE VP' }),
      panel('back-bay', [['preston', 'surprised'], ['trish-vance', 'neutral']], null, [
        ['Trish', `Your mother adores us. And she'd adore a Whitmore chef. Our head chef.`],
        ['Preston', `You'd let me cook?`],
        ['Trish', `Of course. Sign here. And here. And here.`],
      ]),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'happy']], null, [
        ['Trish', `Great news, Victor. The heir signed. We own Back Bay's favorite son.`],
        ['Victor Crust', `Executive VP Trish Vance. It sounds so right. Like a cash register.`],
      ]),
      panel('shop', [['preston', 'sad']], `The small print: "Chef" means "the face on the box." No cooking. Ever.`, [
        ['Preston', `She lied. Beautifully. I didn't know people could lie with such good posture.`],
        ['Preston', `I signed my name. I didn't sign my hands. Teach me faster.`],
      ], { prop: 'contract' }),
    ],
  },
  {
    id: 'back-bay-5',
    city: 'boston',
    character: 'preston',
    neighborhood: 'back-bay',
    beat: 'interlude',
    title: 'The Seaview Vances',
    trigger: { kind: 'after', neighborhood: 'back-bay', scene: 'back-bay-3', seconds: 300 },
    panels: [
      panel('back-bay', [['preston', 'neutral'], ['trish-vance', 'happy']], `A charity gala. Trish works the room. Preston hides behind the canapés.`, [
        ['Trish', `Patricia Vance. Of the Seaview Vances. Old money. Very old. Practically fossils.`],
      ]),
      panel('back-bay', [['preston', 'surprised'], ['trish-vance', 'neutral']], null, [
        ['Preston', `There are no Seaview Vances. Mother keeps a list. It's alphabetical. And laminated.`],
        ['Trish', `We're new old money.`],
      ]),
      panel('back-bay', [['preston', 'neutral']], `Trish leaves early. She takes the bus. She doesn't check which one.`, [
        ['Preston', `She knew the bus to Dorchester by heart. Old money doesn't know any bus.`],
      ]),
    ],
  },
  {
    id: 'back-bay-4',
    city: 'boston',
    character: 'preston',
    neighborhood: 'back-bay',
    beat: 4,
    title: 'Chef Whitmore',
    trigger: { kind: 'challenge', neighborhood: 'back-bay' },
    requires: ['back-bay-5'],
    perk: true,
    panels: [
      panel('back-bay', [], `Across the avenue, MegaSlice Reserve blows out its candles for good.`, []),
      panel('shop', [['preston', 'happy']], `Preston's pizza: round. Mostly. The whole avenue is lined up for it.`, [
        ['Preston', `It's round! Hollis, look! Round-ish! Write to the papers!`],
      ], { prop: 'apron', cue: 'triumph' }),
      panel('back-bay', [['preston', 'surprised']], `Mother tastes it. The avenue holds its breath.`, [
        ['Preston', `She said "acceptable." She has never said "acceptable" about anything.`],
        ['Preston', `Mother says Back Bay may keep you. That's Whitmore for "we love you."`],
      ]),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'neutral']], null, [
        ['Trish', `Great news. We released the heir. He wasn't a culture fit. Too much flour.`],
        ['Victor Crust', `Ruthless. I love it. Promote her. Make up a title if you have to.`],
      ]),
    ],
  },
];
