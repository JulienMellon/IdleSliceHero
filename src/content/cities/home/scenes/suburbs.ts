import type { Scene } from '../../../types';

// ───────────────────────────── SUBURBS · Dale ─────────────────────────────
// Text is the Todd script (docs/story/STORY-v4-final.md, Julien 2026-11-14: where it disagrees with an earlier fix, the script wins) plus the v5.16 copy (docs/story/COPY-v5.16.md).
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
          { speaker: 'Dale', text: "We're oh-and-fourteen this season. Which means we can only go up!" },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'sad' }],
        lines: [
          { speaker: 'Dale', text: 'Problem is, post-game snack is orange slices. The kids are... not inspired.' },
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
          { speaker: 'Dale', text: "Who runs this shop when you're gone? Hire a manager, pal. Trust a coach." },
          { speaker: 'Dale', text: "Go, Mudhens! ...That's our chant. It's a work in progress." },
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
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 12430 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [],
        caption: 'Saturday. The Mudhens trail 6-0. Then the pizza arrives at halftime.',
        lines: [],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        caption: 'A kid named Tater kicks the ball. It goes in the RIGHT goal.',
        lines: [{ speaker: 'Dale', text: 'Was that... the correct net? Somebody check! Somebody check the net!' }],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        lines: [
          { speaker: 'Dale', text: 'We lost 6-1 but that is the BEST loss in Mudhens history!' },
          { speaker: 'Dale', text: "Pizza every game from now on. That's not a request, pal. It's a strategy." },
          { speaker: 'Patty', text: 'I already made Tater a new label. It says “RIGHT NET.” Laminated.' },
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
    trigger: { kind: 'deliveries', neighborhood: 'suburbs', count: 28045 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: 'The Mudhens are winning. Someone has noticed.',
        lines: [{ speaker: 'Todd', text: 'Free jerseys for the team! All you gotta do is say "MegaSlice" a lot.' }],
      },
      {
        backdrop: 'suburbs',
        cast: [
          { id: 'dale', mood: 'surprised' },
          { id: 'megaslice-rep', mood: 'neutral' },
        ],
        lines: [
          { speaker: 'Dale', text: 'Gee, free jerseys. Our current ones are mostly ketchup stains.' },
          { speaker: 'Todd', text: 'And of course, team snack switches to MegaSlice Pizza Product.' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        lines: [
          { speaker: 'Victor Crust', text: 'Win the children, win the minivans. Win the minivans, win the suburbs.' },
          { speaker: 'Victor Crust', text: 'Write that down, Rod.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'neutral' }],
        lines: [{ speaker: 'Dale', text: "Lemme think on it, pal. Championship's coming up. We need every edge." }],
      },
    ],
  },
  {
    id: 'suburbs-3b',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 'interlude',
    title: 'Coach Todd',
    trigger: { kind: 'after', neighborhood: 'suburbs', scene: 'suburbs-3', seconds: 150 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'megaslice-rep', mood: 'happy' }],
        caption: "The Thunder Llamas' practice. New sponsor. New assistant coach.",
        lines: [{ speaker: 'Todd', text: "Llamas! MegaSlice believes in you! Mostly because you're undefeated!" }],
      },
      {
        backdrop: 'suburbs',
        cast: [
          { id: 'dale', mood: 'happy' },
          { id: 'megaslice-rep', mood: 'surprised' },
        ],
        lines: [
          { speaker: 'Dale', text: 'Pal! Still thinking on your offer! Coach-to-coach handshake!' },
          { speaker: 'Todd', text: "We're rivals. I'm supposed to scare you. I can't lie, so: I'm not scary." },
          { speaker: 'Dale', text: 'Rivals can share orange slices! Here. Take two.' },
        ],
      },
      {
        backdrop: 'suburbs',
        prop: 'name-tag',
        propText: 'SENIOR ASSOCIATE',
        cast: [{ id: 'megaslice-rep', mood: 'sad' }],
        caption: "Todd's name tag now reads: SENIOR ASSOCIATE.",
        lines: [{ speaker: 'Todd', text: 'If the Llamas lose the final, I lose the "Senior."' }],
      },
    ],
  },
  {
    id: 'suburbs-hire',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 'interlude',
    title: 'Deb Takes the Counter',
    trigger: { kind: 'manager', neighborhood: 'suburbs' },
    panels: [
      {
        backdrop: 'shop',
        cast: [
          { id: 'dale', mood: 'happy' },
          { id: 'deb', mood: 'neutral' },
        ],
        caption: 'Dale holds the door for someone. He does not go first.',
        lines: [
          { speaker: 'Dale', text: 'You hired a manager, pal! Told ya. Trust a coach. Now, uh… trust Deb.' },
          { speaker: 'Dale', text: 'She runs the Mudhens snack bar. Nobody’s ever cut her line. Nobody’s ever tried.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [
          { id: 'deb', mood: 'neutral' },
          { id: 'dale', mood: 'surprised' },
        ],
        lines: [
          { speaker: 'Deb', text: 'Coach. Out of my kitchen.' },
          { speaker: 'Dale', text: 'Yes, ma’am.' },
          { speaker: 'Deb', text: 'Counter’s mine now. Ask me about the bake sale sometime. Dale knows which one.' },
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
    trigger: { kind: 'challenge', neighborhood: 'suburbs' },
    requires: ['suburbs-3b'],
    perk: true,
    panels: [
      {
        backdrop: 'suburbs',
        cast: [],
        caption: 'Across the street, the MegaSlice balloons are gone. One drifts past the window.',
        lines: [],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'neutral' }],
        caption: 'The championship. Mudhens vs. the undefeated Thunder Llamas.',
        lines: [
          { speaker: 'Dale', text: "I told that MegaSlice fella no thanks. Jerseys don't score goals. Pizza does." },
          { speaker: 'Deb', text: 'He tried my snack bar, too. He won’t try it twice.', ifSeen: 'suburbs-hire' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        caption: 'Final seconds. Tied 2-2. Tater has the ball.',
        lines: [{ speaker: 'Dale', text: 'Go, Tater, go! Not that way! THAT way! Yes! YES!' }],
      },
      {
        backdrop: 'suburbs',
        cue: 'triumph',
        cast: [
          { id: 'dale', mood: 'happy' },
          { id: 'megaslice-rep', mood: 'sad' },
        ],
        caption: "MUDHENS WIN. Somebody's mom faints. Todd eats an orange slice.",
        lines: [
          { speaker: 'Dale', text: "Champions! The Mudhens are champions! I'm gonna cry. I'm crying." },
          { speaker: 'Dale', text: "Whole Suburbs is eating at your shop now, pal. You're family." },
          { speaker: 'Dale', text: "Poor Todd lost the 'Senior.' Wonder what they make him do next." },
        ],
      },
    ],
  },
  {
    id: 'suburbs-5',
    city: 'home',
    character: 'dale',
    neighborhood: 'suburbs',
    beat: 'interlude',
    title: 'Biggest Fan',
    trigger: { kind: 'after', neighborhood: 'suburbs', scene: 'downtown-5', seconds: 600 },
    panels: [
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'happy' }],
        caption: 'Team photo day. The Mudhens are still champions. Dale still cries.',
        lines: [{ speaker: 'Dale', text: 'Everybody squeeze in! Tater, the trophy is not a hat!' }],
      },
      {
        backdrop: 'suburbs',
        cast: [
          { id: 'dale', mood: 'happy' },
          { id: 'mr-smith', mood: 'neutral' },
        ],
        caption: 'At the edge of the photo: a trench coat, a Mudhens scarf, a mustache.',
        lines: [
          { speaker: 'Dale', text: "That's Mr. Smith! Our biggest fan. Never misses a game." },
          { speaker: 'Dale', text: 'Never takes off the mustache. Even in the rain. It runs a little.' },
        ],
      },
      {
        backdrop: 'suburbs',
        cast: [{ id: 'dale', mood: 'surprised' }],
        lines: [
          { speaker: 'Dale', text: 'Asked me if I knew any computer geniuses. Said he has to "ruin one."' },
          { speaker: 'Dale', text: 'Then he said "I\'ve said too much" and ran into a minivan. Good hustle, though!' },
        ],
      },
    ],
  },
];
