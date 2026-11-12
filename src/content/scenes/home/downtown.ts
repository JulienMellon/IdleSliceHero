import type { Scene } from '../../types';

// ───────────────────────────── DOWNTOWN · Nonna Rosa ─────────────────────────────
export const DOWNTOWN_SCENES: Scene[] = [
  {
    id: 'downtown-1',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 1,
    title: 'The Keys',
    trigger: { kind: 'unlock', neighborhood: 'downtown' },
    panels: [
      {
        backdrop: 'downtown-rain',
        cast: [],
        caption: 'Port Marinara. Rain. One flickering sign: “Rosa’s Pizza.”',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'sad' }],
        caption: 'Inside, one oven. Zero customers.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fifty years I run this shop. Now? Even the mice order from MegaSlice.' },
          { speaker: 'Nonna Rosa', text: 'My knees are done. So, cara mia… the keys are yours.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'What if we did delivery? Maybe an app? Some marketing?' },
          { speaker: 'Nonna Rosa', text: '“App.” “Marketing.” Modern ideas! In my day, the pizza WAS the marketing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fine. First you bake. Prep, oven, counter. Tap, tap, tap!' },
          { speaker: 'Nonna Rosa', text: 'Then hire help. Marco, Lucia, Benny: good kids. Capisce?' },
        ],
      },
      {
        backdrop: 'downtown',
        cue: 'welcome',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Make Downtown smell like Rosa’s again. I’ll be watching. Always watching.' },
        ],
      },
    ],
  },
  {
    id: 'downtown-2',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 2,
    title: 'First Regulars',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 12 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        caption: 'Twelve deliveries. The phone is actually ringing.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'The phone! It rings! I thought it was broken since 1997.' },
        ],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'The drivers, they come back fast. Hmph. Buy them better rides. Go faster.' },
          { speaker: 'You', text: 'Wait, are you endorsing a modern idea?' },
          { speaker: 'Nonna Rosa', text: 'I endorse nothing. I am simply… noticing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Twelve pizzas. Is small. Is a start. Keep going, eh?' },
        ],
      },
    ],
  },
  {
    id: 'downtown-3',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 3,
    title: 'Corporate Crust',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 45 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'A man in a very shiny suit walks in. He does not wipe his feet.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Love the vibe! Very “before electricity.” MegaSlice wants to buy it!' },
          { speaker: 'MegaSlice Rep', text: 'We’ll keep the name. Well, the “Pizza” part. Probably.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'nonna-rosa', mood: 'angry' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Out! Your crust tastes like a cardboard box that gave up!' },
          { speaker: 'MegaSlice Rep', text: 'Ma’am, our crust is 40% real bread!' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'neutral' }],
        lines: [
          { speaker: 'Victor Crust', text: 'One little shop said no? Adorable. Squeeze them.' },
          { speaker: 'Victor Crust', text: 'Every city bends to MegaSlice. Port Marinara will be no different.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'They want a fight? We give them pizza. Lots of pizza. Bake, bake!' },
        ],
      },
    ],
  },
  {
    id: 'downtown-4',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 4,
    title: 'The Secret Sauce',
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 150 },
    reward: 'auto-bake',
    panels: [
      {
        backdrop: 'downtown',
        cast: [],
        caption: 'A hundred and fifty deliveries. Downtown smells like Rosa’s again.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cue: 'triumph',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Your “modern ideas”… they work. Don’t tell anyone I said so.' },
          { speaker: 'Nonna Rosa', text: 'Come. Closer. Nobody has seen this card in fifty years.' },
        ],
      },
      {
        backdrop: 'shop',
        cue: 'recipe',
        prop: 'recipe-card',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'The secret sauce recipe. It is mostly love. And garlic.',
        lines: [
          { speaker: 'You', text: 'That’s it? Tomatoes, garlic, basil, and “a whisper of patience”?' },
          { speaker: 'Nonna Rosa', text: 'Is the whisper that matters.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'From now on, I run the Downtown kitchen myself. You rest your tapping finger.' },
          { speaker: 'Nonna Rosa', text: 'You go open shops in the other neighborhoods. Go! Before I get sentimental.' },
        ],
      },
    ],
  },
];
