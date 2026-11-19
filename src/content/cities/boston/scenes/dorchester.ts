import type { Scene } from '../../../types';
import { panel } from './kit';

// ───────────────────────────── DORCHESTER · Grandma Bea ─────────────────────────────
// Text is docs/story/BOSTON-SCRIPT.md (card W3). Trigger counts are the home city's Uptown numbers (card E3 fits Boston's own).
// Two interludes: "Great News" holds back dorchester-3, "Pots" holds back dorchester-4 (the Trish reveal, then the speakerphone finale).
export const DORCHESTER_SCENES: Scene[] = [
  {
    id: 'dorchester-1',
    city: 'boston',
    character: 'grandma-bea',
    neighborhood: 'dorchester',
    beat: 1,
    title: 'Church Supper',
    trigger: { kind: 'unlock', neighborhood: 'dorchester' },
    panels: [
      panel('dorchester', [], `Dorchester. Porches, church bells, and a basement hall that smells like gravy.`, []),
      panel(
        'dorchester',
        [['grandma-bea', 'neutral']],
        null,
        [
          ['Grandma Bea', `You're the new pizza place? I'm Bea. Everybody's grandma. Sit. You look thin.`],
          ['Grandma Bea', `I run the church supper and the pantry shelf. Nobody on my street goes hungry.`],
        ],
        { cue: 'welcome' },
      ),
      panel('dorchester', [['grandma-bea', 'surprised']], `Bea reads the name on your apron. She goes very still.`, [
        ['Grandma Bea', `Rosa's. Not Rosa from Port Marinara. Not Rosa with the sauce.`],
        ['You', `You know Nonna Rosa?`],
      ]),
      panel('dorchester', [['grandma-bea', 'angry']], null, [
        ['Grandma Bea', `Know her? Sweetheart, I've hated that woman since before you were born.`],
        ['Grandma Bea', `You tell her Bea says hello. And that she cheated. She'll know.`],
      ]),
    ],
  },
  {
    id: 'dorchester-2',
    city: 'boston',
    character: 'grandma-bea',
    neighborhood: 'dorchester',
    beat: 2,
    title: 'Half a Ladle',
    trigger: { kind: 'deliveries', neighborhood: 'dorchester', count: 200000 },
    panels: [
      panel(
        'dorchester',
        [['grandma-bea', 'sad']],
        `The supper list gets longer every Sunday. The pantry shelf gets emptier.`,
        [['Grandma Bea', `More families every week. I cook till my arms quit. It's still not enough.`]],
        { prop: 'pantry-shelf' },
      ),
      panel(
        'dorchester',
        [
          ['nonna-rosa', 'neutral'],
          ['grandma-bea', 'surprised'],
        ],
        `The hall door opens. A small woman, a big suitcase. It smells like garlic.`,
        [
          ['Nonna Rosa', `The bus was full. So: an airplane. Modern idea. I hated it. Hello, Beatrice.`],
          ['Grandma Bea', `Rosa.`],
        ],
      ),
      panel(
        'dorchester',
        [
          ['nonna-rosa', 'angry'],
          ['grandma-bea', 'angry'],
        ],
        `Each pulls half of a golden ladle from her purse.`,
        [
          ['Grandma Bea', `The judges called it a tie. Everybody knows you cheated.`],
          ['Nonna Rosa', `And everybody knows you cried on the stage.`],
        ],
        { prop: 'half-ladle' },
      ),
      panel(
        'dorchester',
        [
          ['nonna-rosa', 'neutral'],
          ['grandma-bea', 'neutral'],
        ],
        null,
        [
          ['Nonna Rosa', `Your shelf is empty, Beatrice. I see it. I'm old, not blind.`],
          ['Grandma Bea', `I don't need your help. ...How much sauce did you bring?`],
        ],
      ),
    ],
  },
  {
    id: 'dorchester-5',
    city: 'boston',
    character: 'grandma-bea',
    neighborhood: 'dorchester',
    beat: 'interlude',
    title: 'Great News',
    trigger: { kind: 'after', neighborhood: 'dorchester', scene: 'dorchester-2', seconds: 300 },
    panels: [
      panel(
        'dorchester',
        [['grandma-bea', 'surprised']],
        `Bea's phone buzzes. A tomato. A crying face. Another tomato.`,
        [
          ['Grandma Bea', `Rosa went home, and now she texts me vegetables. What does it mean?`],
          ['You', `I think she misses you.`],
        ],
        { prop: 'phone' },
      ),
      panel(
        'dorchester',
        [['grandma-bea', 'neutral']],
        `On Bea's fridge: an old ballpark scorecard, in pencil. A little star for every run.`,
        [
          ['Grandma Bea', `My granddaughter's. Washed my pots every Sunday. Now she's a big shot.`],
          ['Grandma Bea', `Never calls. Sends money and signs it "P." Like I don't know my own grandbaby.`],
        ],
        { prop: 'scorecard' },
      ),
      panel('dorchester', [['grandma-bea', 'sad']], null, [
        ['Grandma Bea', `Funny kid. Everything was "great news." Broke a plate? Great news.`],
        ['Grandma Bea', `The worse it got, the bigger she smiled. Wonder who she's smiling at now.`],
      ]),
    ],
  },
  {
    id: 'dorchester-3',
    city: 'boston',
    character: 'grandma-bea',
    neighborhood: 'dorchester',
    beat: 3,
    title: 'Patricia',
    trigger: { kind: 'deliveries', neighborhood: 'dorchester', count: 625000 },
    requires: ['dorchester-5'],
    panels: [
      panel(
        'dorchester',
        [['trish-vance', 'happy']],
        `Across from the church hall, a MegaSlice opens. Name tag: TRISH VANCE, HEIR APPARENT.`,
        [['Trish', `Great news, Dorchester! MegaSlice is donating to your pantry. Coupons! So many coupons!`]],
        { prop: 'name-tag', propText: 'TRISH VANCE HEIR APPARENT' },
      ),
      panel(
        'dorchester',
        [
          ['grandma-bea', 'surprised'],
          ['trish-vance', 'surprised'],
        ],
        `Bea comes out of the hall holding a ladle. Trish stops smiling.`,
        [
          ['Grandma Bea', `Patricia Anne Vance.`],
          ['Trish', `I'm sorry, ma'am. Have we met?`],
        ],
      ),
      panel(
        'dorchester',
        [
          ['grandma-bea', 'angry'],
          ['trish-vance', 'sad'],
        ],
        null,
        [
          ['Grandma Bea', `"Have we met." I taught you to hold a spoon. Coupons don't feed anybody.`],
          ['Trish', `I'm not from here. I've never been to Dorchester.`],
          ['Grandma Bea', `You can lie to the whole world, kid. You never could lie to me.`],
        ],
      ),
      panel(
        'megaslice-hq',
        [
          ['victor-crust', 'happy'],
          ['trish-vance', 'sad'],
        ],
        null,
        [
          ['Victor Crust', `Trish! My heir! Tell me Dorchester is ours. I'll announce it on Sunday.`],
          ['Trish', `...Great news, Victor.`],
        ],
      ),
    ],
  },
  {
    id: 'dorchester-6',
    city: 'boston',
    character: 'grandma-bea',
    neighborhood: 'dorchester',
    beat: 'interlude',
    title: 'Pots',
    trigger: { kind: 'after', neighborhood: 'dorchester', scene: 'dorchester-3', seconds: 360 },
    panels: [
      panel(
        'dorchester',
        [
          ['grandma-bea', 'neutral'],
          ['trish-vance', 'sad'],
        ],
        `Late. The church kitchen. Bea washes pots. Trish slips in the back door, like old times.`,
        [['Grandma Bea', `Towel's on the hook. Same hook.`]],
      ),
      panel(
        'dorchester',
        [
          ['grandma-bea', 'neutral'],
          ['trish-vance', 'sad'],
        ],
        `They dry pots for a long time. Nobody says anything. Then Trish does.`,
        [
          ['Trish', `I lie for a living, Nana. I'm the best they've got. They keep promoting me.`],
          ['Trish', `I told Victor I'd won Boston. Every neighborhood. He believes me.`],
        ],
      ),
      panel(
        'dorchester',
        [
          ['grandma-bea', 'sad'],
          ['trish-vance', 'sad'],
        ],
        null,
        [
          ['Grandma Bea', `And did you?`],
          ['Trish', `...No. They chose the pizza place. Every time.`],
          ['Grandma Bea', `Then Sunday, you tell him the truth. Or I will. I've got a loud voice and a phone.`],
        ],
      ),
    ],
  },
  {
    id: 'dorchester-4',
    city: 'boston',
    character: 'grandma-bea',
    neighborhood: 'dorchester',
    beat: 4,
    title: 'Supper for Everyone',
    trigger: { kind: 'challenge', neighborhood: 'dorchester' },
    requires: ['dorchester-6'],
    reward: 'city-complete',
    perk: true,
    panels: [
      panel('dorchester', [], `Sunday supper. Every table full. Every shelf stocked. Across the street: dark.`, []),
      panel(
        'dorchester',
        [
          ['grandma-bea', 'happy'],
          ['nonna-rosa', 'happy'],
        ],
        `Rosa flew back for supper. Her half of the ladle meets Bea's.`,
        [
          ['Nonna Rosa', `Fine. I confess. A pinch of sugar in the sauce. I cheated.`],
          ['Grandma Bea', `I KNEW it. ...I used more than a pinch. Friends, you old crook?`],
        ],
        { prop: 'golden-ladle', cue: 'reunion' },
      ),
      panel(
        'dorchester',
        [
          ['trish-vance', 'sad'],
          ['grandma-bea', 'neutral'],
        ],
        `Trish's phone rings. Victor, on speaker, ready to announce.`,
        [
          ['Trish', `Victor. Great n... No. Boston is theirs. All of it. I lied every quarter.`],
          ['Grandma Bea', `Louder, sweetheart. He's old.`],
        ],
        { prop: 'phone' },
      ),
      panel(
        'megaslice-hq',
        [['victor-crust', 'angry']],
        `Victor opens his blinds for the first time since he moved in. Rosa's, on every block.`,
        [
          ['Victor Crust', `I PROMOTED you for this? You're fired! You're... un-heired!`],
          ['Victor Crust', `Keep your cold little city. I have a map. It's very, very big.`],
        ],
        { cue: 'victor-exit' },
      ),
      panel(
        'dorchester',
        [
          ['grandma-bea', 'happy'],
          ['trish-vance', 'happy'],
        ],
        `Boston is yours. On Victor's map, a new pin.`,
        [
          ['Grandma Bea', `Pots, Sundays, forever. And you call your grandmother.`],
          ['Trish', `Great news, Nana. I mean it this time. ...And I know where that pin is.`],
        ],
        { prop: 'name-tag', propText: 'PATRICIA · POTS', cue: 'city-theme' },
      ),
    ],
  },
];
