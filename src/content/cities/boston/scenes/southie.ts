import type { Scene } from '../../../types';
import { panel } from './kit';

// ───────────────────────────── SOUTHIE · Kayla Dunn ─────────────────────────────
// Text is docs/story/BOSTON-SCRIPT.md (card W3). Trigger counts are the home city's Suburbs numbers (card E3 fits Boston's own).
export const SOUTHIE_SCENES: Scene[] = [
  {
    id: 'southie-1',
    city: 'boston',
    character: 'kayla-dunn',
    neighborhood: 'southie',
    beat: 1,
    title: 'Local Only',
    trigger: { kind: 'unlock', neighborhood: 'southie' },
    panels: [
      panel('southie', [], `Southie. Wooden houses, a cold sea wind, and a bar called Dunn's on the corner.`, []),
      panel('southie', [['kayla-dunn', 'neutral']], null, [
        ['Kayla Dunn', `Kayla Dunn. I run Dunn's. My dad ran Dunn's. His dad ran it into the ground.`],
        ['Kayla Dunn', `Both names, always. I hear you've already got a Kayla.`],
      ], { cue: 'welcome' }),
      panel('southie', [['kayla-dunn', 'angry']], null, [
        ['Kayla Dunn', `You're the pizza people? Where's your flour from?`],
        ['You', `A big warehouse. Somewhere. Far?`],
        ['Kayla Dunn', `"Somewhere far." Wrong answer. My bar serves food from here. From HERE.`],
      ]),
      panel('southie', [['kayla-dunn', 'neutral']], null, [
        ['Kayla Dunn', `Buy local and I'll put you on my menu. My regulars eat what I tell them.`],
        ['Kayla Dunn', `I rate everything on how local it is. Nobody passes. Not even my mother.`],
      ]),
    ],
  },
  {
    id: 'southie-2',
    city: 'boston',
    character: 'kayla-dunn',
    neighborhood: 'southie',
    beat: 2,
    title: 'Down the Street',
    trigger: { kind: 'deliveries', neighborhood: 'southie', count: 12430 },
    panels: [
      panel('southie', [['kayla-dunn', 'surprised']], `Kayla tastes your pizza. Then she reads the box. Then she reads the flour sack.`, [
        ['Kayla Dunn', `Huh. Closer to home than I figured. Who taught you this?`],
      ]),
      panel('southie', [['kayla-dunn', 'happy']], null, [
        ['Kayla Dunn', `You're on my menu. My regulars cleared the plate before I set it down.`],
        ['You', `So we passed the rating?`],
        ['Kayla Dunn', `Nobody passes. You're climbing. Keep climbing.`],
      ]),
      panel('southie', [['kayla-dunn', 'sad']], null, [
        ['Kayla Dunn', `Problem. My fish guy's selling his boat. My cheese lady's thinking about it.`],
        ['Kayla Dunn', `Nobody can beat cheap. If they go, I go. Dunn's doesn't serve "somewhere far."`],
      ]),
    ],
  },
  {
    id: 'southie-3',
    city: 'boston',
    character: 'kayla-dunn',
    neighborhood: 'southie',
    beat: 3,
    title: 'Locally Sourced',
    trigger: { kind: 'deliveries', neighborhood: 'southie', count: 28045 },
    panels: [
      panel('southie', [['trish-vance', 'happy']], `Across from Dunn's, a MegaSlice opens. Its sign: LOCALLY SOURCED. Name tag: SENIOR VP.`, [
        ['Trish', `Great news! MegaSlice is a local business now. We put "local" on the sign.`],
      ], { prop: 'name-tag', propText: 'TRISH VANCE SENIOR VP' }),
      panel('southie', [['kayla-dunn', 'angry'], ['trish-vance', 'neutral']], null, [
        ['Kayla Dunn', `Where's your cheese from?`],
        ['Trish', `Right here. Locally. In the truck. Which is parked locally.`],
        ['Kayla Dunn', `And yesterday it was parked in another state.`],
      ]),
      panel('megaslice-hq', [['victor-crust', 'happy'], ['trish-vance', 'happy']], null, [
        ['Trish', `Great news, Victor. Southie loves us. The bartender gave us a hug.`],
        ['Victor Crust', `Senior VP, and still winning. Trish, you make me feel things. Mostly greed.`],
      ]),
      panel('southie', [['kayla-dunn', 'neutral']], null, [
        ['Kayla Dunn', `My fish guy took her deal. Said he had no choice.`],
        ['Kayla Dunn', `So we give him one. Buy local. Buy a LOT of local. Starting now.`],
      ]),
    ],
  },
  {
    id: 'southie-5',
    city: 'boston',
    character: 'kayla-dunn',
    neighborhood: 'southie',
    beat: 'interlude',
    title: 'Last Call',
    trigger: { kind: 'after', neighborhood: 'southie', scene: 'southie-3', seconds: 300 },
    panels: [
      panel('southie', [['kayla-dunn', 'neutral'], ['trish-vance', 'neutral']], `Closing time at Dunn's. The last customer wears a MegaSlice blazer.`, [
        ['Trish', `Ginger ale. Extra cherries. Stirred with a pretzel.`],
      ]),
      panel('southie', [['kayla-dunn', 'surprised'], ['trish-vance', 'neutral']], null, [
        ['Kayla Dunn', `That's a kid's order. A church-supper kid's order. From around here.`],
        ['Trish', `Never been. I'm from out of town. Wicked far out of town.`],
      ]),
      panel('southie', [['kayla-dunn', 'neutral']], `Trish pays, tips well, and leaves the pretzel chewed to a stub.`, [
        ['Kayla Dunn', `Out-of-towners don't say "wicked." Not like that. Not with the cherries.`],
      ]),
    ],
  },
  {
    id: 'southie-4',
    city: 'boston',
    character: 'kayla-dunn',
    neighborhood: 'southie',
    beat: 4,
    title: 'Kayla Local',
    trigger: { kind: 'challenge', neighborhood: 'southie' },
    requires: ['southie-5'],
    perk: true,
    panels: [
      panel('southie', [], `Across from Dunn's, the LOCALLY SOURCED sign comes down. Underneath, it says SHIPPED IN.`, []),
      panel('southie', [['kayla-dunn', 'happy']], `Your pizza is at the top of Dunn's menu now. In pen.`, [
        ['Kayla Dunn', `My fish guy bought his boat back. My cheese lady hired her cousin.`],
        ['Kayla Dunn', `You did that. With pizza. I don't say this. Thank you.`],
      ], { cue: 'triumph' }),
      panel('southie', [['kayla-dunn', 'happy']], null, [
        ['Kayla Dunn', `Most local thing on my menu. My mother's furious.`],
        ['Kayla Dunn', `Southie's yours. We don't say that to outsiders. You're not an outsider.`],
      ]),
      panel('southie', [['kayla-dunn', 'neutral']], `Closing time. On the end stool: a pretzel chewed to a stub, and a very big tip.`, [
        ['Kayla Dunn', `If she's from out of town, I'm from Back Bay.`],
      ], { prop: 'pretzel' }),
    ],
  },
];
