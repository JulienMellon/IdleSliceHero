import type { Scene } from '../../../types';

// ───────────────────────────── DOWNTOWN · Nonna Rosa ─────────────────────────────
// Text is the Todd script (docs/story/STORY-v4-final.md, Julien 2026-11-14: where it disagrees with an earlier fix, the script wins) plus the v5.16 copy (docs/story/COPY-v5.16.md).
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
        cast: [{ id: 'mr-smith', mood: 'neutral' }],
        caption: 'Port Marinara. Rain. One flickering sign: "Rosa\'s Pizza."',
        lines: [
          { speaker: 'Trench Coat', text: 'Target located. Commencing surveillance.' },
          { speaker: 'Trench Coat', text: "Also I dropped my MegaSlice badge. Don't look at it." },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'sad' }],
        caption: 'Inside, one oven. Zero customers.',
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fifty years I run this shop. Now? Even the mice order from MegaSlice.' },
          { speaker: 'Nonna Rosa', text: 'My knees are done. So, cara mia... the keys are yours.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'What if we did delivery? Maybe an app? Some marketing?' },
          { speaker: 'Nonna Rosa', text: '"App." "Marketing." Modern ideas! In my day, the pizza WAS the marketing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Fine. First you bake. I show you how. Watch, then tap!' },
          { speaker: 'Nonna Rosa', text: 'Then hire workers. Drivers to deliver, more cooks for the kitchen. Capisce?' },
        ],
      },
      {
        backdrop: 'downtown',
        cue: 'welcome',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [{ speaker: 'Nonna Rosa', text: "Make Downtown smell like Rosa's again. I'll be watching. Always watching." }],
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
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 424 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        caption: 'Four hundred deliveries. The phone is actually ringing.',
        lines: [{ speaker: 'Nonna Rosa', text: 'The phone! It rings! I thought it was broken since 1997.' }],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'The drivers, they come back fast. Hmph. Buy them better rides. Go faster.' },
          { speaker: 'You', text: 'Wait, are you endorsing a modern idea?' },
          { speaker: 'Nonna Rosa', text: 'I endorse nothing. I am simply... noticing.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'You', text: 'Our first regular is a "Mr. Smith." He tipped in MegaSlice coupons.' },
          { speaker: 'Nonna Rosa', text: 'Suspicious. But a tip is a tip.' },
          { speaker: 'Nonna Rosa', text: 'Four hundred pizzas. Is small. Is a start. Keep going, eh?' },
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
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 941 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'Shiny suit. Muddy shoes. Name tag: TODD, VP OF EXPANSION.',
        lines: [
          { speaker: 'Todd', text: 'Love the vibe! Very "before electricity." MegaSlice wants to buy it!' },
          { speaker: 'Todd', text: 'We\'ll keep the name. Well, the "Pizza" part. Probably.' },
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
          { speaker: 'Todd', text: "Ma'am, our crust is 40% real bread!" },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'neutral' }],
        lines: [
          { speaker: 'Victor Crust', text: 'One little shop said no? Adorable. Squeeze them, Tad.' },
          { speaker: 'Victor Crust', text: 'Every city bends to MegaSlice. Port Marinara will be no different.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'They want a fight? We give them pizza. Lots of pizza. Bake, bake!' },
          { speaker: 'Lucia', text: 'My oven’s hot, Zia. Let them come. Nobody gets past that door.' },
        ],
      },
    ],
  },
  // v5.25 (card E10): the slot that splits the longest wait of session 1 (downtown-3 to downtown-4, 7 minutes) in two. PLACEHOLDER: W6 writes the scene, T3 lands it.
  // It is an interlude (no chapter, no task): it plays 200 s of play after downtown-3 and does not hold downtown-4 back.
  {
    id: 'downtown-3b',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'Downtown Interlude',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'downtown-3', seconds: 200 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'PLACEHOLDER 1/3: a short Downtown moment.',
        lines: [{ speaker: 'Nonna Rosa', text: 'PLACEHOLDER: keep baking, cara.' }],
      },
      {
        backdrop: 'downtown',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        caption: 'PLACEHOLDER 2/3.',
        lines: [{ speaker: 'Nonna Rosa', text: 'PLACEHOLDER: the line is longer today.' }],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'PLACEHOLDER 3/3.',
        lines: [{ speaker: 'Nonna Rosa', text: 'PLACEHOLDER: back to the ovens.' }],
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
    trigger: { kind: 'deliveries', neighborhood: 'downtown', count: 2217 },
    reward: 'auto-bake',
    panels: [
      {
        backdrop: 'downtown',
        cast: [],
        caption: "Two thousand deliveries. Before lunch. Downtown smells like Rosa's again.",
        lines: [],
      },
      {
        backdrop: 'shop',
        cue: 'triumph',
        cast: [{ id: 'nonna-rosa', mood: 'happy' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Your "modern ideas"... they work. Don\'t tell anyone I said so.' },
          { speaker: 'Nonna Rosa', text: 'Come. Closer. Nobody has seen this card in fifty years.' },
          { speaker: 'Marco', text: 'Ooh, can I see? I’ll wipe the flour off first. Some of it.' },
        ],
      },
      {
        backdrop: 'shop',
        cue: 'recipe',
        prop: 'recipe-card',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'The secret sauce recipe. It is mostly love. And garlic.',
        lines: [
          { speaker: 'You', text: 'That\'s it? Tomatoes, garlic, basil, and "a whisper of patience"?' },
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
  {
    id: 'downtown-5',
    city: 'home',
    character: 'nonna-rosa',
    neighborhood: 'downtown',
    beat: 'interlude',
    title: 'The Usual',
    trigger: { kind: 'after', neighborhood: 'downtown', scene: 'waterfront-4', seconds: 540 },
    panels: [
      {
        backdrop: 'shop',
        prop: 'order-slip',
        cast: [{ id: 'nonna-rosa', mood: 'neutral' }],
        caption: 'Downtown. Nonna is reading the order slips. All of them.',
        lines: [{ speaker: 'Nonna Rosa', text: 'This Mr. Smith. Every day, one large pepperoni. Every shop we open.' }],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'Today the driver brings back the empty box. Inside? A mustache.' },
          { speaker: 'You', text: 'Like... a real one?' },
          { speaker: 'Nonna Rosa', text: 'Drawn on. With a marker. It came off on the crust.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'nonna-rosa', mood: 'angry' }],
        lines: [
          { speaker: 'Nonna Rosa', text: 'In my day, spies had the decency to grow their own.' },
          { speaker: 'Nonna Rosa', text: 'Next time he orders, you tell me. I want to see this face.' },
        ],
      },
      {
        backdrop: 'shop',
        prop: 'order-slip',
        cast: [{ id: 'nonna-rosa', mood: 'surprised' }],
        caption: 'On the back of the slip: "Sorry in advance about the university. — S."',
        lines: [{ speaker: 'Nonna Rosa', text: "Sorry? Spies don't say sorry. Who IS this man?" }],
      },
    ],
  },
];
