import type { Scene } from '../../types';

// ───────────────────────────── INDUSTRIAL · Big Sal ─────────────────────────────
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
          { speaker: 'You', text: 'It’s Thursday.' },
          { speaker: 'Big Sal', text: 'Then I hate Thursdays.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: 'Three shifts. Hungry crews. Whole crates of pies at a time. Big money.' },
          { speaker: 'Big Sal', text: 'Don’t get excited. I said the money’s big. Not that I like you.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: 'Hot by midnight. Cold pizza, you’re done. Got it? Good.' },
          { speaker: 'Big Sal', text: 'And get a manager. A shop that stops when you leave ain’t a shop.' },
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
        lines: [
          { speaker: 'Big Sal', text: 'Pizza’s… fine. Crust’s fine. Sauce is…' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'surprised' }],
        lines: [
          { speaker: 'Big Sal', text: 'Wait. This sauce. Where’d you get this sauce?' },
          { speaker: 'You', text: 'Family recipe. Well, somebody’s family.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'sad' }],
        lines: [
          { speaker: 'Big Sal', text: 'Hmph. Tastes like… something I used to know. Forget it. Back to work.' },
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
    panels: [
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Overnight, MegaSlice vending machines appear in every break room.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Pizza from a machine! 90 seconds! It’s hot on the outside! Mostly!' },
        ],
      },
      {
        backdrop: 'industrial',
        prop: 'vending-machine',
        cast: [
          { id: 'big-sal', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        lines: [
          { speaker: 'Big Sal', text: 'One of my guys bit into that thing and chipped a tooth.' },
          { speaker: 'MegaSlice Rep', text: 'That’s our signature Crunch-Crust! Very premium!' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'angry' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Why are factory workers still ordering from that little shop? FIX IT.' },
        ],
      },
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'neutral' }],
        lines: [
          { speaker: 'Big Sal', text: 'Kid. Keep the real pizza coming. I’ll handle the machines.' },
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
    trigger: { kind: 'deliveries', neighborhood: 'industrial', count: 1000000 },
    perk: true,
    panels: [
      {
        backdrop: 'industrial',
        cast: [{ id: 'big-sal', mood: 'happy' }],
        caption: 'The MegaSlice machines are gone. Mysteriously. Nobody saw anything.',
        lines: [
          { speaker: 'Big Sal', text: 'My crew voted. Your pizza only. Unanimous. Even Gary, and Gary hates voting.' },
        ],
      },
      {
        backdrop: 'shop',
        cue: 'reunion',
        cast: [
          { id: 'big-sal', mood: 'neutral' },
          { id: 'nonna-rosa', mood: 'surprised' },
        ],
        caption: 'Big Sal visits Rosa’s Downtown shop for the first time.',
        lines: [
          { speaker: 'Nonna Rosa', text: '…Salvatore?' },
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
          { speaker: 'Big Sal', text: 'I was a stubborn fool. Left over a fight about… what was it?' },
          { speaker: 'Nonna Rosa', text: 'Pineapple. You put pineapple on Mama’s pizza.' },
          { speaker: 'Big Sal', text: 'And I’d do it again. …But I’m sorry I left.' },
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
          { speaker: 'Big Sal', text: 'Kid, you brought my family back. Industrial’s yours.' },
          { speaker: 'Big Sal', text: 'Heck. I might even like Thursdays now.' },
        ],
      },
    ],
  },
];
