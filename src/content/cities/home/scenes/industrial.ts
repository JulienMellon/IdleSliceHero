import type { Scene } from '../../../types';

// ───────────────────────────── INDUSTRIAL · Big Sal ─────────────────────────────
// Text is the Todd script (docs/story/STORY-v4-final.md, Julien 2026-11-14: where it disagrees with an earlier fix, the script wins) plus the v5.16 copy (docs/story/COPY-v5.16.md).
export const INDUSTRIAL_SCENES: Scene[] = [
  {
    id: 'industrial-1',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 1,
    title: 'Night Shift',
    trigger: { kind: 'unlock', neighborhood: 'industrial' },
    panels: [
      {
        backdrop: 'industrial',
        cast: [],
        caption: 'Opening day in the Industrial Zone. Sparks, smoke, one very large man.',
        lines: [],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'angry' }],
        lines: [
          { speaker: 'Big Sal', text: 'You the pizza kid? I hate pizza. I hate kids. I hate Tuesdays.' },
          { speaker: 'You', text: "It's Thursday." },
          { speaker: 'Big Sal', text: 'Then I hate Thursdays.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: 'Three shifts. Hungry crews. Whole crates of pies at a time. Big money.' },
          { speaker: 'Big Sal', text: "Don't get excited. I said the money's big. Not that I like you." },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: "Hot by midnight. Cold pizza, you're done. Upgrade those ovens." },
          { speaker: 'Big Sal', text: "And get a manager. A shop that stops when you leave ain't a shop." },
        ],
      },
    ],
  },
  {
    id: 'industrial-2',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 2,
    title: 'Almost a Smile',
    trigger: { kind: 'deliveries', neighborhood: 'industrial', count: 100000 },
    panels: [
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        caption: 'Midnight. A hundred thousand pies in. Not one cold.',
        lines: [{ speaker: 'Big Sal', text: "Pizza's... fine. Crust's fine. Sauce is..." }],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'surprised' }],
        lines: [
          { speaker: 'Big Sal', text: "Wait. This sauce. Where'd you get this sauce?" },
          { speaker: 'You', text: "Family recipe. Well, somebody's family." },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'sad' }],
        lines: [
          { speaker: 'Big Sal', text: 'Hmph. Tastes like... something I used to know. Forget it. Back to work.' },
          { speaker: 'Rita', text: 'Leave him be, hon. Some sauces get you right here.' },
        ],
      },
    ],
  },
  {
    id: 'industrial-2b',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 'interlude',
    title: '3 A.M.',
    trigger: { kind: 'after', neighborhood: 'industrial', scene: 'industrial-2', seconds: 420 },
    panels: [
      {
        backdrop: 'industrial',
        cast: [
          { id: 'big-sal', mood: 'neutral' },
          { id: 'mr-smith', mood: 'surprised' },
        ],
        caption: '3 a.m. A man in a trench coat buys twelve pizzas. Big Sal notices.',
        lines: [
          { speaker: 'Big Sal', text: "Nobody buys twelve pies at 3 a.m. unless they're hiding something." },
          { speaker: 'Mr. Smith', text: "I'm hiding... from my job." },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [
          { id: 'big-sal', mood: 'neutral' },
          { id: 'mr-smith', mood: 'sad' },
        ],
        lines: [
          { speaker: 'Big Sal', text: "What's the job?" },
          { speaker: 'Mr. Smith', text: "Can't say. Something with machines. Here. Soon. I'm sorry." },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'happy' }],
        lines: [
          { speaker: 'Big Sal', text: 'Kid. A man who hides from his job needs a new job.' },
          { speaker: 'Big Sal', text: "Also you drew your mustache on upside down. Don't tell me why. I hate why." },
        ],
      },
    ],
  },
  {
    id: 'industrial-hire',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 'interlude',
    title: 'Nobody Yells at Ox',
    trigger: { kind: 'manager', neighborhood: 'industrial' },
    panels: [
      {
        backdrop: 'shop',
        cast: [
          { id: 'big-sal', mood: 'neutral' },
          { id: 'dee', mood: 'neutral' },
        ],
        caption: 'Big Sal walks in. The crew stands up straighter. It isn’t for Sal.',
        lines: [
          { speaker: 'Big Sal', text: 'Told ya. A shop that stops when you leave ain’t a shop. So I brought Dee.' },
          { speaker: 'Big Sal', text: 'My shift steward. Runs every shift on the line. And me. Mostly me.' },
          { speaker: 'Dee', text: 'Mostly.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'dee', mood: 'happy' }],
        lines: [
          { speaker: 'Dee', text: 'Rules, kid. Breaks on time. Ovens hot. Nobody yells at Ox.' },
          { speaker: 'Dee', text: 'Rule one: nobody opens Sal’s locker. Rule two: I have the key.' },
        ],
      },
    ],
  },
  {
    id: 'industrial-3',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 3,
    title: 'Vending Machine War',
    trigger: { kind: 'deliveries', neighborhood: 'industrial', count: 360000 },
    requires: ['industrial-2b'],
    panels: [
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Overnight, MegaSlice vending machines appear in every break room.',
        lines: [{ speaker: 'Todd', text: "Pizza from a machine! 90 seconds! It's hot on the outside! Mostly!" }],
      },
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [
          { id: 'big-sal', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        caption: "Todd's name tag: VENDING RESTOCKER.",
        lines: [
          { speaker: 'Big Sal', text: 'One of my guys bit into that thing and chipped a tooth.' },
          { speaker: 'Todd', text: "That's our Crunch-Crust! The crunch is... structural." },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'angry' }],
        lines: [{ speaker: 'Victor Crust', text: 'Why are factory workers still ordering from that little shop? FIX IT, Ted.' }],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: "Kid. Keep the real pizza coming. I'll handle the machines." },
          { speaker: 'Dee', text: 'The steward didn’t hear that, Sal. The steward is looking at a wall.', ifSeen: 'industrial-hire' },
        ],
      },
    ],
  },
  {
    id: 'industrial-3b',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 'interlude',
    title: 'Nobody Saw Anything',
    trigger: { kind: 'after', neighborhood: 'industrial', scene: 'industrial-3', seconds: 660 },
    panels: [
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [{ id: 'megaslice-rep', mood: 'sad' }],
        caption: 'Midnight. Todd stands in front of his own vending machine.',
        lines: [{ speaker: 'Todd', text: "I restock these. I've never once eaten from one." }],
      },
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [
          { id: 'big-sal', mood: 'surprised' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        caption: 'Big Sal walks in holding bolt cutters. Todd is holding the power cord.',
        lines: [
          { speaker: 'Big Sal', text: '...Twelve pies, 3 a.m.?' },
          { speaker: 'Todd', text: 'Hi.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [
          { id: 'big-sal', mood: 'neutral' },
          { id: 'megaslice-rep', mood: 'happy' },
        ],
        lines: [
          { speaker: 'Big Sal', text: "You didn't see me." },
          { speaker: 'Todd', text: "I didn't see you. I can't lie, so I'm closing my eyes now." },
        ],
      },
    ],
  },
  {
    id: 'industrial-4',
    city: 'home',
    character: 'big-sal',
    neighborhood: 'industrial',
    beat: 4,
    title: 'Brother Sal',
    trigger: { kind: 'challenge', neighborhood: 'industrial' },
    requires: ['industrial-3b'],
    perk: true,
    panels: [
      {
        backdrop: 'industrial',
        cast: [],
        caption: 'Across the street, the all-night MegaSlice is dark. The door finally closed.',
        lines: [],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'happy' }],
        caption: 'The MegaSlice machines are gone. Mysteriously. Nobody saw anything.',
        lines: [{ speaker: 'Big Sal', text: 'My crew voted. Your pizza only. Unanimous. Even Gary, and Gary hates voting.' }],
      },
      {
        backdrop: 'shop',
        cue: 'reunion',
        cast: [
          { id: 'big-sal', mood: 'neutral' },
          { id: 'nonna-rosa', mood: 'surprised' },
        ],
        caption: "Big Sal visits Rosa's Downtown shop for the first time.",
        lines: [
          { speaker: 'Nonna Rosa', text: '...Salvatore?' },
          { speaker: 'Big Sal', text: 'Hi, Rosie. Forty years. I knew that sauce the second I tasted it.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'big-sal', mood: 'sad' },
          { id: 'nonna-rosa', mood: 'sad' },
        ],
        lines: [
          { speaker: 'Big Sal', text: 'I was a stubborn fool. Left over a fight about... what was it?' },
          { speaker: 'Nonna Rosa', text: "Pineapple. You put pineapple on Mama's pizza." },
          { speaker: 'Big Sal', text: "And I'd do it again. ...But I'm sorry I left." },
        ],
      },
      {
        backdrop: 'shop',
        cue: 'triumph',
        cast: [
          { id: 'big-sal', mood: 'happy' },
          { id: 'nonna-rosa', mood: 'happy' },
        ],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Come here, you big meatball.' },
          { speaker: 'Big Sal', text: "Kid, you brought my family back. Industrial's yours. And so's my Thursday." },
          { speaker: 'Big Sal', text: "Your mustache kid came by. Says he's off to Uptown. Wouldn't say as what." },
        ],
      },
    ],
  },
];
