import type { Scene } from '../../types';

// ───────────────────────────── SUBURBS · Dale ─────────────────────────────
export const SUBURBS_SCENES: Scene[] = [
  {
    id: 'suburbs-1',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 1,
    title: 'Meet the Mudhens',
    trigger: { kind: 'unlock', neighborhood: 'suburbs' },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        caption: 'Snip! Your Suburbs pizzeria opens. Lawns, minivans, a loud whistle.',
        lines: [
          { speaker: 'Dale', text: 'Hey there, pal! Dale Hoffman, Mudhens coach. Welcome to the neighborhood!' },
          { speaker: 'Dale', text: 'We’re oh-and-fourteen this season. Which means we can only go up!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'sad' }],
        lines: [
          { speaker: 'Dale', text: 'Problem is, post-game snack is orange slices. The kids are… not inspired.' },
          { speaker: 'You', text: 'What if the post-game snack was pizza?' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        lines: [
          { speaker: 'Dale', text: 'PIZZA?! Pal, these families have big orders and bigger wallets.' },
          { speaker: 'Dale', text: 'Every pizza out here pays way more than Downtown. You picked a good spot!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        lines: [
          { speaker: 'Dale', text: 'Who runs this shop when you’re gone? Hire a manager, pal. Trust a coach.' },
          { speaker: 'Dale', text: 'Go, Mudhens! …That’s our chant. It’s a work in progress.' },
        ],
      },
    ],
  },
  {
    id: 'suburbs-2',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 2,
    title: 'A Real Goal',
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 300 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [],
        caption: 'Saturday. The Mudhens trail 6–0. Then the pizza arrives at halftime.',
        lines: [],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        caption: 'A kid named Tater kicks the ball. It goes in the RIGHT goal.',
        lines: [
          { speaker: 'Dale', text: 'Was that… the correct net? Somebody check! Somebody check the net!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        lines: [
          { speaker: 'Dale', text: 'We lost 6–1, but that’s the BEST loss in Mudhens history!' },
          { speaker: 'Dale', text: 'Pizza every game from now on. That’s not a request, pal. It’s a strategy.' },
        ],
      },
    ],
  },
  {
    id: 'suburbs-3',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 3,
    title: 'Sponsored by Sadness',
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 2000 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'The Mudhens are winning. Someone has noticed.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Free jerseys for the team! All you gotta do is say “MegaSlice” a lot.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [
          { id: 'dale', mood: 'surprised' },
          { id: 'megaslice-rep', mood: 'neutral' },
        ],
        lines: [
          { speaker: 'Dale', text: 'Gee, free jerseys. Our current ones are mostly ketchup stains.' },
          { speaker: 'MegaSlice Rep', text: 'And of course, team snack switches to MegaSlice Pizza Product.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Win the children, win the minivans. Win the minivans, win the suburbs.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'neutral' }],
        lines: [
          { speaker: 'Dale', text: 'Lemme think on it, pal. Championship’s coming up. We need every edge.' },
        ],
      },
    ],
  },
  {
    id: 'suburbs-4',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 4,
    title: 'Mudhens Rise',
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 8000 },
    perk: true,
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'neutral' }],
        caption: 'The championship. Mudhens vs. the undefeated Thunder Llamas.',
        lines: [
          { speaker: 'Dale', text: 'I told that MegaSlice fella no thanks. Jerseys don’t score goals. Pizza does.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        caption: 'Final seconds. Tied 2–2. Tater has the ball.',
        lines: [
          { speaker: 'Dale', text: 'Go, Tater, go! Not that way! THAT way! Yes! YES!' },
        ],
      },
      {
        backdrop: 'suburbs',
        cue: 'triumph',
        cast: [{ id: 'dale', mood: 'happy' }],
        caption: 'MUDHENS WIN. Somebody’s mom faints.',
        lines: [
          { speaker: 'Dale', text: 'Champions! The Mudhens are champions! I’m gonna cry. I’m crying.' },
          { speaker: 'Dale', text: 'Whole Suburbs is eating at your shop now, pal. You’re family.' },
        ],
      },
    ],
  },
];
