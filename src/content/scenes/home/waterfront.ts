import type { Scene } from '../../types';

// ───────────────────────────── WATERFRONT · Marisol ─────────────────────────────
export const WATERFRONT_SCENES: Scene[] = [
  {
    id: 'waterfront-1',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 1,
    title: 'Old Salt',
    trigger: { kind: 'unlock', neighborhood: 'waterfront' },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [],
        caption: 'Your new place on the Waterfront opens. Gulls, fog, and old boats.',
        lines: [],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Ahoy, landlubber. Captain Marisol. Retired. Mostly. Your first customer.' },
          { speaker: 'Captain Marisol', text: 'Forty years I fished these waters. Now I just feed the gulls and complain.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Dock crews work all hours and tip like sailors. Generously, I mean.' },
          { speaker: 'Captain Marisol', text: 'Pizza out here fetches a fine price. You dropped anchor in the right spot.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Just keep the anchovies off mine. I’ve met enough fish for one lifetime.' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-2',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 2,
    title: 'Pizza Night Dockside',
    trigger: { kind: 'deliveries', neighborhood: 'waterfront', count: 3000 },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        caption: 'Friday nights, the whole dock eats together now.',
        lines: [
          { speaker: 'Captain Marisol', text: 'Haven’t seen this many folks on Pier 9 since the Great Lobster Escape of ’88.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'You', text: 'What happened in the Great Lobster Escape?' },
          { speaker: 'Captain Marisol', text: 'We don’t talk about it. They’re still out there.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'This dock’s been my home all my life. Nice to see it full again.' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-3',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 3,
    title: 'For Sale',
    trigger: { kind: 'deliveries', neighborhood: 'waterfront', count: 15000 },
    panels: [
      {
        backdrop: 'waterfront',
        prop: 'sold-sign',
        cast: [{ id: 'marisol', mood: 'sad' }],
        caption: 'A sign appears on Pier 9: “SOLD SOON — FUTURE MEGASLICE MEGASTORE.”',
        lines: [
          { speaker: 'Captain Marisol', text: 'The harbor board’s broke. They’re selling my dock to the highest bidder.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [
          { id: 'megaslice-rep', mood: 'happy' },
          { id: 'marisol', mood: 'angry' },
        ],
        lines: [
          { speaker: 'MegaSlice Rep', text: 'Picture it! A 40-story pizza megastore! With a parking lot for boats!' },
          { speaker: 'Captain Marisol', text: 'Boats don’t PARK, you barnacle!' },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        lines: [
          { speaker: 'Victor Crust', text: 'The auction closes soon. Outbid MegaSlice? With pizza money? Ha!' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'You', text: 'Then we sell a LOT of pizza. Captain, we’re buying your dock.' },
          { speaker: 'Captain Marisol', text: 'Hmph. Never bet against a stubborn crew. All hands!' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-4',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 4,
    title: 'Dock Saved',
    trigger: { kind: 'bid', neighborhood: 'waterfront' },
    perk: true,
    panels: [
      {
        backdrop: 'waterfront',
        cue: 'rep',
        cast: [{ id: 'megaslice-rep', mood: 'surprised' }],
        caption: 'Auction day. The final bid comes in… from a pizza shop.',
        lines: [
          { speaker: 'MegaSlice Rep', text: 'You outbid us? With PIZZA money? That’s not in my slideshow!' },
        ],
      },
      {
        backdrop: 'waterfront',
        cue: 'bell-triumph',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Pier 9 stays a pier! Somebody ring the bell!' },
          { speaker: 'Captain Marisol', text: 'You saved this old dock, kid. Saved me, too, I reckon.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        caption: 'The new sign on Pier 9 has a slice of pizza painted on it.',
        lines: [
          { speaker: 'Captain Marisol', text: 'Waterfront’s yours, Captain. Even the anchovies are on your side now.' },
        ],
      },
    ],
  },
];
