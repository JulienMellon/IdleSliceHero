import type { Scene } from '../../../types';
import { PIER9_BID } from '../data';

// ───────────────────────────── WATERFRONT · Marisol ─────────────────────────────
// Text is the Todd script (docs/story/STORY-v4-final.md, Julien 2026-11-14: where it disagrees with an earlier fix, the script wins) plus the v5.16 copy (docs/story/COPY-v5.16.md).
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
        lines: [{ speaker: 'Captain Marisol', text: "Just keep the anchovies off mine. I've met enough fish for one lifetime." }],
      },
    ],
  },
  {
    id: 'waterfront-1b',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 'interlude',
    title: 'The Lookout',
    trigger: { kind: 'after', neighborhood: 'waterfront', scene: 'waterfront-1', seconds: 540 },
    panels: [
      {
        backdrop: 'shop',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        caption: 'Captain Marisol has claimed the stool by the window. It faces the sea.',
        lines: [
          { speaker: 'Captain Marisol', text: 'Every shop needs a lookout. I’m the lookout. Also the customer.' },
          { speaker: 'You', text: 'Want a menu?' },
          { speaker: 'Captain Marisol', text: 'I want what I had yesterday. Hold the fish.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Fog rolls in at noon and out by supper. Like a regular.' },
          { speaker: 'Captain Marisol', text: 'Dock crews can’t see a thing in it. They follow your oven by the smell.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'Gus', text: 'Captain. Oven’s running hot. Seen hotter. In a storm.' },
          { speaker: 'Captain Marisol', text: 'Then feed it, Gus. And kid, ask me about this dock sometime. Not today.' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-1c',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 'interlude',
    title: 'Gulls and Crews',
    trigger: { kind: 'after', neighborhood: 'waterfront', scene: 'downtown-4b', seconds: 540 },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        caption: 'A fishing boat ties up at the dock. Its crew follows the smell.',
        lines: [{ speaker: 'Captain Marisol', text: 'That’s the Gray Gull. Her crew eats like gulls. Loud, and all at once.' }],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'surprised' }],
        lines: [
          { speaker: 'You', text: 'Nonna Rosa asked if you still shout at gulls.' },
          { speaker: 'Captain Marisol', text: 'Rosa? Rosa from the bread stall? She’s still alive and still nosy?' },
          { speaker: 'Captain Marisol', text: 'Ha! Of course she is. Too stubborn for anything else.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'Finn', text: 'Captain! The crew wants their pies tied up with string!' },
          { speaker: 'Captain Marisol', text: 'Then tie ’em, Finn. A bowline. And kid: tell Rosa I haven’t forgotten the sardine.' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-1d',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 'interlude',
    title: 'Don’t Tell Rosa',
    trigger: { kind: 'after', neighborhood: 'waterfront', scene: 'downtown-4c', seconds: 540 },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'angry' }],
        lines: [
          { speaker: 'You', text: 'Nonna says her pizza feeds the whole Waterfront now.' },
          { speaker: 'Captain Marisol', text: 'Her pizza. In MY harbor. In MY fog.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        caption: 'Marisol takes a slice. Then another. Slowly.',
        lines: [
          { speaker: 'Captain Marisol', text: 'Fine. It’s good. Don’t you dare tell her I said so.' },
          { speaker: 'You', text: 'My lips are sealed, Captain.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Look at this crowd, kid. A shop this busy needs a manager.' },
          { speaker: 'Captain Marisol', text: 'Hire one, and I’ll make an introduction. I know a fellow.' },
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
        lines: [{ speaker: 'Captain Marisol', text: "Haven't seen this many folks on Pier 9 since the Great Lobster Escape of '88." }],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'You', text: 'What happened in the Great Lobster Escape?' },
          { speaker: 'Captain Marisol', text: "We don't talk about it. They're still out there." },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: "This dock's been my home all my life. Nice to see it full again." },
          { speaker: 'Gus', text: 'Seen it fuller once. That was the storm, though. Mostly water.' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-hire',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 'interlude',
    title: 'Counted Twice',
    trigger: { kind: 'manager', neighborhood: 'waterfront' },
    panels: [
      {
        backdrop: 'shop',
        cast: [
          { id: 'marisol', mood: 'happy' },
          { id: 'skip', mood: 'neutral' },
        ],
        caption: 'Someone in a purser’s cap is already counting your napkins.',
        lines: [
          { speaker: 'Captain Marisol', text: 'Kid, meet Skip. Ferry purser, retired. Mostly. Like me.' },
          { speaker: 'Captain Marisol', text: 'He counts everything twice. Never lost a ticket, a crate or a passenger.' },
        ],
      },
      {
        backdrop: 'shop',
        cast: [{ id: 'skip', mood: 'happy' }],
        lines: [
          { speaker: 'Skip', text: 'Napkins: counted. Napkins: counted again. Good. We can open.' },
          { speaker: 'Skip', text: 'The ferry log from the Great Lobster Escape doesn’t add up. I counted twice.' },
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
        caption: 'A sign appears on Pier 9: "SOLD SOON — FUTURE MEGASLICE MEGASTORE."',
        lines: [
          { speaker: 'Captain Marisol', text: "The harbor board's broke. They're selling my dock to the highest bidder." },
          { speaker: 'Skip', text: 'Counted the board’s books twice. Broke both times.', ifSeen: 'waterfront-hire' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [
          { id: 'megaslice-rep', mood: 'happy' },
          { id: 'marisol', mood: 'angry' },
        ],
        lines: [
          { speaker: 'Todd', text: 'Picture it! A 40-story pizza megastore! With a parking lot for boats!' },
          { speaker: 'Captain Marisol', text: "Boats don't PARK, you barnacle!" },
        ],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'happy' }],
        lines: [
          { speaker: 'Victor Crust', text: 'An auction? Against MegaSlice? With pizza money? Ha!' },
          { speaker: 'Victor Crust', text: 'Go measure the pier, Tom.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'neutral' }],
        lines: [
          { speaker: 'You', text: "Then we sell a LOT of pizza. Captain, we're buying your dock." },
          { speaker: 'Captain Marisol', text: 'Hmph. Never bet against a stubborn crew. All hands!' },
        ],
      },
    ],
  },
  {
    id: 'waterfront-3b',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 'interlude',
    title: 'Man Overboard',
    trigger: { kind: 'deliveries', neighborhood: 'waterfront', count: PIER9_BID.unlockPizzas },
    requires: ['waterfront-3'],
    panels: [
      {
        backdrop: 'waterfront',
        cast: [{ id: 'megaslice-rep', mood: 'neutral' }],
        caption: 'Pier 9. Todd measures it for the megastore. Name tag: ASSOCIATE.',
        lines: [{ speaker: 'Todd', text: 'Forty stories... the pier is... eleven feet wide. That seems bad.' }],
      },
      {
        backdrop: 'waterfront',
        cast: [],
        caption: 'SPLASH.',
        lines: [],
      },
      {
        backdrop: 'waterfront',
        cast: [
          { id: 'marisol', mood: 'neutral' },
          { id: 'megaslice-rep', mood: 'sad' },
        ],
        caption: 'Marisol fishes him out with a boat hook.',
        lines: [
          { speaker: 'Captain Marisol', text: "Forty years I've hauled things out of this harbor. Never a salesman." },
          { speaker: 'Todd', text: "Please don't throw me back." },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: "Auction's open, kid. They raise every two minutes. Beat 'em to it." },
          { speaker: 'Captain Marisol', text: 'Bid from your Waterfront shop when the cash is in. All hands!' },
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
    requires: ['waterfront-3b'],
    perk: true,
    panels: [
      {
        backdrop: 'waterfront',
        cue: 'rep',
        cast: [{ id: 'megaslice-rep', mood: 'surprised' }],
        caption: 'Auction day. The final bid comes in... from a pizza shop.',
        lines: [{ speaker: 'Todd', text: "You outbid us? With PIZZA money? That's not in my slideshow!" }],
      },
      {
        backdrop: 'waterfront',
        cue: 'bell-triumph',
        cast: [{ id: 'marisol', mood: 'happy' }],
        lines: [
          { speaker: 'Captain Marisol', text: 'Pier 9 stays a pier! Somebody ring the bell!' },
          { speaker: 'Captain Marisol', text: "You saved this old dock, kid. Now I've got nowhere left to complain but your shop." },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'happy' }],
        caption: 'The new sign on Pier 9 has a slice of pizza painted on it.',
        lines: [{ speaker: 'Captain Marisol', text: "Waterfront's yours, Captain. Even the anchovies are on your side now." }],
      },
      {
        backdrop: 'megaslice-hq',
        cast: [{ id: 'victor-crust', mood: 'angry' }],
        lines: [{ speaker: 'Victor Crust', text: "Fine. Keep the dock. I'll buy their brains instead." }],
      },
    ],
  },
  {
    id: 'waterfront-5',
    city: 'home',
    character: 'marisol',
    neighborhood: 'waterfront',
    beat: 'interlude',
    title: 'The Lobster Incident',
    trigger: { kind: 'after', neighborhood: 'waterfront', scene: 'suburbs-5', seconds: 540 },
    panels: [
      {
        backdrop: 'waterfront',
        cast: [
          { id: 'marisol', mood: 'neutral' },
          { id: 'todd-coat', mood: 'sad' },
        ],
        caption: 'Night on Pier 9. A man in a trench coat is fishing. Badly.',
        lines: [
          { speaker: 'Captain Marisol', text: "You've been out here three hours. What're you after?" },
          { speaker: 'Mr. Smith', text: 'A lobster took my mustache.' },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [{ id: 'marisol', mood: 'surprised' }],
        lines: [
          { speaker: 'Captain Marisol', text: '...You met one of them.' },
          { speaker: 'Mr. Smith', text: 'Them?' },
          { speaker: 'Captain Marisol', text: "We don't talk about it. They're still out there." },
        ],
      },
      {
        backdrop: 'waterfront',
        cast: [
          { id: 'marisol', mood: 'neutral' },
          { id: 'todd-coat', mood: 'sad' },
        ],
        caption: 'His coat falls open. Name tag: INTERN.',
        lines: [
          { speaker: 'Mr. Smith', text: "I can't stay. Tomorrow I recruit at the university." },
          { speaker: 'Mr. Smith', text: 'With a smoke machine. Please forget I said that.' },
        ],
      },
    ],
  },
];
